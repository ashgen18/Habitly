import { weekday, type HabitLike } from "../habit-logic.ts"
import { analyzeHabit, rangeFrom, walkRange } from "./analytics.ts"
import { isScheduledOn, shiftISO } from "../habit-logic.ts"

export type Insight = {
  id: string
  text: string
}

/** Local, rule-based. Not an external AI model. */
export function generateInsights(
  habits: Array<HabitLike & { id: string; name: string }>,
  completions: Record<string, ReadonlySet<string>>,
  today: string,
  weekStartsOn: 0 | 1
): Insight[] {
  const insights: Insight[] = []
  const active = habits.filter((h) => !h.archivedAt)
  if (active.length === 0) return insights

  for (const habit of active) {
    const set = completions[habit.id] ?? new Set()
    const a = analyzeHabit(habit, set, today, weekStartsOn)
    if (a.rate30 > 0 && a.rate7 >= a.rate30 + 15) {
      insights.push({
        id: `improve-${habit.id}`,
        text: `You’ve improved ${habit.name} by ${a.rate7 - a.rate30} points this week versus the last 30 days.`,
      })
    }
    const from = rangeFrom(today, "90")
    const weekend = { d: 0, s: 0 }
    const weekdayB = { d: 0, s: 0 }
    const start = from < habit.startDate ? habit.startDate : from
    for (let cursor = start; cursor <= today; cursor = shiftISO(cursor, 1)) {
      if (!isScheduledOn(habit, cursor, set, weekStartsOn)) continue
      const w = weekday(cursor)
      const bucket = w === 0 || w === 6 ? weekend : weekdayB
      bucket.s += 1
      if (set.has(cursor)) bucket.d += 1
    }
    const wr = weekend.s ? weekend.d / weekend.s : 0
    const dr = weekdayB.s ? weekdayB.d / weekdayB.s : 0
    if (weekdayB.s >= 5 && weekend.s >= 2 && dr - wr >= 0.2) {
      insights.push({
        id: `weekend-${habit.id}`,
        text: `Your weekend consistency for ${habit.name} is significantly lower than weekdays.`,
      })
    }
  }

  if (active.length >= 2) {
    const [a, b] = active
    const sa = completions[a.id] ?? new Set()
    const sb = completions[b.id] ?? new Set()
    let both = 0
    let onlyA = 0
    for (const iso of sa) {
      if (iso < rangeFrom(today, "90")) continue
      if (sb.has(iso)) both += 1
      else onlyA += 1
    }
    if (both + onlyA >= 8 && both / (both + onlyA) >= 0.6) {
      insights.push({
        id: `pair-${a.id}-${b.id}`,
        text: `You complete ${b.name} more often on days you also complete ${a.name}.`,
      })
    }
  }

  return insights.slice(0, 5)
}

export type MonthlyReport = {
  title: string
  month: string
  consistency: number
  bestHabit: string | null
  mostImproved: string | null
  longestStreak: number
  totalCompletions: number
}

export function monthlyReport(
  habits: Array<HabitLike & { id: string; name: string }>,
  completions: Record<string, ReadonlySet<string>>,
  month: string,
  weekStartsOn: 0 | 1,
  today: string
): MonthlyReport {
  const from = `${month}-01`
  const y = Number(month.slice(0, 4))
  const m = Number(month.slice(5, 7))
  const last = new Date(y, m, 0)
  const toRaw = `${y}-${String(m).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`
  const to = toRaw > today ? today : toRaw
  let best: { name: string; pct: number } | null = null
  let longest = 0
  let total = 0
  let done = 0
  let scheduled = 0
  let improved: { name: string; delta: number } | null = null
  for (const habit of habits) {
    const set = completions[habit.id] ?? new Set()
    const a = analyzeHabit(habit, set, to, weekStartsOn)
    longest = Math.max(longest, a.bestStreak, a.currentStreak)
    const slice = walkRange(habit, set, from, to, weekStartsOn, to)
    total += slice.done
    done += slice.done
    scheduled += slice.scheduled
    const pct = slice.scheduled ? Math.round((slice.done / slice.scheduled) * 100) : 0
    if (!best || pct > best.pct) best = { name: habit.name, pct }
    const delta = a.rate7 - a.rate30
    if (delta > 0 && (!improved || delta > improved.delta)) {
      improved = { name: habit.name, delta }
    }
  }
  const names = ["January","February","March","April","May","June","July","August","September","October","November","December"]
  return {
    title: `${names[m - 1]} ${y} Habit Report`,
    month,
    consistency: scheduled ? Math.round((done / scheduled) * 100) : 0,
    bestHabit: best ? `${best.name} — ${best.pct}%` : null,
    mostImproved: improved ? `${improved.name} +${improved.delta}%` : null,
    longestStreak: longest,
    totalCompletions: total,
  }
}

export function yearlyReport(
  habits: Array<HabitLike & { id: string; name: string }>,
  completions: Record<string, ReadonlySet<string>>,
  year: string,
  weekStartsOn: 0 | 1,
  today: string
): MonthlyReport {
  const from = `${year}-01-01`
  const to = today.slice(0, 4) === year ? today : `${year}-12-31`
  let best: { name: string; pct: number } | null = null
  let longest = 0
  let total = 0
  let done = 0
  let scheduled = 0
  let improved: { name: string; delta: number } | null = null
  for (const habit of habits) {
    const set = completions[habit.id] ?? new Set()
    const a = analyzeHabit(habit, set, to, weekStartsOn)
    longest = Math.max(longest, a.bestStreak, a.currentStreak)
    const slice = walkRange(habit, set, from, to, weekStartsOn, to)
    total += slice.done
    done += slice.done
    scheduled += slice.scheduled
    const pct = slice.scheduled ? Math.round((slice.done / slice.scheduled) * 100) : 0
    if (!best || pct > best.pct) best = { name: habit.name, pct }
    const delta = a.rate7 - a.rate30
    if (delta > 0 && (!improved || delta > improved.delta)) {
      improved = { name: habit.name, delta }
    }
  }
  return {
    title: `${year} Habit Report`,
    month: year,
    consistency: scheduled ? Math.round((done / scheduled) * 100) : 0,
    bestHabit: best ? `${best.name} — ${best.pct}%` : null,
    mostImproved: improved ? `${improved.name} +${improved.delta}%` : null,
    longestStreak: longest,
    totalCompletions: total,
  }
}
