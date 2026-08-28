import { shiftISO, todayISO } from "./dates"
import { FREE_ENTITLEMENT } from "./premium/entitlement"
import { DEFAULT_CATEGORIES } from "./premium/organization"
import type { AppState, Habit } from "./types"
import { DEFAULT_SETTINGS } from "./types"

function id(suffix: string) {
  return `demo-${suffix}`
}

function datesMatching(
  end: string,
  daysBack: number,
  pred: (iso: string, indexFromEnd: number) => boolean
): string[] {
  const out: string[] = []
  for (let i = daysBack; i >= 0; i--) {
    const iso = shiftISO(end, -i)
    if (pred(iso, i)) out.push(iso)
  }
  return out
}

function pack(dates: string[], now: string) {
  return Object.fromEntries(dates.map((iso) => [iso, { note: "", updatedAt: now }]))
}

function seededCategories() {
  const createdAt = "2020-01-01T00:00:00.000Z"
  return DEFAULT_CATEGORIES.map((c) => ({ ...c, createdAt, updatedAt: createdAt }))
}

export function buildDemoState(now = new Date()): AppState {
  const today = todayISO(now)
  const start = shiftISO(today, -80)
  const water: Habit = {
    id: id("water"),
    name: "Water",
    icon: "💧",
    palette: "moss",
    frequency: "daily",
    scheduledDays: [0, 1, 2, 3, 4, 5, 6],
    targetPerWeek: 7,
    startDate: start,
    reminderEnabled: false,
    reminderTime: "08:00",
    notes: "A glass with breakfast and one after dinner.",
    createdAt: start,
    updatedAt: today,
    categoryId: "cat-health",
  }
  const read: Habit = {
    id: id("read"),
    name: "Read 20 min",
    icon: "📖",
    palette: "tide",
    frequency: "weekdays",
    scheduledDays: [1, 2, 4, 6],
    targetPerWeek: 4,
    startDate: start,
    reminderEnabled: false,
    reminderTime: "21:00",
    notes: "",
    createdAt: start,
    updatedAt: today,
    categoryId: "cat-learning",
  }
  const walk: Habit = {
    id: id("walk"),
    name: "Walk",
    icon: "🚶",
    palette: "ember",
    frequency: "times_per_week",
    scheduledDays: [],
    targetPerWeek: 3,
    startDate: shiftISO(today, -60),
    reminderEnabled: false,
    reminderTime: "18:00",
    notes: "",
    createdAt: shiftISO(today, -60),
    updatedAt: today,
    categoryId: "cat-fitness",
  }

  const waterDays = new Set(
    datesMatching(today, 80, (iso) => {
      const day = new Date(iso + "T12:00:00").getDay()
      return day !== 0
    })
  )
  for (let i = 0; i < 5; i++) waterDays.add(shiftISO(today, -i))

  const readDays = datesMatching(today, 80, (iso) => {
    const day = new Date(iso + "T12:00:00").getDay()
    return day === 1 || day === 2 || day === 4 || day === 6
  })

  const walkDays = datesMatching(today, 60, (iso, fromEnd) => {
    if (fromEnd < 2) return false
    const day = new Date(iso + "T12:00:00").getDay()
    return day === 2 || day === 4 || day === 6
  })

  return {
    version: 3,
    habits: [water, read, walk],
    completions: {
      [water.id]: pack([...waterDays], today),
      [read.id]: pack(readDays, today),
      [walk.id]: pack(walkDays, today),
    },
    settings: { ...DEFAULT_SETTINGS },
    entitlement: { ...FREE_ENTITLEMENT },
    categories: seededCategories(),
    goals: [],
    stacks: [],
    achievements: [],
  }
}

export function emptyState(): AppState {
  return {
    version: 3,
    habits: [],
    completions: {},
    settings: { ...DEFAULT_SETTINGS },
    entitlement: { ...FREE_ENTITLEMENT },
    categories: seededCategories(),
    goals: [],
    stacks: [],
    achievements: [],
  }
}

export function completedSet(state: AppState, habitId: string): Set<string> {
  const habit = state.habits.find((h) => h.id === habitId)
  const target =
    habit?.frequency === "times_per_day" ? Math.max(1, habit.timesPerDay ?? 1) : 1
  const map = state.completions[habitId] ?? {}
  const out = new Set<string>()
  for (const [iso, completion] of Object.entries(map)) {
    if ((completion.count ?? 1) >= target) out.add(iso)
  }
  return out
}

export function tapCount(state: AppState, habitId: string, iso: string): number {
  const row = state.completions[habitId]?.[iso]
  if (!row) return 0
  return row.count ?? 1
}
