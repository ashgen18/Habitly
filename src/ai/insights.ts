import { generateInsights, type Insight } from "@/src/domain/premium/insights.ts"
import type { Habit } from "@/src/domain/types.ts"
import { supabase } from "@/src/lib/supabase.ts"

export type InsightResult = {
  insights: Insight[]
  source: "rules" | "model"
}

/** Cursor owns the prompt in ai/prompts. Runtime tries the Edge Function, then local rules. */
export async function loadInsights(
  habits: Habit[],
  completions: Record<string, ReadonlySet<string>>,
  today: string,
  weekStartsOn: 0 | 1
): Promise<InsightResult> {
  const fallback = {
    source: "rules" as const,
    insights: generateInsights(habits, completions, today, weekStartsOn),
  }

  if (!supabase) return fallback

  try {
    const payload = {
      today,
      weekStartsOn,
      habits: habits.map((h) => ({
        id: h.id,
        name: h.name,
        startDate: h.startDate,
        frequency: h.frequency,
        archivedAt: h.archivedAt,
        scheduledDays: h.scheduledDays,
        targetPerWeek: h.targetPerWeek,
      })),
      completions: Object.fromEntries(
        Object.entries(completions).map(([id, set]) => [id, [...set]])
      ),
    }
    const { data, error } = await supabase.functions.invoke("habit-insights", { body: payload })
    if (error || !data?.insights) return fallback
    return {
      source: data.source === "model" ? "model" : "rules",
      insights: data.insights,
    }
  } catch {
    return fallback
  }
}
