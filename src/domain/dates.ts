/** Local-calendar dates as YYYY-MM-DD. UTC would skip/double days near midnight. */

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

export function todayISO(now = new Date()): string {
  return toISO(now)
}

export function shiftISO(iso: string, days: number): string {
  const date = parseISO(iso)
  date.setDate(date.getDate() + days)
  return toISO(date)
}

export function startOfWeek(iso: string, weekStartsOn: 0 | 1): string {
  const date = parseISO(iso)
  const day = date.getDay() // 0 Sun … 6 Sat
  const offset = weekStartsOn === 1 ? (day === 0 ? 6 : day - 1) : day
  return shiftISO(iso, -offset)
}

export function daysBetween(fromISO: string, toISO: string): number {
  const a = parseISO(fromISO).getTime()
  const b = parseISO(toISO).getTime()
  return Math.round((b - a) / 86_400_000)
}

export function monthShort(iso: string): string {
  return parseISO(iso).toLocaleDateString("en-US", { month: "short" })
}

export function weekdayLong(iso: string): string {
  return parseISO(iso).toLocaleDateString("en-US", { weekday: "long" })
}

export function monthLong(iso: string): string {
  return parseISO(iso).toLocaleDateString("en-US", { month: "long" })
}

export function dayNumber(iso: string): number {
  return parseISO(iso).getDate()
}

export function greeting(now = new Date()): string {
  const hour = now.getHours()
  if (hour < 5) return "Still up"
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  if (hour < 21) return "Good evening"
  return "Good night"
}

export type WeekColumn = string[]

export function buildWeekColumns(
  endISO: string,
  weekCount: number,
  weekStartsOn: 0 | 1
): WeekColumn[] {
  const endWeekStart = startOfWeek(endISO, weekStartsOn)
  const firstWeekStart = shiftISO(endWeekStart, -(weekCount - 1) * 7)
  const columns: WeekColumn[] = []
  for (let w = 0; w < weekCount; w++) {
    const origin = shiftISO(firstWeekStart, w * 7)
    columns.push(
      Array.from({ length: 7 }, (_, i) => shiftISO(origin, i))
    )
  }
  return columns
}

export function lastNDays(endISO: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => shiftISO(endISO, -(n - 1 - i)))
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
