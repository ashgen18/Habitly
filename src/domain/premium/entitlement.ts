export const PremiumFeature = {
  advancedAnalytics: "advancedAnalytics",
  advancedCharts: "advancedCharts",
  goals: "goals",
  categories: "categories",
  habitStacking: "habitStacking",
  advancedScheduling: "advancedScheduling",
  advancedReminders: "advancedReminders",
  iCloudSync: "iCloudSync",
  advancedWidgets: "advancedWidgets",
  advancedReports: "advancedReports",
  AIInsights: "AIInsights",
  habitTemplates: "habitTemplates",
  achievements: "achievements",
  advancedCustomization: "advancedCustomization",
} as const

export type PremiumFeature = (typeof PremiumFeature)[keyof typeof PremiumFeature]

export type FeatureCopy = {
  title: string
  benefit: string
  perks: string[]
}

export const FEATURE_COPY: Record<PremiumFeature, FeatureCopy> = {
  advancedAnalytics: {
    title: "Advanced Analytics",
    benefit: "Understand exactly when and how consistently you complete your habits.",
    perks: [
      "7/30/90/365-day trends",
      "Consistency scores",
      "Streak analytics",
      "Missed-day accounting that skips off days",
    ],
  },
  advancedCharts: {
    title: "Advanced Charts",
    benefit: "See the shape of your consistency, not just a streak number.",
    perks: ["Completion trend", "Weekly and monthly consistency", "Day-of-week patterns", "Streak history"],
  },
  goals: {
    title: "Goals",
    benefit: "Turn a habit into a target you can finish.",
    perks: ["Daily, weekly, monthly, and yearly goals", "Progress and remaining", "Deadlines"],
  },
  categories: {
    title: "Categories",
    benefit: "See which part of life is actually holding.",
    perks: ["Health, fitness, and more", "Custom categories", "Category consistency"],
  },
  habitStacking: {
    title: "Routines",
    benefit: "Build a sequence from habits you already track.",
    perks: ["Morning and evening stacks", "Reorder without duplicating habits", "Complete one step at a time"],
  },
  advancedScheduling: {
    title: "Advanced scheduling",
    benefit: "Match the calendar you actually live on.",
    perks: ["Every N days", "Specific dates", "Weekday or weekend presets"],
  },
  advancedReminders: {
    title: "Advanced reminders",
    benefit: "A nudge when it still helps — not a barrage.",
    perks: ["Multiple times", "Custom text", "Follow-up if today is still empty"],
  },
  iCloudSync: {
    title: "iCloud Sync",
    benefit: "Keep the same board on every device, still usable offline.",
    perks: ["Offline first", "Conflict-safe identifiers", "Nothing deleted on a sync miss"],
  },
  advancedWidgets: {
    title: "Widgets",
    benefit: "Today, streaks, and goals on the Home Screen.",
    perks: ["Small, medium, and large", "Streak and weekly stats", "A single-habit glance"],
  },
  advancedReports: {
    title: "Reports",
    benefit: "A month or year you can actually read — and share if you want.",
    perks: ["Monthly and yearly summaries", "Best habit and longest streak", "Share a clean snapshot"],
  },
  AIInsights: {
    title: "Insights",
    benefit: "Plain-language patterns from your own history.",
    perks: ["Weekend vs weekday", "Habit pairing", "Month-over-month change"],
  },
  habitTemplates: {
    title: "Templates",
    benefit: "Start a routine in one tap, then edit it like any other habit.",
    perks: ["Morning, fitness, productivity, mindfulness", "Installs real habits", "Yours to change"],
  },
  achievements: {
    title: "Achievements",
    benefit: "Quiet milestones for consistency you already earned.",
    perks: ["Streaks and totals", "Perfect weeks", "Awarded once from real data"],
  },
  advancedCustomization: {
    title: "Appearance",
    benefit: "A board that still reads in Dark Mode.",
    perks: ["Extra themes", "Accent palettes", "No contrast sacrificed"],
  },
}

export const STORE_PRODUCTS = {
  monthly: { id: "habitly_premium_monthly", period: "month" as const },
  annual: { id: "habitly_premium_annual", period: "year" as const },
  lifetime: { id: "habitly_premium_lifetime", period: "lifetime" as const },
}

export type EntitlementSource = "none" | "storekit"

export type Entitlement = {
  status: "free" | "premium"
  source: EntitlementSource
  productId: string | null
  expiresAt: string | null
  updatedAt?: string
}

export const FREE_ENTITLEMENT: Entitlement = {
  status: "free",
  source: "none",
  productId: null,
  expiresAt: null,
}

/** Flip a flag here to hide a Premium surface without scattering checks. */
export const FEATURE_ENABLED: Record<PremiumFeature, boolean> = {
  advancedAnalytics: true,
  advancedCharts: true,
  goals: true,
  categories: true,
  habitStacking: true,
  advancedScheduling: true,
  advancedReminders: false,
  iCloudSync: false,
  advancedWidgets: false,
  advancedReports: true,
  AIInsights: true,
  habitTemplates: true,
  achievements: true,
  advancedCustomization: true,
}

export function isPremiumActive(_entitlement: Entitlement, _now = Date.now()): boolean {
  // TODO: Replace temporary entitlement handling with server-validated RevenueCat/App Store entitlement.
  return false
}

export function canAccessFeature(
  entitlement: Entitlement,
  feature: PremiumFeature,
  now = Date.now()
): boolean {
  if (!FEATURE_ENABLED[feature]) return false
  return isPremiumActive(entitlement, now)
}

/** Single source of truth for the current session. */
export class PremiumEntitlementManager {
  readonly entitlement: Entitlement
  readonly now: number

  constructor(entitlement: Entitlement, now = Date.now()) {
    this.entitlement = entitlement
    this.now = now
  }

  get status() {
    return isPremiumActive(this.entitlement, this.now) ? "premium" : "free"
  }

  isPremium() {
    return this.status === "premium"
  }

  canAccess(feature: PremiumFeature) {
    return canAccessFeature(this.entitlement, feature, this.now)
  }
}
