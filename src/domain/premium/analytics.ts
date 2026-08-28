import {
  currentDayStreak,
  bestDayStreak,
  currentWeekStreak,
  bestWeekStreak,
  dayKind,
  isScheduledOn,
  shiftISO,
  startOfWeek,
  startOfMonth,
  addMonths,
  weekday,
  type HabitLike,
} from "../habit-logic.ts"

export type RangeKey = "7" | "30" | "90" | "365" | "ytd"

export function rangeFrom(today: string, key: RangeKey): string {
  if (key === "ytd") return `${today.slice(0, 4)}-01-01`
  const days = Number(key)
  return shiftISO(today, -(days - 1))
}

export function walkRange(
  habit: HabitLike,
  completed: ReadonlySet<string>,
  from: string,
  to: string,
  weekStartsOn: 0 | 1,
  asOf = to
) {
  let scheduled = 0
  let done = 0
  let missed = 0
  if (to < from) return { scheduled, done, missed }
  const start = from < habit.startDate ? habit.startDate : from
  const end = to > asOf ? asOf : to
  for (let cursor = start; cursor <= end; cursor = shiftISO(cursor, 1)) {
    if (cursor > asOf) continue
    if (!isScheduledOn(habit, cursor, completed, weekStartsOn)) continue
    /* Partial current day: not missed, and not in the rate until checked. */
    if (cursor === asOf && !completed.has(cursor)) continue
    scheduled += 1
    if (completed.has(cursor)) done += 1
    else missed += 1
  }
  return { scheduled, done, missed }
}

function rate(done: number, scheduled: number): number {
  if (scheduled === 0) return 0
  return Math.round((done / scheduled) * 100)
}

function streakLengths(
  habit: HabitLike,
  completed: ReadonlySet<string>,
  today: string,
  weekStartsOn: 0 | 1
): number[] {
  const lengths: number[] = []
  let run = 0
  if (today < habit.startDate) return lengths
  for (let cursor = habit.startDate; cursor <= today; cursor = shiftISO(cursor, 1)) {
    if (!isScheduledOn(habit, cursor, completed, weekStartsOn)) continue
    if (completed.has(cursor)) {
      run += 1
    } else if (run > 0) {
      lengths.push(run)
      run = 0
    }
  }
  if (run > 0) lengths.push(run)
  return lengths
}

export type HabitAnalytics = {
  rate7: number
  rate30: number
  rate90: number
  rateYtd: number
  rate365: number
  currentStreak: number
  bestStreak: number
  averageStreak: number
  streakUnit: "day" | "week"
  totalCompletions: number
  missedScheduled: number
  completionPct: number
  consistencyScore: number
}

export function analyzeHabit(
  habit: HabitLike,
  completed: ReadonlySet<string>,
  today: string,
  weekStartsOn: 0 | 1
): HabitAnalytics {
  const weekly = habit.frequency === "times_per_week"
  const all = walkRange(habit, completed, habit.startDate, today, weekStartsOn)
  const last = (n: RangeKey) =>
    walkRange(habit, completed, rangeFrom(today, n), today, weekStartsOn, today)
  const d7 = last("7")
  const d30 = last("30")
  const d90 = last("90")
  const ytd = last("ytd")
  const d365 = last("365")
  const lengths = streakLengths(habit, completed, today, weekStartsOn)
  const averageStreak =
    lengths.length === 0
      ? 0
      : Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length)
  return {
    rate7: rate(d7.done, d7.scheduled),
    rate30: rate(d30.done, d30.scheduled),
    rate90: rate(d90.done, d90.scheduled),
    rateYtd: rate(ytd.done, ytd.scheduled),
    rate365: rate(d365.done, d365.scheduled),
    currentStreak: weekly
      ? currentWeekStreak(habit, completed, today, weekStartsOn)
      : currentDayStreak(habit, completed, today, weekStartsOn),
    bestStreak: weekly
      ? bestWeekStreak(habit, completed, today, weekStartsOn)
      : bestDayStreak(habit, completed, today, weekStartsOn),
    averageStreak,
    streakUnit: weekly ? "week" : "day",
    totalCompletions: all.done,
    missedScheduled: all.missed,
    completionPct: rate(all.done, all.scheduled),
    consistencyScore: rate(d30.done, d30.scheduled),
  }
}

