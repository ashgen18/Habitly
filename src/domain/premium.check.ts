import assert from "node:assert/strict"
import { isScheduledOn, type HabitLike } from "./habit-logic.ts"
import { migrateToV3 } from "./migrate.ts"
import {
  analyzeHabit,
  walkRange,
} from "./premium/analytics.ts"
import {
  canAccessFeature,
  isPremiumActive,
  PremiumFeature,
  FREE_ENTITLEMENT,
} from "./premium/entitlement.ts"
import { goalProgress, reorderIds, type Goal } from "./premium/organization.ts"
import { evaluateAchievements } from "./premium/achievements.ts"
import { mergeByUpdatedAt } from "./premium/sync.ts"

const daily: HabitLike = { startDate: "2026-08-01", frequency: "daily" }
const today = "2026-08-14"
const allDays = new Set([
  "2026-08-01",
  "2026-08-02",
  "2026-08-03",
  "2026-08-04",
  "2026-08-05",
  "2026-08-06",
  "2026-08-07",
  "2026-08-08",
  "2026-08-09",
  "2026-08-10",
  "2026-08-11",
  "2026-08-12",
  "2026-08-13",
  "2026-08-14",
])

const perfect = analyzeHabit(daily, allDays, today, 1)
assert.equal(perfect.rate7, 100, "7-day")
assert.equal(perfect.rate30, 100, "30-day")
assert.equal(perfect.rate90, 100, "90-day")
assert.equal(perfect.rateYtd, 100, "yearly/ytd")
assert.equal(perfect.completionPct, 100, "completion %")
assert.equal(perfect.consistencyScore, 100, "consistency")
assert.equal(perfect.bestStreak, 14, "best streak")
assert.equal(perfect.averageStreak, 14, "average streak")
assert.equal(perfect.missedScheduled, 0)
assert.equal(perfect.totalCompletions, 14)

const missedOne = new Set([...allDays].filter((d) => d !== "2026-08-12"))
const missed = analyzeHabit(daily, missedOne, today, 1)
assert.ok(missed.rate7 < 100)
assert.equal(missed.missedScheduled, 1)
assert.ok(missed.bestStreak >= missed.averageStreak)

const weekdays: HabitLike = {
  startDate: "2026-08-01",
  frequency: "weekdays",
  scheduledDays: [1, 3, 5],
}
const tueOff = walkRange(weekdays, new Set(), "2026-08-04", "2026-08-04", 1, "2026-08-14")
assert.equal(tueOff.scheduled, 0, "non-scheduled day is not missed")
assert.equal(tueOff.missed, 0)

const newborn = analyzeHabit({ startDate: today, frequency: "daily" }, new Set(), today, 1)
assert.equal(newborn.totalCompletions, 0, "new habit")
assert.equal(newborn.missedScheduled, 0, "today still in progress")

const archived: HabitLike = { ...daily, archivedAt: "2026-08-10" }
assert.equal(isScheduledOn(archived, "2026-08-14", allDays, 1), false)

const everyN: HabitLike = { startDate: "2026-08-01", frequency: "every_n_days", everyNDays: 3 }
assert.equal(isScheduledOn(everyN, "2026-08-01", new Set(), 1), true)
assert.equal(isScheduledOn(everyN, "2026-08-02", new Set(), 1), false)
assert.equal(isScheduledOn(everyN, "2026-08-04", new Set(), 1), true)

const dated: HabitLike = {
  startDate: "2026-08-01",
  frequency: "specific_dates",
  specificDates: ["2026-08-10", "2026-08-20"],
}
assert.equal(isScheduledOn(dated, "2026-08-10", new Set(), 1), true)
assert.equal(isScheduledOn(dated, "2026-08-11", new Set(), 1), false)

const multi: HabitLike = { startDate: "2026-08-01", frequency: "times_per_day", timesPerDay: 8 }
assert.equal(isScheduledOn(multi, "2026-08-14", new Set(), 1), true, "times per day still daily-shaped")

const weekend: HabitLike = {
  startDate: "2026-08-01",
  frequency: "weekdays",
  scheduledDays: [0, 6],
}
assert.equal(isScheduledOn(weekend, "2026-08-08", new Set(), 1), true, "Saturday")
assert.equal(isScheduledOn(weekend, "2026-08-10", new Set(), 1), false, "Monday off")

