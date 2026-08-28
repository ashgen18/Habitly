import { ScrollView, View } from "react-native"
import { habitStats, overallWeek } from "@/src/domain/habit-logic.ts"
import { analyzeHabit } from "@/src/domain/premium/analytics.ts"
import { todayISO } from "@/src/domain/dates.ts"
import { PremiumFeature } from "@/src/domain/premium/entitlement.ts"
import { useStore } from "@/src/lib/store"
import { Body, Card, Heading, Muted, Screen } from "@/components/ui"
import { Paywall } from "@/components/Paywall"

export default function StatsScreen() {
  const { activeHabits, completedDates, state, hydrated, canAccess } = useStore()
  const today = todayISO()
  const weekStartsOn = state.settings.weekStartsOn
  const week = overallWeek(
    activeHabits,
    activeHabits.map((h) => completedDates(h.id)),
    today,
    weekStartsOn
  )
  const premium = canAccess(PremiumFeature.advancedAnalytics)

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 12 }}>
        <Heading>Stats</Heading>
        {!hydrated ? <Muted>Loading your board…</Muted> : null}
        <Card>
          <Muted>This week</Muted>
          <Heading style={{ fontSize: 28, marginTop: 4 }}>
            {week.done} / {week.total}
          </Heading>
          <Muted>{week.pct}% of scheduled check-ins</Muted>
        </Card>
        {activeHabits.length === 0 ? (
          <Muted>Stats appear after you add a habit.</Muted>
        ) : (
          activeHabits.map((habit) => {
            const set = completedDates(habit.id)
            const stats = habitStats(habit, set, today, weekStartsOn)
            const extra = premium ? analyzeHabit(habit, set, today, weekStartsOn) : null
            return (
              <Card key={habit.id}>
                <Body>
                  {habit.icon} {habit.name}
                </Body>
                <Muted style={{ marginTop: 6 }}>
                  {stats.currentStreak} {stats.streakUnit} streak · best {stats.bestStreak} ·{" "}
                  {stats.completionPct}% all time
                </Muted>
                {extra ? (
                  <Muted style={{ marginTop: 6 }}>
                    7d {extra.rate7}% · 30d {extra.rate30}% · missed {extra.missedScheduled}
                  </Muted>
                ) : null}
              </Card>
            )
          })
        )}
        {!premium ? <Paywall feature={PremiumFeature.advancedAnalytics} /> : null}
      </ScrollView>
    </Screen>
  )
}
