/** Domain logic for habits. Self-contained so Node can test it without the app bundler. */

export type FrequencyKind =
  | "daily"
  | "weekdays"
  | "times_per_week"
  | "every_n_days"
  | "specific_dates"
  | "times_per_day"

export type HabitLike = {
  startDate: string
  archivedAt?: string
  frequency: FrequencyKind
  scheduledDays?: number[]
  targetPerWeek?: number
  everyNDays?: number
  specificDates?: string[]
  timesPerDay?: number
}

export type DayKind = "completed" | "missed" | "due" | "future" | "off"

export function toISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function shiftISO(iso: string, days: number): string {
  const date = parseISO(iso)
  date.setDate(date.getDate() + days)
  return toISO(date)
}

export function weekday(iso: string): number {
  return parseISO(iso).getDay()
}

export function startOfWeek(iso: string, weekStartsOn: 0 | 1): string {
  const day = weekday(iso)
  const offset = weekStartsOn === 1 ? (day === 0 ? 6 : day - 1) : day
  return shiftISO(iso, -offset)
}

export function startOfMonth(iso: string): string {
  const date = parseISO(iso)
  date.setDate(1)
  return toISO(date)
}

export function addMonths(iso: string, delta: number): string {
  const date = parseISO(iso)
  date.setMonth(date.getMonth() + delta)
  date.setDate(1)
  return toISO(date)
}

export function daysInMonth(iso: string): string[] {
  const start = startOfMonth(iso)
  const next = addMonths(start, 1)
  const out: string[] = []
  for (let cursor = start; cursor < next; cursor = shiftISO(cursor, 1)) {
    out.push(cursor)
  }
  return out
}

export function validateHabitName(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) return "Give this habit a name"
  if (trimmed.length > 48) return "Keep the name under 48 characters"
  return null
}

export function isScheduledOn(
  habit: HabitLike,
  iso: string,
  completed: ReadonlySet<string>,
  weekStartsOn: 0 | 1
): boolean {
  if (iso < habit.startDate) return false
  if (habit.archivedAt && iso >= habit.archivedAt) return false

  if (habit.frequency === "daily" || habit.frequency === "times_per_day") return true
  if (habit.frequency === "weekdays") {
    return (habit.scheduledDays ?? []).includes(weekday(iso))
  }
  if (habit.frequency === "every_n_days") {
    const n = Math.max(1, habit.everyNDays ?? 2)
    const from = parseISO(habit.startDate).getTime()
    const to = parseISO(iso).getTime()
    const diff = Math.round((to - from) / 86_400_000)
    return diff >= 0 && diff % n === 0
  }
  if (habit.frequency === "specific_dates") {
    return (habit.specificDates ?? []).includes(iso)
  }

  const target = Math.max(1, Math.min(7, habit.targetPerWeek ?? 3))
  const weekStart = startOfWeek(iso, weekStartsOn)
  if (completed.has(iso)) return true
  let doneBefore = 0
  for (let cursor = weekStart; cursor < iso; cursor = shiftISO(cursor, 1)) {
    if (completed.has(cursor)) doneBefore += 1
  }
  return doneBefore < target
}

export function dayKind(
  habit: HabitLike,
  iso: string,
  completed: ReadonlySet<string>,
  today: string,
  weekStartsOn: 0 | 1
): DayKind {
  if (iso < habit.startDate) return "off"
  if (habit.archivedAt && iso >= habit.archivedAt) return "off"
  if (!isScheduledOn(habit, iso, completed, weekStartsOn)) return "off"
  if (completed.has(iso)) return "completed"
  if (iso > today) return "future"
  if (iso === today) return "due"
  return "missed"
}

function previousScheduled(
  habit: HabitLike,
  iso: string,
  completed: ReadonlySet<string>,
  weekStartsOn: 0 | 1,
  limit = 400
): string | null {
  let cursor = shiftISO(iso, -1)
  for (let i = 0; i < limit; i++) {
    if (cursor < habit.startDate) return null
    if (isScheduledOn(habit, cursor, completed, weekStartsOn)) return cursor
    cursor = shiftISO(cursor, -1)
  }
  return null
}

/** Consecutive scheduled days ending today, or the last scheduled day if today is still empty. */
export function currentDayStreak(
  habit: HabitLike,
  completed: ReadonlySet<string>,
  today: string,
  weekStartsOn: 0 | 1
): number {
  let cursor = today
  if (isScheduledOn(habit, today, completed, weekStartsOn) && !completed.has(today)) {
    const prev = previousScheduled(habit, today, completed, weekStartsOn)
    if (!prev) return 0
    cursor = prev
  } else if (!isScheduledOn(habit, today, completed, weekStartsOn)) {
    const prev = previousScheduled(habit, today, completed, weekStartsOn)
    if (!prev) return 0
    cursor = prev
  }
  let n = 0
  while (cursor && cursor >= habit.startDate) {
    if (!isScheduledOn(habit, cursor, completed, weekStartsOn)) {
      const prev = previousScheduled(habit, cursor, completed, weekStartsOn)
      if (!prev) break
      cursor = prev
      continue
    }
    if (!completed.has(cursor)) break
    n += 1
    const prev = previousScheduled(habit, cursor, completed, weekStartsOn)
    if (!prev) break
    cursor = prev
  }
  return n
}

export function bestDayStreak(
  habit: HabitLike,
  completed: ReadonlySet<string>,
  today: string,
  weekStartsOn: 0 | 1
): number {
  const end = today < habit.startDate ? habit.startDate : today
  let best = 0
  let run = 0
  for (let cursor = habit.startDate; cursor <= end; cursor = shiftISO(cursor, 1)) {
    if (!isScheduledOn(habit, cursor, completed, weekStartsOn)) continue
    if (completed.has(cursor)) {
      run += 1
      best = Math.max(best, run)
    } else {
      run = 0
    }
  }
  return best
}

