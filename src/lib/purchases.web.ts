import { FREE_ENTITLEMENT, type Entitlement } from "@/src/domain/premium/entitlement.ts"
import type { RevenueCatCustomerInfo } from "@/src/domain/premium/revenuecat.ts"

export type StoreOffering = {
  productId: string
  title: string
  priceString: string
}

export function purchasesAvailable(): boolean {
  return false
}

export async function configurePurchases(_appUserId?: string | null): Promise<boolean> {
  return false
}

export async function identifyPurchaser(_appUserId: string | null): Promise<void> {}

export async function fetchCustomerInfo(): Promise<RevenueCatCustomerInfo | null> {
  return null
}

export async function fetchStoreOfferings(): Promise<StoreOffering[]> {
  return []
}

export async function purchaseProduct(_productId: string): Promise<Entitlement | { error: string }> {
  return { error: "Purchases are available in the iOS and Android apps." }
}

export async function restorePurchases(): Promise<Entitlement | { error: string }> {
  return { error: "Restore is available in the iOS and Android apps." }
}

export function emptySessionEntitlement(): Entitlement {
  return { ...FREE_ENTITLEMENT }
}
