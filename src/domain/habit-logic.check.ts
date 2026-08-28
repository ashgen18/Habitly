import assert from "node:assert/strict"
import {
  validateHabitName,
  isScheduledOn,
  dayKind,
  currentDayStreak,
  bestDayStreak,
  currentWeekStreak,
  habitStats,
  overallWeek,
  nextReminderDate,
  type HabitLike,
} from "./habit-logic.ts"

const daily: HabitLike = { startDate: "2026-08-01", frequency: "daily" }
const weekdays: HabitLike = {
  startDate: "2026-08-01",
  frequency: "weekdays",
  scheduledDays: [1, 3, 5], // Mon Wed Fri
}
const thrice: HabitLike = {
  startDate: "2026-08-03",
  frequency: "times_per_week",
  targetPerWeek: 3,
}

assert.equal(validateHabitName(""), "Give this habit a name")
assert.equal(validateHabitName("   "), "Give this habit a name")
assert.equal(validateHabitName("Read"), null)
assert.equal(validateHabitName("x".repeat(49)), "Keep the name under 48 characters")

assert.equal(isScheduledOn(daily, "2026-07-31", new Set(), 1), false, "before start")
assert.equal(isScheduledOn(daily, "2026-08-01", new Set(), 1), true)
assert.equal(
  isScheduledOn({ ...daily, archivedAt: "2026-08-10" }, "2026-08-10", new Set(), 1),
  false,
  "archived not scheduled"
)

assert.equal(isScheduledOn(weekdays, "2026-08-03", new Set(), 1), true, "Monday")
assert.equal(isScheduledOn(weekdays, "2026-08-04", new Set(), 1), false, "Tuesday off")
assert.equal(isScheduledOn(weekdays, "2026-08-05", new Set(), 1), true, "Wednesday")

const twoDone = new Set(["2026-08-03", "2026-08-04"])
assert.equal(isScheduledOn(thrice, "2026-08-05", twoDone, 1), true, "still under target")
const threeDone = new Set(["2026-08-03", "2026-08-04", "2026-08-05"])
assert.equal(isScheduledOn(thrice, "2026-08-06", threeDone, 1), false, "target met")
assert.equal(isScheduledOn(thrice, "2026-08-05", threeDone, 1), true, "completed day stays scheduled")

assert.equal(dayKind(daily, "2026-08-10", new Set(["2026-08-10"]), "2026-08-14", 1), "completed")
assert.equal(dayKind(daily, "2026-08-11", new Set(["2026-08-10"]), "2026-08-14", 1), "missed")
assert.equal(dayKind(daily, "2026-08-14", new Set(["2026-08-10"]), "2026-08-14", 1), "due")
assert.equal(dayKind(daily, "2026-08-15", new Set(), "2026-08-14", 1), "future")
assert.equal(dayKind(weekdays, "2026-08-04", new Set(), "2026-08-14", 1), "off")

const consecutive = new Set(["2026-08-10", "2026-08-11", "2026-08-12", "2026-08-13", "2026-08-14"])
assert.equal(currentDayStreak(daily, consecutive, "2026-08-14", 1), 5)
assert.equal(currentDayStreak(daily, consecutive, "2026-08-15", 1), 5, "grace while today empty")
assert.equal(currentDayStreak(daily, consecutive, "2026-08-16", 1), 0, "missed day breaks")
assert.equal(currentDayStreak(daily, new Set(), "2026-08-14", 1), 0, "new habit")
assert.equal(currentDayStreak(daily, new Set(["2026-08-14"]), "2026-08-14", 1), 1, "one-day streak")
assert.equal(bestDayStreak(daily, consecutive, "2026-08-14", 1), 5)

const weekdayCompletions = new Set(["2026-08-03", "2026-08-05", "2026-08-07"])
assert.equal(
  currentDayStreak(weekdays, weekdayCompletions, "2026-08-07", 1),
  3,
  "Tue/Thu skipped, not missed"
)
assert.equal(dayKind(weekdays, "2026-08-04", weekdayCompletions, "2026-08-07", 1), "off")

const broken = new Set(["2026-08-03", "2026-08-10"])
assert.equal(currentDayStreak(weekdays, broken, "2026-08-10", 1), 1)
assert.equal(bestDayStreak(weekdays, weekdayCompletions, "2026-08-07", 1), 3)

const weeklyHits = new Set([
  "2026-08-03",
  "2026-08-04",
  "2026-08-05",
  "2026-08-10",
  "2026-08-11",
  "2026-08-12",
])
assert.equal(currentWeekStreak(thrice, weeklyHits, "2026-08-14", 1), 2)

const stats = habitStats(daily, consecutive, "2026-08-14", 1)
assert.equal(stats.totalCompletions, 5)
assert.equal(stats.currentStreak, 5)
assert.ok(stats.completionPct > 0)

const emptyStats = habitStats(daily, new Set(), "2026-08-01", 1)
assert.equal(emptyStats.totalCompletions, 0)
assert.equal(emptyStats.completionPct, 0)

const fullDay = habitStats(daily, new Set(["2026-08-01"]), "2026-08-01", 1)
assert.equal(fullDay.completionPct, 100)

const week = overallWeek([daily], [consecutive], "2026-08-14", 1)
assert.ok(week.total > 0)
assert.ok(week.pct >= 0)

const at = nextReminderDate("08:30", new Date(2026, 7, 14, 7, 0, 0))
assert.ok(at)
assert.equal(at.getHours(), 8)
assert.equal(at.getMinutes(), 30)
const later = nextReminderDate("08:30", new Date(2026, 7, 14, 9, 0, 0))
assert.ok(later)
assert.equal(later.getDate(), 15)

const archived: HabitLike = {
  ...daily,
  archivedAt: "2026-08-10",
}
assert.equal(currentDayStreak(archived, consecutive, "2026-08-14", 1), 0)
assert.equal(isScheduledOn(archived, "2026-08-09", consecutive, 1), true)

console.log("habit logic checks passed")
