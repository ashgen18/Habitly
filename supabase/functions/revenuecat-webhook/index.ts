/** RevenueCat → entitlements table. Authorization header must match REVENUECAT_WEBHOOK_AUTH.
 * Mapping matches src/domain/premium/revenuecat.ts entitlementFromWebhookEvent.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const REVOKE = new Set(["EXPIRATION", "REFUND", "SUBSCRIPTION_PAUSED"])

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200 })
  if (req.method !== "POST") return json({ error: "POST only" }, 405)

  const expected = Deno.env.get("REVENUECAT_WEBHOOK_AUTH") ?? ""
  const got = req.headers.get("authorization") ?? req.headers.get("Authorization") ?? ""
  if (!expected || got !== expected) return json({ error: "unauthorized" }, 401)

  let payload: { event?: Record<string, unknown> }
  try {
    payload = await req.json()
  } catch {
    return json({ error: "invalid json" }, 400)
  }

  const event = payload.event
  if (!event || typeof event !== "object") return json({ error: "missing event" }, 400)

  const entitlementId = Deno.env.get("REVENUECAT_ENTITLEMENT_ID") ?? "premium"
  const ids = Array.isArray(event.entitlement_ids)
    ? event.entitlement_ids.filter((id): id is string => typeof id === "string")
    : []
  const expiresAt =
    typeof event.expiration_at_ms === "number" ? new Date(event.expiration_at_ms).toISOString() : null
  const type = typeof event.type === "string" ? event.type : ""
  const now = Date.now()
  const premium =
    !REVOKE.has(type) &&
    ids.includes(entitlementId) &&
    !(expiresAt && Date.parse(expiresAt) <= now)

  const userId = uuid(str(event.app_user_id)) ?? uuid(str(event.original_app_user_id))
  if (!userId) return json({ ok: true, ignored: "no supabase user id" })

  const url = Deno.env.get("SUPABASE_URL") ?? ""
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  if (!url || !key) return json({ error: "server missing supabase" }, 500)

  const supabase = createClient(url, key)
  const { error } = await supabase.from("entitlements").upsert({
    user_id: userId,
    status: premium ? "premium" : "free",
    product_id: str(event.product_id) ?? null,
    expires_at: premium ? expiresAt : null,
    rc_app_user_id: str(event.app_user_id) ?? userId,
    updated_at: new Date().toISOString(),
  })
  if (error) return json({ error: error.message }, 500)
  return json({ ok: true, status: premium ? "premium" : "free" })
})

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

function uuid(value: string | undefined): string | undefined {
  if (!value) return undefined
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : undefined
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}
