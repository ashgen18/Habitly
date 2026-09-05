import { Platform } from "react-native"
import Constants from "expo-constants"
import { FREE_ENTITLEMENT, STORE_PRODUCTS, type Entitlement } from "@/src/domain/premium/entitlement.ts"
import {
  entitlementFromCustomerInfo,
  PREMIUM_ENTITLEMENT_ID,
  type RevenueCatCustomerInfo,
} from "@/src/domain/premium/revenuecat.ts"

export type StoreOffering = {
  productId: string
  title: string
  priceString: string
}

function apiKey(): string {
  if (Platform.OS === "ios") return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? ""
  if (Platform.OS === "android") return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? ""
  return ""
}

function isExpoGo(): boolean {
  return Constants.appOwnership === "expo"
}

/** Native StoreKit via RevenueCat. Expo Go mocks purchases — treat that as unavailable. */
export function purchasesAvailable(): boolean {
  if (Platform.OS === "web") return false
  if (isExpoGo()) return false
  return Boolean(apiKey())
}

async function sdk() {
  if (!purchasesAvailable()) return null
  return (await import("react-native-purchases")).default
}

export async function configurePurchases(appUserId?: string | null): Promise<boolean> {
  const Purchases = await sdk()
  if (!Purchases) return false
  const key = apiKey()
  if (!key) return false
  Purchases.configure({
    apiKey: key,
    appUserID: appUserId || undefined,
  })
  return true
}

export async function identifyPurchaser(appUserId: string | null): Promise<void> {
  const Purchases = await sdk()
  if (!Purchases) return
  try {
    if (appUserId) {
      await Purchases.logIn(appUserId)
      return
    }
    await Purchases.logOut()
  } catch {
    // Anonymous session or already logged out.
  }
}

export async function fetchCustomerInfo(): Promise<RevenueCatCustomerInfo | null> {
  const Purchases = await sdk()
  if (!Purchases) return null
  return Purchases.getCustomerInfo()
}

export async function fetchStoreOfferings(): Promise<StoreOffering[]> {
  const Purchases = await sdk()
  if (!Purchases) return []
  const offerings = await Purchases.getOfferings()
  const packs = offerings.current?.availablePackages ?? []
  const known = new Set(Object.values(STORE_PRODUCTS).map((p) => p.id))
  return packs
    .filter((pack) => known.has(pack.product.identifier))
    .map((pack) => ({
      productId: pack.product.identifier,
      title: pack.product.title,
      priceString: pack.product.priceString,
    }))
}

export async function purchaseProduct(productId: string): Promise<Entitlement | { error: string }> {
  const Purchases = await sdk()
  if (!Purchases) return { error: "Purchases are not available on this device." }
  const offerings = await Purchases.getOfferings()
  const pack = offerings.current?.availablePackages.find((p) => p.product.identifier === productId)
  if (!pack) return { error: "That plan is not in the current offering." }
  try {
    const { customerInfo } = await Purchases.purchasePackage(pack)
    return entitlementFromCustomerInfo(customerInfo, PREMIUM_ENTITLEMENT_ID)
  } catch (err) {
    const code = (err as { code?: string }).code
    if (code === "1" || code === "PURCHASE_CANCELLED") return { error: "Purchase cancelled." }
    return { error: err instanceof Error ? err.message : "Purchase failed." }
  }
}

export async function restorePurchases(): Promise<Entitlement | { error: string }> {
  const Purchases = await sdk()
  if (!Purchases) return { error: "Restore is not available on this device." }
  try {
    const info = await Purchases.restorePurchases()
    return entitlementFromCustomerInfo(info, PREMIUM_ENTITLEMENT_ID)
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Restore failed." }
  }
}

export function emptySessionEntitlement(): Entitlement {
  return { ...FREE_ENTITLEMENT }
}
