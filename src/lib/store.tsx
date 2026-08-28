import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import type { PaletteId } from "@/src/domain/palettes.ts"
import { buildDemoState, completedSet, emptyState, tapCount } from "@/src/domain/seed.ts"
import { migrateToV3 } from "@/src/domain/migrate.ts"
import type { AppState, Habit, HabitDraft, Settings, UnlockedAchievement } from "@/src/domain/types.ts"
import { DEFAULT_DRAFT } from "@/src/domain/types.ts"
import { todayISO } from "@/src/domain/dates.ts"
import { validateHabitName } from "@/src/domain/habit-logic.ts"
import { newId } from "@/src/domain/id.ts"
import { evaluateAchievements, TEMPLATES } from "@/src/domain/premium/achievements.ts"
import {
  PremiumEntitlementManager,
  PremiumFeature,
  clearSimulatedPremium,
  simulatePremium,
  type Entitlement,
} from "@/src/domain/premium/entitlement.ts"
import {
  reorderIds,
  type Goal,
  type GoalPeriod,
  type HabitCategory,
  type HabitStack,
} from "@/src/domain/premium/organization.ts"
import { syncReminders } from "@/src/lib/reminders.ts"
import { mergeBoards, pullBoard, pushBoard } from "@/src/lib/board-sync.ts"
import { useAuth } from "@/src/lib/auth.tsx"

const STORAGE_KEY_V3 = "tessera.v3"
const STORAGE_KEY_V2 = "tessera.v2"
const STORAGE_KEY_V1 = "tessera.v1"

type Store = {
  state: AppState
  hydrated: boolean
  persistError: string | null
  syncMessage: string | null
  activeHabits: Habit[]
  archivedHabits: Habit[]
  entitlement: Entitlement
  canAccess: (feature: PremiumFeature) => boolean
  completedDates: (habitId: string) => Set<string>
  isChecked: (habitId: string, iso: string) => boolean
  completionNote: (habitId: string, iso: string) => string
  tapCountFor: (habitId: string, iso: string) => number
  toggleCheck: (habitId: string, iso?: string) => void
  setCompletionNote: (habitId: string, iso: string, note: string) => void
  addHabit: (draft: HabitDraft) => string | null
  updateHabit: (id: string, draft: Partial<HabitDraft>) => string | null
  archiveHabit: (id: string) => void
  restoreHabit: (id: string) => void
  deleteHabit: (id: string) => void
  updateSettings: (patch: Partial<Settings>) => void
  setSimulatedPremium: (on: boolean) => void
  addGoal: (input: {
    name: string
    habitId: string | null
    period: GoalPeriod
    target: number
    startDate: string
    endDate: string | null
  }) => string | null
  updateGoal: (id: string, patch: Partial<Goal>) => void
  deleteGoal: (id: string) => void
  addCategory: (name: string, icon: string, color: string) => string | null
  updateCategory: (id: string, patch: Partial<Pick<HabitCategory, "name" | "icon" | "color">>) => void
  deleteCategory: (id: string) => void
  assignCategory: (habitId: string, categoryId: string | null) => void
  addStack: (name: string, habitIds: string[]) => string | null
  updateStack: (id: string, patch: Partial<Pick<HabitStack, "name" | "habitIds">>) => void
  reorderStack: (id: string, from: number, to: number) => void
  deleteStack: (id: string) => void
  installTemplate: (templateId: string) => string | null
  loadDemo: () => void
  resetEmpty: () => void
}

const StoreContext = createContext<Store | null>(null)