export type SeriesPoint = { label: string; value: number; hint: string }

export function completionTrend(
  habit: HabitLike,
  completed: ReadonlySet<string>,
  today: string,
  weekStartsOn: 0 | 1,
  key: RangeKey
): SeriesPoint[] {
  const from = rangeFrom(today, key)
  const points: SeriesPoint[] = []
  const step = key === "7" || key === "30" ? 1 : 7
  for (let cursor = from; cursor <= today; cursor = shiftISO(cursor, step)) {
    const end = shiftISO(cursor, step - 1)
    const cap = end > today ? today : end
    const slice = walkRange(habit, completed, cursor, cap, weekStartsOn, today)
    points.push({
      label: cursor.slice(5),
      value: rate(slice.done, slice.scheduled),
      hint: `${slice.done}/${slice.scheduled || 0} scheduled`,
    })
  }
  return points
}

export function weeklySeries(
  habit: HabitLike,
  completed: ReadonlySet<string>,
  today: string,
  weekStartsOn: 0 | 1,
  weeks = 12
): SeriesPoint[] {
  const points: SeriesPoint[] = []
  let start = startOfWeek(today, weekStartsOn)
  for (let i = 0; i < weeks; i++) {
    const end = shiftISO(start, 6)
    const cap = end > today ? today : end
    const slice = walkRange(habit, completed, start, cap, weekStartsOn, today)
    points.unshift({
      label: start.slice(5),
      value: rate(slice.done, slice.scheduled),
      hint: `${slice.done}/${slice.scheduled || 0}`,
    })
    start = shiftISO(start, -7)
  }
  return points
}

export function monthlySeries(
  habit: HabitLike,
  completed: ReadonlySet<string>,
  today: string,
  weekStartsOn: 0 | 1,
  months = 12
): SeriesPoint[] {
  const points: SeriesPoint[] = []
  let month = startOfMonth(today)
  for (let i = 0; i < months; i++) {
    const next = addMonths(month, 1)
    const end = shiftISO(next, -1)
    const cap = end > today ? today : end
    const slice = walkRange(habit, completed, month, cap, weekStartsOn, today)
    points.unshift({
      label: month.slice(0, 7),
      value: rate(slice.done, slice.scheduled),
      hint: `${slice.done}/${slice.scheduled || 0}`,
    })
    month = addMonths(month, -1)
  }
  return points
}

export function weekdaySeries(
  habit: HabitLike,
  completed: ReadonlySet<string>,
  today: string,
  weekStartsOn: 0 | 1
): SeriesPoint[] {
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const buckets = names.map(() => ({ done: 0, scheduled: 0 }))
  const from = rangeFrom(today, "90")
  const start = from < habit.startDate ? habit.startDate : from
  for (let cursor = start; cursor <= today; cursor = shiftISO(cursor, 1)) {
    if (!isScheduledOn(habit, cursor, completed, weekStartsOn)) continue
    const i = weekday(cursor)
    buckets[i].scheduled += 1
    if (completed.has(cursor)) buckets[i].done += 1
  }
  return names.map((label, i) => ({
    label,
    value: rate(buckets[i].done, buckets[i].scheduled),
    hint: `${buckets[i].done}/${buckets[i].scheduled || 0}`,
  }))
}

export function streakHistory(
  habit: HabitLike,
  completed: ReadonlySet<string>,
  today: string,
  weekStartsOn: 0 | 1
): SeriesPoint[] {
  return streakLengths(habit, completed, today, weekStartsOn)
    .slice(-12)
    .map((value, i) => ({
      label: `#${i + 1}`,
      value,
      hint: `${value} ${habit.frequency === "times_per_week" ? "weeks" : "days"}`,
    }))
}

export function categoryConsistency(
  habits: HabitLike[],
  completions: ReadonlyArray<ReadonlySet<string>>,
  today: string,
  weekStartsOn: 0 | 1
): number {
  let done = 0
  let scheduled = 0
  habits.forEach((habit, i) => {
    const slice = walkRange(habit, completions[i] ?? new Set(), rangeFrom(today, "30"), today, weekStartsOn)
    done += slice.done
    scheduled += slice.scheduled
  })
  return rate(done, scheduled)
}

void dayKind
