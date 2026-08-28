import { todayISO } from "./dates.ts"
import { FREE_ENTITLEMENT } from "./premium/entitlement.ts"
import { DEFAULT_CATEGORIES } from "./premium/organization.ts"
import type { AppState, Completion, Habit, Settings } from "./types.ts"
import { DEFAULT_SETTINGS } from "./types.ts"

type LegacyV1 = {
  version: 1
  habits: Array<{
    id: string
    name: string
    icon: string
    palette: Habit["palette"]
    createdAt: string
    archivedAt?: string
  }>
  checks: Record<string, string[]>
  settings?: { displayName?: string; weekStartsOn?: 0 | 1; isPro?: boolean }
}

type V2State = {
  version: 2
  habits: Habit[]
  completions: AppState["completions"]
  settings: Partial<Settings>
}

function completionsFromDates(dates: string[], now: string): Record<string, Completion> {
  const out: Record<string, Completion> = {}
  for (const iso of dates) {
    out[iso] = { note: "", updatedAt: now }
  }
  return out
}

function defaultCategories(): AppState["categories"] {
  const createdAt = "2020-01-01T00:00:00.000Z"
  return DEFAULT_CATEGORIES.map((c) => ({ ...c, createdAt, updatedAt: createdAt }))
}

/** v1 → v2. Completions stay on the same ISO dates. */
export function migrateToV2(raw: unknown, now = todayISO()): V2State | null {
  if (!raw || typeof raw !== "object") return null
  const data = raw as { version?: number }
  if (data.version === 2) {
    const v2 = raw as V2State
    if (!Array.isArray(v2.habits) || !v2.completions) return null
    return {
      version: 2,
      habits: v2.habits,
      completions: v2.completions,
      settings: { ...DEFAULT_SETTINGS, ...v2.settings },
    }
  }
  if (data.version !== 1) return null
  const v1 = raw as LegacyV1
  if (!Array.isArray(v1.habits)) return null
  const habits: Habit[] = v1.habits.map((h) => ({
    id: h.id,
    name: h.name,
    icon: h.icon,
    palette: h.palette,
    frequency: "daily",
    scheduledDays: [1, 2, 3, 4, 5],
    targetPerWeek: 3,
    startDate: h.createdAt || now,
    reminderEnabled: false,
    reminderTime: "08:00",
    notes: "",
    createdAt: h.createdAt || now,
    updatedAt: now,
    archivedAt: h.archivedAt,
  }))
  const completions: AppState["completions"] = {}
  for (const habit of habits) {
    completions[habit.id] = completionsFromDates(v1.checks?.[habit.id] ?? [], now)
  }
  const settings: Settings = {
    ...DEFAULT_SETTINGS,
    displayName: v1.settings?.displayName ?? "",
    weekStartsOn: v1.settings?.weekStartsOn === 0 ? 0 : 1,
  }
  return { version: 2, habits, completions, settings }
}

function asEntitlement(raw: unknown): AppState["entitlement"] {
  if (!raw || typeof raw !== "object") {
    return { ...FREE_ENTITLEMENT }
  }
  const e = raw as AppState["entitlement"]
  return {
    status: e.status === "premium" ? "premium" : "free",
    source: e.source === "simulated" || e.source === "storekit" ? e.source : "none",
    productId: e.productId ?? null,
    expiresAt: e.expiresAt ?? null,
    updatedAt: e.updatedAt,
  }
}

/** v1/v2 → v3. Never drops habits or completion dates. */
export function migrateToV3(raw: unknown, now = todayISO()): AppState | null {
  if (!raw || typeof raw !== "object") return null
  const data = raw as { version?: number }

  if (data.version === 3) {
    const v3 = raw as AppState
    if (!Array.isArray(v3.habits) || !v3.completions) return null
    return {
      version: 3,
      habits: v3.habits,
      completions: v3.completions,
      settings: { ...DEFAULT_SETTINGS, ...v3.settings },
      entitlement: asEntitlement(v3.entitlement),
      categories:
        Array.isArray(v3.categories) && v3.categories.length > 0
          ? v3.categories
          : defaultCategories(),
      goals: Array.isArray(v3.goals) ? v3.goals : [],
      stacks: Array.isArray(v3.stacks) ? v3.stacks : [],
      achievements: Array.isArray(v3.achievements) ? v3.achievements : [],
    }
  }

  const v2 = migrateToV2(raw, now)
  if (!v2) return null
  return {
    version: 3,
    habits: v2.habits,
    completions: v2.completions,
    settings: { ...DEFAULT_SETTINGS, ...v2.settings },
    entitlement: { ...FREE_ENTITLEMENT },
    categories: defaultCategories(),
    goals: [],
    stacks: [],
    achievements: [],
  }
}
