import type { PaletteId } from "./palettes.ts"
import type { FrequencyKind } from "./habit-logic.ts"
import type { Entitlement } from "./premium/entitlement.ts"
import type { Goal, HabitCategory, HabitStack } from "./premium/organization.ts"

export type { FrequencyKind, Entitlement, Goal, HabitCategory, HabitStack }

export type ExtraReminder = {
  time: string
  message?: string
  kind?: "nudge" | "followup"
}

export type Habit = {
  id: string
  name: string
  icon: string
  palette: PaletteId
  frequency: FrequencyKind
  scheduledDays: number[]
  targetPerWeek: number
  startDate: string
  reminderEnabled: boolean
  reminderTime: string
  notes: string
  createdAt: string
  updatedAt: string
  archivedAt?: string
  /** Premium: every N days from startDate. */
  everyNDays?: number
  /** Premium: ISO dates that are scheduled. */
  specificDates?: string[]
  /** Premium: taps required on a scheduled day. */
  timesPerDay?: number
  categoryId?: string
  extraReminders?: ExtraReminder[]
  reminderMessage?: string
}

export type Completion = {
  note: string
  updatedAt: string
  /** Premium times-per-day progress. Missing means 1 if the date exists. */
  count?: number
}

export type Appearance = "system" | "light" | "dark"
export type DashboardDensity = "comfortable" | "compact"
export type AccentId = "terracotta" | "moss" | "tide" | "ink"
export type IconStyle = "filled" | "outline"

export type Settings = {
  displayName: string
  weekStartsOn: 0 | 1
  appearance: Appearance
  reminderPermission: "unknown" | "granted" | "denied"
  dashboard: DashboardDensity
  accent: AccentId
  iconStyle: IconStyle
}

export type UnlockedAchievement = {
  id: string
  unlockedAt: string
}

export type AppState = {
  version: 3
  habits: Habit[]
  completions: Record<string, Record<string, Completion>>
  settings: Settings
  entitlement: Entitlement
  categories: HabitCategory[]
  goals: Goal[]
  stacks: HabitStack[]
  achievements: UnlockedAchievement[]
}

export type HabitDraft = {
  name: string
  icon: string
  palette: PaletteId
  frequency: FrequencyKind
  scheduledDays: number[]
  targetPerWeek: number
  startDate: string
  reminderEnabled: boolean
  reminderTime: string
  notes: string
  everyNDays: number
  specificDates: string[]
  timesPerDay: number
  categoryId: string
  extraReminders: ExtraReminder[]
  reminderMessage: string
}

export const DEFAULT_SETTINGS: Settings = {
  displayName: "",
  weekStartsOn: 1,
  appearance: "system",
  reminderPermission: "unknown",
  dashboard: "comfortable",
  accent: "terracotta",
  iconStyle: "filled",
}

export const DEFAULT_DRAFT: HabitDraft = {
  name: "",
  icon: "💧",
  palette: "moss",
  frequency: "daily",
  scheduledDays: [1, 2, 3, 4, 5],
  targetPerWeek: 3,
  startDate: "",
  reminderEnabled: false,
  reminderTime: "08:00",
  notes: "",
  everyNDays: 2,
  specificDates: [],
  timesPerDay: 1,
  categoryId: "",
  extraReminders: [],
  reminderMessage: "",
}
