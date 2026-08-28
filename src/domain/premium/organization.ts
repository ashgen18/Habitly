import { startOfWeek } from "../habit-logic.ts"

export type GoalPeriod = "daily" | "weekly" | "monthly" | "yearly"

export type Goal = {
  id: string
  name: string
  habitId: string | null
  period: GoalPeriod
  target: number
  startDate: string
  endDate: string | null
  createdAt: string
  updatedAt: string
}

export type GoalProgress = {
  current: number
  remaining: number
  pct: number
  expired: boolean
  complete: boolean
}

function inPeriod(iso: string, goal: Goal, today: string, weekStartsOn: 0 | 1): boolean {
  if (iso < goal.startDate) return false
  if (goal.endDate && iso > goal.endDate) return false
  if (iso > today) return false
  if (goal.period === "daily") return iso === today
  if (goal.period === "weekly") {
    const start = startOfWeek(today, weekStartsOn)
    return iso >= start && iso <= today
  }
  if (goal.period === "monthly") return iso.startsWith(today.slice(0, 7))
  return iso.startsWith(today.slice(0, 4))
}

export function goalProgress(
  goal: Goal,
  completed: ReadonlySet<string>,
  today: string,
  weekStartsOn: 0 | 1 = 1,
  counts?: Readonly<Record<string, number>>
): GoalProgress {
  const expired = Boolean(goal.endDate && today > goal.endDate)
  let current = 0
  for (const iso of completed) {
    if (!inPeriod(iso, goal, today, weekStartsOn)) continue
    current += counts?.[iso] ?? 1
  }
  const remaining = Math.max(0, goal.target - current)
  const pct = goal.target <= 0 ? 0 : Math.min(100, Math.round((current / goal.target) * 100))
  return { current, remaining, pct, expired, complete: current >= goal.target }
}

export type HabitCategory = {
  id: string
  name: string
  icon: string
  color: string
  createdAt: string
  updatedAt: string
}

export const DEFAULT_CATEGORIES: HabitCategory[] = [
  { id: "cat-health", name: "Health", icon: "💚", color: "#3D9A6A", createdAt: "", updatedAt: "" },
  { id: "cat-fitness", name: "Fitness", icon: "💪", color: "#E06A2C", createdAt: "", updatedAt: "" },
  { id: "cat-productivity", name: "Productivity", icon: "🎯", color: "#3B82C4", createdAt: "", updatedAt: "" },
  { id: "cat-learning", name: "Learning", icon: "📖", color: "#C026D3", createdAt: "", updatedAt: "" },
  { id: "cat-finance", name: "Finance", icon: "💰", color: "#CA8A04", createdAt: "", updatedAt: "" },
  { id: "cat-mindfulness", name: "Mindfulness", icon: "🧘", color: "#7C3AED", createdAt: "", updatedAt: "" },
  { id: "cat-relationships", name: "Relationships", icon: "🤝", color: "#E11D48", createdAt: "", updatedAt: "" },
]

export type HabitStack = {
  id: string
  name: string
  habitIds: string[]
  createdAt: string
  updatedAt: string
}

export function reorderIds(ids: string[], from: number, to: number): string[] {
  if (from < 0 || to < 0 || from >= ids.length || to >= ids.length) return [...ids]
  const next = [...ids]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}
