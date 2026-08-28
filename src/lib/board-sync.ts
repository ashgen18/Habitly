import type { AppState } from "@/src/domain/types.ts"
import { migrateToV3 } from "@/src/domain/migrate.ts"
import { mergeByUpdatedAt } from "@/src/domain/premium/sync.ts"
import { supabase, supabaseConfigured } from "@/src/lib/supabase.ts"

/** ponytail: one JSON board per user. Split into tables when you need per-habit queries. */
export async function pullBoard(userId: string): Promise<AppState | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from("boards")
    .select("state")
    .eq("user_id", userId)
    .maybeSingle()
  if (error || !data?.state) return null
  return migrateToV3(data.state)
}

export async function pushBoard(userId: string, state: AppState): Promise<string | null> {
  if (!supabase) return supabaseConfigured ? "Supabase client missing" : null
  const { error } = await supabase.from("boards").upsert({
    user_id: userId,
    state,
    updated_at: new Date().toISOString(),
  })
  return error ? error.message : null
}

export function mergeBoards(local: AppState, remote: AppState): AppState {
  const completions = { ...local.completions }
  for (const [habitId, days] of Object.entries(remote.completions)) {
    const current = completions[habitId] ?? {}
    const merged = { ...current }
    for (const [iso, row] of Object.entries(days)) {
      const existing = merged[iso]
      if (!existing || (row.updatedAt ?? "") > (existing.updatedAt ?? "")) {
        merged[iso] = row
      }
    }
    completions[habitId] = merged
  }
  return {
    version: 3,
    habits: mergeByUpdatedAt(local.habits, remote.habits),
    completions,
    settings: {
      ...local.settings,
      ...remote.settings,
    },
    entitlement:
      (remote.entitlement.updatedAt ?? "") > (local.entitlement.updatedAt ?? "")
        ? remote.entitlement
        : local.entitlement,
    categories: mergeByUpdatedAt(local.categories, remote.categories),
    goals: mergeByUpdatedAt(local.goals, remote.goals),
    stacks: mergeByUpdatedAt(local.stacks, remote.stacks),
    achievements: mergeByUpdatedAt(
      local.achievements.map((a) => ({ ...a, updatedAt: a.unlockedAt })),
      remote.achievements.map((a) => ({ ...a, updatedAt: a.unlockedAt }))
    ).map(({ id, unlockedAt }) => ({ id, unlockedAt })),
  }
}