function weekMet(
  habit: HabitLike,
  weekStart: string,
  completed: ReadonlySet<string>
): boolean {
  const target = Math.max(1, Math.min(7, habit.targetPerWeek ?? 3))
  const weekEnd = shiftISO(weekStart, 6)
  let n = 0
  for (let cursor = weekStart; cursor <= weekEnd; cursor = shiftISO(cursor, 1)) {
    if (cursor < habit.startDate) continue
    if (habit.archivedAt && cursor >= habit.archivedAt) continue
    if (completed.has(cursor)) n += 1
  }
  return n >= target
}

export function currentWeekStreak(
  habit: HabitLike,
  completed: ReadonlySet<string>,
  today: string,
  weekStartsOn: 0 | 1
): number {
  let weekStart = startOfWeek(today, weekStartsOn)
  if (!weekMet(habit, weekStart, completed)) {
    weekStart = shiftISO(weekStart, -7)
  }
  let n = 0
  for (let i = 0; i < 52; i++) {
    const weekEnd = shiftISO(weekStart, 6)
    if (weekEnd < habit.startDate) break
    if (!weekMet(habit, weekStart, completed)) break
    n += 1
    weekStart = shiftISO(weekStart, -7)
  }
  return n
}

export function bestWeekStreak(
  habit: HabitLike,
  completed: ReadonlySet<string>,
  today: string,
  weekStartsOn: 0 | 1
): number {
  let weekStart = startOfWeek(habit.startDate, weekStartsOn)
  const last = startOfWeek(today, weekStartsOn)
  let best = 0
  let run = 0
  while (weekStart <= last) {
    if (weekMet(habit, weekStart, completed)) {
      run += 1
      best = Math.max(best, run)
    } else {
      run = 0
    }
    weekStart = shiftISO(weekStart, 7)
  }
  return best
}

export type HabitStats = {
  currentStreak: number
  bestStreak: number
  streakUnit: "day" | "week"
  totalCompletions: number
  scheduledCount: number
  completionPct: number
  weekDone: number
  weekTarget: number
}

export function countCompleted(completed: ReadonlySet<string>, from: string, to: string): number {
  let n = 0
  for (const iso of completed) {
    if (iso >= from && iso <= to) n += 1
  }
  return n
}

export function habitStats(
  habit: HabitLike,
  completed: ReadonlySet<string>,
  today: string,
  weekStartsOn: 0 | 1
): HabitStats {
  const weekly = habit.frequency === "times_per_week"
  let scheduledCount = 0
  let completedScheduled = 0
  if (today >= habit.startDate) {
    for (let cursor = habit.startDate; cursor <= today; cursor = shiftISO(cursor, 1)) {
      if (!isScheduledOn(habit, cursor, completed, weekStartsOn)) continue
      scheduledCount += 1
      if (completed.has(cursor)) completedScheduled += 1
    }
  }
  const weekStart = startOfWeek(today, weekStartsOn)
  const weekEnd = shiftISO(weekStart, 6)
  const cap = today < weekEnd ? today : weekEnd
  let weekTarget = 0
  let weekDone = 0
  for (let cursor = weekStart; cursor <= cap; cursor = shiftISO(cursor, 1)) {
    if (!isScheduledOn(habit, cursor, completed, weekStartsOn) && !completed.has(cursor)) {
      continue
    }
    if (isScheduledOn(habit, cursor, completed, weekStartsOn) || completed.has(cursor)) {
      weekTarget += 1
    }
    if (completed.has(cursor) && isScheduledOn(habit, cursor, completed, weekStartsOn)) {
      weekDone += 1
    }
  }
  if (weekly) {
    weekTarget = Math.max(1, Math.min(7, habit.targetPerWeek ?? 3))
    weekDone = 0
    for (let cursor = weekStart; cursor <= cap; cursor = shiftISO(cursor, 1)) {
      if (completed.has(cursor)) weekDone += 1
    }
    weekDone = Math.min(weekDone, weekTarget)
  }

  return {
    currentStreak: weekly
      ? currentWeekStreak(habit, completed, today, weekStartsOn)
      : currentDayStreak(habit, completed, today, weekStartsOn),
    bestStreak: weekly
      ? bestWeekStreak(habit, completed, today, weekStartsOn)
      : bestDayStreak(habit, completed, today, weekStartsOn),
    streakUnit: weekly ? "week" : "day",
    totalCompletions: completedScheduled,
    scheduledCount,
    completionPct:
      scheduledCount === 0 ? 0 : Math.round((completedScheduled / scheduledCount) * 100),
    weekDone,
    weekTarget,
  }
}

export function overallWeek(
  habits: HabitLike[],
  completions: ReadonlyArray<ReadonlySet<string>>,
  today: string,
  weekStartsOn: 0 | 1
): { done: number; total: number; pct: number } {
  let done = 0
  let total = 0
  habits.forEach((habit, i) => {
    const stats = habitStats(habit, completions[i] ?? new Set(), today, weekStartsOn)
    done += stats.weekDone
    total += stats.weekTarget
  })
  return {
    done,
    total,
    pct: total === 0 ? 0 : Math.round((done / total) * 100),
  }
}

export function nextReminderDate(
  reminderTime: string,
  now: Date
): Date | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(reminderTime)
  if (!match) return null
  const next = new Date(now)
  next.setHours(Number(match[1]), Number(match[2]), 0, 0)
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1)
  return next
}
