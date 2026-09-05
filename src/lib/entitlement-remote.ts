import { supabase } from "@/src/lib/supabase.ts"
import { entitlementFromServerRow } from "@/src/domain/premium/revenuecat.ts"
import { FREE_ENTITLEMENT, type Entitlement } from "@/src/domain/premium/entitlement.ts"

export async function pullServerEntitlement(userId: string): Promise<Entitlement> {
  if (!supabase) return { ...FREE_ENTITLEMENT }
  const { data, error } = await supabase
    .from("entitlements")
    .select("status, product_id, expires_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle()
  if (error || !data) return { ...FREE_ENTITLEMENT }
  return entitlementFromServerRow(data)
}
