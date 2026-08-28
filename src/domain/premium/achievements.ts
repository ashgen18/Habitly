import type { HabitLike } from "../habit-logic.ts"
import { analyzeHabit } from "./analytics.ts"

export type AchievementId =
  | "streak-7"
  | "streak-30"
  | "completions-100"
  | "completions-365"
  | "completions-1000"
  | "perfect-week"
  | "perfect-month"
  | "habits-10"

export type AchievementDef = {
  id: AchievementId
  name: string
  description: string
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "streak-7", name: "Week in", description: "A 7-day streak on any habit." },
  { id: "streak-30", name: "A month of showing up", description: "A 30-day streak on any habit." },
  { id: "completions-100", name: "Hundred", description: "100 completions on one habit." },
  { id: "completions-365", name: "Year of taps", description: "365 completions on one habit." },
  { id: "completions-1000", name: "Thousand", description: "1,000 completions across habits." },
  { id: "perfect-week", name: "Clean week", description: "100% of scheduled habits this week." },
  { id: "perfect-month", name: "Clean month", description: "100% scheduled in the last 30 days." },
  { id: "habits-10", name: "Full board", description: "10 active habits." },
]

export function evaluateAchievements(
  habits: HabitLike[],
  completions: ReadonlyArray<ReadonlySet<string>>,
  today: string,
  weekStartsOn: 0 | 1
): AchievementId[] {
  const earned = new Set<AchievementId>()
  let total = 0
  habits.forEach((habit, i) => {
    const set = completions[i] ?? new Set()
    total += set.size
    const a = analyzeHabit(habit, set, today, weekStartsOn)
    if (a.currentStreak >= 7 || a.bestStreak >= 7) earned.add("streak-7")
    if (a.currentStreak >= 30 || a.bestStreak >= 30) earned.add("streak-30")
    if (a.totalCompletions >= 100) earned.add("completions-100")
    if (a.totalCompletions >= 365) earned.add("completions-365")
    if (a.rate7 === 100 && a.rate7 >= 0 && set.size > 0) {
      /* week rate uses last 7 scheduled-capable days */
    }
    if (a.rate7 === 100 && a.totalCompletions > 0) earned.add("perfect-week")
    if (a.rate30 === 100 && a.totalCompletions > 0) earned.add("perfect-month")
  })
  if (total >= 1000) earned.add("completions-1000")
  if (habits.filter((h) => !h.archivedAt).length >= 10) earned.add("habits-10")
  return [...earned]
}

export type Template = {
  id: string
  name: string
  blurb: string
  habits: { name: string; icon: string; notes: string }[]
}

export const TEMPLATES: Template[] = [
  {
    id: "morning",
    name: "Morning Routine",
    blurb: "A quiet first hour.",
    habits: [
      { name: "Drink Water", icon: "💧", notes: "" },
      { name: "Meditate", icon: "🧘", notes: "" },
      { name: "Exercise", icon: "💪", notes: "" },
      { name: "Read", icon: "📖", notes: "" },
      { name: "Journal", icon: "✍️", notes: "" },
    ],
  },
  {
    id: "fitness",
    name: "Fitness",
    blurb: "Move a little every day.",
    habits: [
      { name: "Exercise", icon: "💪", notes: "" },
      { name: "Stretch", icon: "🤸", notes: "" },
      { name: "Walk", icon: "🚶", notes: "" },
      { name: "Drink Water", icon: "💧", notes: "" },
      { name: "Sleep", icon: "😴", notes: "" },
    ],
  },
  {
    id: "productivity",
    name: "Productivity",
    blurb: "Protect the work.",
    habits: [
      { name: "Plan Day", icon: "🎯", notes: "" },
      { name: "Deep Work", icon: "🧠", notes: "" },
      { name: "Read", icon: "📖", notes: "" },
      { name: "Review Goals", icon: "🗂️", notes: "" },
      { name: "Journal", icon: "✍️", notes: "" },
    ],
  },
  {
    id: "mindfulness",
    name: "Mindfulness",
    blurb: "Come back to the room.",
    habits: [
      { name: "Meditate", icon: "🧘", notes: "" },
      { name: "Journal", icon: "✍️", notes: "" },
      { name: "Gratitude", icon: "🙏", notes: "" },
      { name: "Breathing", icon: "🌬️", notes: "" },
    ],
  },
]
