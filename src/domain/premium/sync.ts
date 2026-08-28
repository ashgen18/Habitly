export type SyncStatus = "local" | "offline" | "error" | "unavailable"

/** Port for CloudKit / iCloud. This web build stays local-first. */
export type SyncAdapter = {
  id: string
  status(): SyncStatus
  push(): Promise<{ ok: boolean; message: string }>
  pull(): Promise<{ ok: boolean; message: string }>
}

export const localSyncAdapter: SyncAdapter = {
  id: "local",
  status: () => "local",
  async push() {
    return { ok: true, message: "Saved on this device." }
  },
  async pull() {
    return { ok: true, message: "Already on this device." }
  },
}

export const icloudSyncAdapter: SyncAdapter = {
  id: "icloud",
  status: () => "unavailable",
  async push() {
    return {
      ok: false,
      message: "iCloud isn’t available in this web preview. Your board stays on this device.",
    }
  },
  async pull() {
    return {
      ok: false,
      message: "iCloud isn’t available in this web preview. Nothing was overwritten.",
    }
  },
}

export type StoreKitProduct = {
  id: string
  displayName: string
  /** Empty until StoreKit returns a localized price. */
  localizedPrice: string | null
}

export async function fetchStoreProducts(): Promise<StoreKitProduct[]> {
  return [
    { id: "habitly_premium_monthly", displayName: "Premium Monthly", localizedPrice: null },
    { id: "habitly_premium_annual", displayName: "Premium Annual", localizedPrice: null },
    { id: "habitly_premium_lifetime", displayName: "Premium Lifetime", localizedPrice: null },
  ]
}

export async function purchaseStoreProduct(productId: string): Promise<{ ok: false; reason: "not_configured" }> {
  void productId
  return { ok: false, reason: "not_configured" }
}

export async function restoreStorePurchases(): Promise<{ ok: false; reason: "not_configured" }> {
  return { ok: false, reason: "not_configured" }
}

/** Last-write-wins by updatedAt. Never drops a record that only exists locally. */
export function mergeByUpdatedAt<T extends { id: string; updatedAt?: string }>(
  local: T[],
  remote: T[]
): T[] {
  const map = new Map(local.map((row) => [row.id, row]))
  for (const row of remote) {
    const current = map.get(row.id)
    if (!current) {
      map.set(row.id, row)
      continue
    }
    if ((row.updatedAt ?? "") > (current.updatedAt ?? "")) map.set(row.id, row)
  }
  return [...map.values()]
}
