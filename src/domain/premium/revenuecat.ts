import {
  FREE_ENTITLEMENT,
  isPremiumActive,
  type Entitlement,
} from "./entitlement.ts"

/** RevenueCat entitlement identifier. Attach App Store products to this in the dashboard. */
export const PREMIUM_ENTITLEMENT_ID = "premium"

export type RevenueCatActiveEntitlement = {
  identifier?: string
  isActive?: boolean
  productIdentifier?: string
  expirationDate?: string | null
}

export type RevenueCatCustomerInfo = {
  entitlements?: {
    active?: Record<string, RevenueCatActiveEntitlement>
  }
}

export type RevenueCatWebhookEvent = {
  type?: string
  app_user_id?: string
  original_app_user_id?: string
  product_id?: string
  entitlement_ids?: string[] | null
  expiration_at_ms?: number | null
}

export type ServerEntitlementRow = {
  status?: string
  product_id?: string | null
  expires_at?: string | null
  updated_at?: string | null
}

const REVOKE_EVENTS = new Set(["EXPIRATION", "REFUND", "SUBSCRIPTION_PAUSED"])

export function entitlementFromCustomerInfo(
  info: RevenueCatCustomerInfo,
  entitlementId = PREMIUM_ENTITLEMENT_ID,
  now = new Date().toISOString()
): Entitlement {
  const active = info.entitlements?.active?.[entitlementId]
  if (!active || active.isActive === false) return { ...FREE_ENTITLEMENT, updatedAt: now }
  return {
    status: "premium",
    source: "storekit",
    productId: active.productIdentifier || null,
    expiresAt: active.expirationDate ?? null,
    updatedAt: now,
  }
}

export function entitlementFromWebhookEvent(
  event: RevenueCatWebhookEvent,
  entitlementId = PREMIUM_ENTITLEMENT_ID,
  nowMs = Date.now()
): Entitlement {
  const updatedAt = new Date(nowMs).toISOString()
  const ids = event.entitlement_ids ?? []
  const hasPremium = ids.includes(entitlementId)
  const expiresAt =
    event.expiration_at_ms == null ? null : new Date(event.expiration_at_ms).toISOString()

  if (REVOKE_EVENTS.has(event.type ?? "") || !hasPremium) {
    return { ...FREE_ENTITLEMENT, updatedAt }
  }
  if (expiresAt && Date.parse(expiresAt) <= nowMs) {
    return { ...FREE_ENTITLEMENT, updatedAt }
  }
  return {
    status: "premium",
    source: "storekit",
    productId: event.product_id ?? null,
    expiresAt,
    updatedAt,
  }
}

export function entitlementFromServerRow(
  row: ServerEntitlementRow | null | undefined,
  now = new Date().toISOString()
): Entitlement {
  if (!row || row.status !== "premium") return { ...FREE_ENTITLEMENT, updatedAt: now }
  return {
    status: "premium",
    source: "storekit",
    productId: row.product_id ?? null,
    expiresAt: row.expires_at ?? null,
    updatedAt: row.updated_at ?? now,
  }
}

/** Keep the stronger validated entitlement. Board JSON is never passed in. */
export function preferEntitlement(a: Entitlement, b: Entitlement, now = Date.now()): Entitlement {
  const aOn = isPremiumActive(a, now)
  const bOn = isPremiumActive(b, now)
  if (aOn && !bOn) return a
  if (bOn && !aOn) return b
  if (!aOn && !bOn) return { ...FREE_ENTITLEMENT }
  if (a.expiresAt == null) return a
  if (b.expiresAt == null) return b
  return Date.parse(a.expiresAt) >= Date.parse(b.expiresAt) ? a : b
}