function webLocal(key: string): string | null {
  try {
    if (typeof localStorage === "undefined") return null
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

async function readDisk(): Promise<AppState | null> {
  try {
    const keys = [STORAGE_KEY_V3, STORAGE_KEY_V2, STORAGE_KEY_V1]
    for (const key of keys) {
      const raw = (await AsyncStorage.getItem(key)) ?? webLocal(key)
      if (raw) return migrateToV3(JSON.parse(raw))
    }
    return null
  } catch {
    return null
  }
}

async function persist(state: AppState): Promise<string | null> {
  try {
    const json = JSON.stringify(state)
    await AsyncStorage.setItem(STORAGE_KEY_V3, json)
    try {
      if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY_V3, json)
    } catch {
      // Web quota — AsyncStorage already wrote.
    }
    return null
  } catch {
    return "Could not save on this device. Changes stay until you close the app."
  }
}

function stamp(): string {
  return new Date().toISOString()
}

function withAchievements(next: AppState): AppState {
  const today = todayISO()
  const earned = evaluateAchievements(
    next.habits,
    next.habits.map((h) => completedSet(next, h.id)),
    today,
    next.settings.weekStartsOn
  )
  const have = new Set(next.achievements.map((a) => a.id))
  const unlocked: UnlockedAchievement[] = [...next.achievements]
  for (const id of earned) {
    if (have.has(id)) continue
    unlocked.push({ id, unlockedAt: stamp() })
  }
  if (unlocked.length === next.achievements.length) return next
  return { ...next, achievements: unlocked }
}

function draftToHabit(draft: HabitDraft, existing?: Habit): Habit {
  const now = todayISO()
  return {
    id: existing?.id ?? newId(),
    name: draft.name.trim(),
    icon: draft.icon,
    palette: draft.palette,
    frequency: draft.frequency,
    scheduledDays: [...draft.scheduledDays],
    targetPerWeek: draft.targetPerWeek,
    startDate: draft.startDate || now,
    reminderEnabled: draft.reminderEnabled,
    reminderTime: draft.reminderTime,
    notes: draft.notes.trim(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: stamp(),
    archivedAt: existing?.archivedAt,
    everyNDays: draft.everyNDays,
    specificDates: [...draft.specificDates],
    timesPerDay: draft.timesPerDay,
    categoryId: draft.categoryId || undefined,
    extraReminders: draft.extraReminders,
    reminderMessage: draft.reminderMessage.trim() || undefined,
  }
}

export function habitToDraft(habit: Habit): HabitDraft {
  return {
    name: habit.name,
    icon: habit.icon,
    palette: habit.palette as PaletteId,
    frequency: habit.frequency,
    scheduledDays: [...habit.scheduledDays],
    targetPerWeek: habit.targetPerWeek,
    startDate: habit.startDate,
    reminderEnabled: habit.reminderEnabled,
    reminderTime: habit.reminderTime,
    notes: habit.notes,
    everyNDays: habit.everyNDays ?? DEFAULT_DRAFT.everyNDays,
    specificDates: [...(habit.specificDates ?? [])],
    timesPerDay: habit.timesPerDay ?? 1,
    categoryId: habit.categoryId ?? "",
    extraReminders: [...(habit.extraReminders ?? [])],
    reminderMessage: habit.reminderMessage ?? "",
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [state, setState] = useState<AppState>(emptyState)
  const [hydrated, setHydrated] = useState(false)
  const [persistError, setPersistError] = useState<string | null>(null)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const loaded = await readDisk()
        if (!alive) return
        if (loaded) {
          setState(loaded)
          await persist(loaded)
        } else {
          const demo = buildDemoState()
          setPersistError(await persist(demo))
          setState(demo)
        }
      } catch {
        if (alive) setState(emptyState())
      }
      if (alive) setHydrated(true)
    })()
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!hydrated || !user) return
    let alive = true
    ;(async () => {
      const remote = await pullBoard(user.id)
      if (!alive || !remote) return
      const merged = mergeBoards(stateRef.current, remote)
      setState(merged)
      setPersistError(await persist(merged))
      setSyncMessage("Synced with your account")
    })()
    return () => {
      alive = false
    }
  }, [hydrated, user])

  useEffect(() => {
    if (!hydrated) return
    return syncReminders(state)
  }, [hydrated, state])

  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const schedulePush = useCallback(
    (next: AppState) => {
      if (!user) return
      if (pushTimer.current) clearTimeout(pushTimer.current)
      pushTimer.current = setTimeout(() => {
        void pushBoard(user.id, next).then((err) => {
          setSyncMessage(err ? `Sync paused: ${err}` : "Saved to your account")
        })
      }, 800)
    },
    [user]
  )

  const commit = useCallback(
    (updater: (prev: AppState) => AppState) => {
      setState((prev) => {
        const next = withAchievements(updater(prev))
        void persist(next).then(setPersistError)
        schedulePush(next)
        return next
      })
    },
    [schedulePush]
  )

  const activeHabits = state.habits.filter((h) => !h.archivedAt)
  const archivedHabits = state.habits.filter((h) => h.archivedAt)

  const value = useMemo<Store>(() => {
    const manager = new PremiumEntitlementManager(state.entitlement)
    const isChecked = (habitId: string, iso: string) => completedSet(state, habitId).has(iso)

    return {
      state,
      hydrated,
      persistError,
      syncMessage,
      activeHabits,
      archivedHabits,
      entitlement: state.entitlement,
      canAccess: (feature) => manager.canAccess(feature),
      completedDates: (habitId) => completedSet(state, habitId),
      isChecked,
      completionNote(habitId, iso) {
        return state.completions[habitId]?.[iso]?.note ?? ""
      },
      tapCountFor(habitId, iso) {
        return tapCount(state, habitId, iso)
      },
      toggleCheck(habitId, iso = todayISO()) {
        commit((prev) => {
          const habit = prev.habits.find((h) => h.id === habitId)
          const target = habit?.frequency === "times_per_day" ? Math.max(1, habit.timesPerDay ?? 1) : 1
          const current = { ...(prev.completions[habitId] ?? {}) }
          const row = current[iso]
          const count = row ? (row.count ?? 1) : 0
          if (count >= target) {
            delete current[iso]
          } else {
            current[iso] = {
              note: row?.note ?? "",
              count: count + 1,
              updatedAt: stamp(),
            }
          }
          return { ...prev, completions: { ...prev.completions, [habitId]: current } }
        })
      },
      setCompletionNote(habitId, iso, note) {
        commit((prev) => {
          const current = { ...(prev.completions[habitId] ?? {}) }
          if (!current[iso]) current[iso] = { note: "", updatedAt: stamp() }
          current[iso] = { ...current[iso], note, updatedAt: stamp() }
          return { ...prev, completions: { ...prev.completions, [habitId]: current } }
        })
      },
      addHabit(draft) {
        const error = validateHabitName(draft.name)
        if (error) return error
        const habit = draftToHabit(draft)
        commit((prev) => ({
          ...prev,
          habits: [...prev.habits, habit],
          completions: { ...prev.completions, [habit.id]: {} },
        }))
        return null
      },
      updateHabit(id, draft) {
        if (draft.name !== undefined) {
          const error = validateHabitName(draft.name)
          if (error) return error
        }
        commit((prev) => ({
          ...prev,
          habits: prev.habits.map((h) => {
            if (h.id !== id) return h
            const merged: HabitDraft = {
              ...habitToDraft(h),
              ...draft,
              scheduledDays: draft.scheduledDays ? [...draft.scheduledDays] : h.scheduledDays,
              specificDates: draft.specificDates ? [...draft.specificDates] : (h.specificDates ?? []),
              extraReminders: draft.extraReminders ? [...draft.extraReminders] : (h.extraReminders ?? []),
            }
            return draftToHabit(merged, h)
          }),
        }))
        return null
      },
      archiveHabit(id) {
        commit((prev) => ({
          ...prev,
          habits: prev.habits.map((h) =>
            h.id === id ? { ...h, archivedAt: todayISO(), updatedAt: stamp() } : h
          ),
        }))
      },
      restoreHabit(id) {
        commit((prev) => ({
          ...prev,
          habits: prev.habits.map((h) => {
            if (h.id !== id) return h
            const rest = { ...h }
            delete rest.archivedAt
            return { ...rest, updatedAt: stamp() }
          }),
        }))
      },
      deleteHabit(id) {
        commit((prev) => {
          const completions = { ...prev.completions }
          delete completions[id]
          return {
            ...prev,
            habits: prev.habits.filter((h) => h.id !== id),
            completions,
            goals: prev.goals.map((g) =>
              g.habitId === id ? { ...g, habitId: null, updatedAt: stamp() } : g
            ),
            stacks: prev.stacks.map((s) => ({
              ...s,
              habitIds: s.habitIds.filter((hid) => hid !== id),
              updatedAt: stamp(),
            })),
          }
        })
      },
      updateSettings(patch) {
        commit((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }))
      },
      setSimulatedPremium(on) {
        commit((prev) => ({
          ...prev,
          entitlement: on ? simulatePremium() : clearSimulatedPremium(),
        }))
      },
      addGoal(input) {
        const name = input.name.trim()
        if (!name) return "Give this goal a name"
        if (input.target <= 0) return "Target must be at least 1"
        const now = stamp()
        const goal: Goal = {
          id: newId(),
          name,
          habitId: input.habitId,
          period: input.period,
          target: input.target,
          startDate: input.startDate || todayISO(),
          endDate: input.endDate,
          createdAt: now,
          updatedAt: now,
        }
        commit((prev) => ({ ...prev, goals: [...prev.goals, goal] }))
        return null
      },
      updateGoal(id, patch) {
        commit((prev) => ({
          ...prev,
          goals: prev.goals.map((g) => (g.id === id ? { ...g, ...patch, updatedAt: stamp() } : g)),
        }))
      },
      deleteGoal(id) {
        commit((prev) => ({ ...prev, goals: prev.goals.filter((g) => g.id !== id) }))
      },
      addCategory(name, icon, color) {
        const trimmed = name.trim()
        if (!trimmed) return "Give this category a name"
        const now = stamp()
        const category: HabitCategory = {
          id: newId(),
          name: trimmed,
          icon: icon || "✦",
          color: color || "#3D9A6A",
          createdAt: now,
          updatedAt: now,
        }
        commit((prev) => ({ ...prev, categories: [...prev.categories, category] }))
        return null
      },
      updateCategory(id, patch) {
        commit((prev) => ({
          ...prev,
          categories: prev.categories.map((c) =>
            c.id === id
              ? {
                  ...c,
                  ...patch,
                  name: patch.name !== undefined ? patch.name.trim() : c.name,
                  updatedAt: stamp(),
                }
              : c
          ),
        }))
      },
      deleteCategory(id) {
        commit((prev) => ({
          ...prev,
          categories: prev.categories.filter((c) => c.id !== id),
          habits: prev.habits.map((h) =>
            h.categoryId === id ? { ...h, categoryId: undefined, updatedAt: stamp() } : h
          ),
        }))
      },
      assignCategory(habitId, categoryId) {
        commit((prev) => ({
          ...prev,
          habits: prev.habits.map((h) =>
            h.id === habitId ? { ...h, categoryId: categoryId || undefined, updatedAt: stamp() } : h
          ),
        }))
      },
      addStack(name, habitIds) {
        const trimmed = name.trim()
        if (!trimmed) return "Give this routine a name"
        const now = stamp()
        const stack: HabitStack = {
          id: newId(),
          name: trimmed,
          habitIds: [...habitIds],
          createdAt: now,
          updatedAt: now,
        }
        commit((prev) => ({ ...prev, stacks: [...prev.stacks, stack] }))
        return null
      },
      updateStack(id, patch) {
        commit((prev) => ({
          ...prev,
          stacks: prev.stacks.map((s) =>
            s.id === id
              ? {
                  ...s,
                  ...patch,
                  habitIds: patch.habitIds ? [...patch.habitIds] : s.habitIds,
                  updatedAt: stamp(),
                }
              : s
          ),
        }))
      },
      reorderStack(id, from, to) {
        commit((prev) => ({
          ...prev,
          stacks: prev.stacks.map((s) =>
            s.id === id ? { ...s, habitIds: reorderIds(s.habitIds, from, to), updatedAt: stamp() } : s
          ),
        }))
      },
      deleteStack(id) {
        commit((prev) => ({ ...prev, stacks: prev.stacks.filter((s) => s.id !== id) }))
      },
      installTemplate(templateId) {
        const template = TEMPLATES.find((t) => t.id === templateId)
        if (!template) return "That template is gone"
        const palettes: PaletteId[] = ["moss", "tide", "ember", "orchid", "ink", "sunset"]
        commit((prev) => {
          const now = todayISO()
          const added: Habit[] = template.habits.map((item, i) => ({
            id: newId(),
            name: item.name,
            icon: item.icon,
            palette: palettes[i % palettes.length],
            frequency: "daily",
            scheduledDays: [0, 1, 2, 3, 4, 5, 6],
            targetPerWeek: 7,
            startDate: now,
            reminderEnabled: false,
            reminderTime: "08:00",
            notes: item.notes,
            createdAt: now,
            updatedAt: stamp(),
          }))
          const completions = { ...prev.completions }
          for (const habit of added) completions[habit.id] = {}
          const stack: HabitStack = {
            id: newId(),
            name: template.name,
            habitIds: added.map((h) => h.id),
            createdAt: stamp(),
            updatedAt: stamp(),
          }
          return {
            ...prev,
            habits: [...prev.habits, ...added],
            completions,
            stacks: [...prev.stacks, stack],
          }
        })
        return null
      },
      loadDemo() {
        const next = buildDemoState()
        void persist(next).then(setPersistError)
        schedulePush(next)
        setState(next)
      },
      resetEmpty() {
        const next = emptyState()
        void persist(next).then(setPersistError)
        schedulePush(next)
        setState(next)
      },
    }
  }, [activeHabits, archivedHabits, commit, hydrated, persistError, schedulePush, state, syncMessage])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used inside StoreProvider")
  return ctx
}

export function useFeature(feature: PremiumFeature) {
  return useStore().canAccess(feature)
}