assert.equal(canAccessFeature(FREE_ENTITLEMENT, PremiumFeature.goals), false, "free locked")
assert.equal(
  canAccessFeature(
    {
      status: "premium",
      source: "storekit",
      productId: "habitly_premium_monthly",
      expiresAt: null,
    },
    PremiumFeature.goals
  ),
  false,
  "client entitlement is not proof of Premium"
)
assert.equal(
  isPremiumActive({
    status: "premium",
    source: "storekit",
    productId: "x",
    expiresAt: null,
  }),
  false,
  "client premium flag is ignored"
)
assert.equal(canAccessFeature(FREE_ENTITLEMENT, PremiumFeature.advancedAnalytics), false)

const goal: Goal = {
  id: "g1",
  name: "Exercise 4x",
  habitId: "h",
  period: "weekly",
  target: 4,
  startDate: "2026-08-01",
  endDate: null,
  createdAt: "",
  updatedAt: "",
}
const weekProg = goalProgress(goal, new Set(["2026-08-24", "2026-08-25"]), "2026-08-25", 1)
assert.equal(weekProg.current, 2)
assert.equal(weekProg.remaining, 2)
assert.equal(weekProg.complete, false)

const dailyGoal: Goal = { ...goal, id: "g2", period: "daily", target: 1 }
assert.equal(goalProgress(dailyGoal, new Set(["2026-08-25"]), "2026-08-25", 1).complete, true)

const expired: Goal = { ...goal, id: "g3", endDate: "2026-08-01" }
assert.equal(goalProgress(expired, new Set(), "2026-08-25", 1).expired, true)

const yearly: Goal = { ...goal, id: "g4", period: "yearly", target: 100, startDate: "2026-01-01" }
const yearProg = goalProgress(yearly, new Set(["2026-01-02", "2026-08-25"]), "2026-08-25", 1)
assert.equal(yearProg.current, 2)

assert.deepEqual(reorderIds(["a", "b", "c"], 0, 2), ["b", "c", "a"], "reorder stack")
assert.deepEqual(reorderIds(["a", "b"], -1, 0), ["a", "b"], "bad index")

const v2 = {
  version: 2,
  habits: [
    {
      id: "keep",
      name: "Water",
      icon: "💧",
      palette: "moss",
      frequency: "daily",
      scheduledDays: [1, 2, 3, 4, 5],
      targetPerWeek: 7,
      startDate: "2026-01-01",
      reminderEnabled: false,
      reminderTime: "08:00",
      notes: "",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
  ],
  completions: {
    keep: { "2026-08-01": { note: "hello", updatedAt: "2026-08-01" } },
  },
  settings: { displayName: "Ash", weekStartsOn: 1, appearance: "dark", reminderPermission: "unknown" },
}
const v3 = migrateToV3(v2, "2026-08-25")
assert.ok(v3)
assert.equal(v3.version, 3)
assert.equal(v3.habits[0].id, "keep")
assert.equal(v3.habits[0].name, "Water")
assert.equal(v3.completions.keep["2026-08-01"].note, "hello", "completion dates preserved")
assert.equal(v3.entitlement.status, "free")
assert.ok(v3.categories.length >= 7)

const sneaky = migrateToV3(
  {
    version: 3,
    habits: v2.habits,
    completions: v2.completions,
    settings: v2.settings,
    entitlement: {
      status: "premium",
      source: "storekit",
      productId: "habitly_premium_monthly",
      expiresAt: null,
    },
    categories: [],
    goals: [],
    stacks: [],
    achievements: [],
  },
  "2026-08-25"
)
assert.ok(sneaky)
assert.equal(sneaky.entitlement.status, "free", "migrated client premium is discarded")
assert.equal(sneaky.habits[0].id, "keep", "habit data survives entitlement strip")

const v1 = {
  version: 1,
  habits: [{ id: "old", name: "Walk", icon: "🚶", palette: "ember", createdAt: "2026-01-02" }],
  checks: { old: ["2026-01-03", "2026-01-04"] },
}
const fromV1 = migrateToV3(v1, "2026-08-25")
assert.ok(fromV1)
assert.ok(fromV1.completions.old["2026-01-03"])
assert.ok(fromV1.completions.old["2026-01-04"])

const earned = evaluateAchievements(
  [daily],
  [allDays],
  today,
  1
)
assert.ok(earned.includes("streak-7"))
assert.ok(!earned.includes("completions-1000"))

const merged = mergeByUpdatedAt(
  [{ id: "a", updatedAt: "2026-01-01" }],
  [
    { id: "a", updatedAt: "2026-02-01" },
    { id: "b", updatedAt: "2026-01-01" },
  ]
)
assert.equal(merged.find((x) => x.id === "a")?.updatedAt, "2026-02-01")
assert.ok(merged.find((x) => x.id === "b"))

console.log("premium checks passed")
