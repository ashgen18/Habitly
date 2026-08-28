import { useEffect, useState } from "react"
import { ScrollView } from "react-native"
import { todayISO } from "@/src/domain/dates.ts"
import { PremiumFeature } from "@/src/domain/premium/entitlement.ts"
import { monthlyReport } from "@/src/domain/premium/insights.ts"
import { loadInsights, type InsightResult } from "@/src/ai/insights.ts"
import { useStore } from "@/src/lib/store"
import { Body, Card, Heading, Muted, Screen } from "@/components/ui"
import { Paywall } from "@/components/Paywall"

export default function InsightsScreen() {
  const { activeHabits, completedDates, state, hydrated, canAccess } = useStore()
  const premium = canAccess(PremiumFeature.AIInsights)
  const today = todayISO()
  const [result, setResult] = useState<InsightResult | null>(null)

  useEffect(() => {
    if (!hydrated || !premium) return
    const completions = Object.fromEntries(activeHabits.map((h) => [h.id, completedDates(h.id)]))
    void loadInsights(activeHabits, completions, today, state.settings.weekStartsOn).then(setResult)
  }, [activeHabits, completedDates, hydrated, premium, state.settings.weekStartsOn, today])

  const report = monthlyReport(
    activeHabits,
    Object.fromEntries(activeHabits.map((h) => [h.id, completedDates(h.id)])),
    today.slice(0, 7),
    state.settings.weekStartsOn,
    today
  )

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 12 }}>
        <Heading>Insights</Heading>
        {!hydrated ? <Muted>Loading your board…</Muted> : null}
        {!premium ? (
          <Paywall feature={PremiumFeature.AIInsights} />
        ) : (
          <>
            <Muted>
              {result?.source === "model"
                ? "Written from your history by the Habitly insights function."
                : "Local patterns from your own check-ins. Not an external AI until a model key is set."}
            </Muted>
            {!result ? <Muted>Reading your history…</Muted> : null}
            {result && result.insights.length === 0 ? (
              <Card>
                <Body>Not enough history yet for a useful observation. Keep tapping.</Body>
              </Card>
            ) : null}
            {result?.insights.map((insight) => (
              <Card key={insight.id}>
                <Body>{insight.text}</Body>
              </Card>
            ))}
            <Card>
              <Muted>{report.title}</Muted>
              <Heading style={{ fontSize: 22, marginTop: 6 }}>{report.consistency}%</Heading>
              <Muted style={{ marginTop: 6 }}>Best: {report.bestHabit ?? "—"}</Muted>
              <Muted>Most improved: {report.mostImproved ?? "—"}</Muted>
              <Muted>Longest streak: {report.longestStreak}</Muted>
            </Card>
          </>
        )}
      </ScrollView>
    </Screen>
  )
}
