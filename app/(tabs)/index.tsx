import { useMemo } from "react"
import { Pressable, ScrollView, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { dayNumber, greeting, monthLong, todayISO, weekdayLong } from "@/src/domain/dates.ts"
import { isScheduledOn } from "@/src/domain/habit-logic.ts"
import { useStore } from "@/src/lib/store"
import { Body, Button, Heading, Muted, Screen, useTheme } from "@/components/ui"
import { HabitRow } from "@/components/HabitRow"
import { QuoteCard } from "@/components/QuoteCard"
import { ProgressRing } from "@/components/ProgressRing"

export default function TodayScreen() {
  const router = useRouter()
  const theme = useTheme()
  const { activeHabits, state, hydrated, toggleCheck, completedDates, isChecked, tapCountFor } =
    useStore()
  const today = todayISO()
  const weekStartsOn = state.settings.weekStartsOn

  const todayHabits = useMemo(
    () =>
      activeHabits.filter((h) => {
        const set = completedDates(h.id)
        return isScheduledOn(h, today, set, weekStartsOn) || isChecked(h.id, today)
      }),
    [activeHabits, completedDates, isChecked, today, weekStartsOn]
  )

  const doneCount = todayHabits.filter((h) => isChecked(h.id, today)).length
  const name = state.settings.displayName.trim()
  const headline = name ? `${greeting()}, ${name}` : greeting()

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Muted>
              {weekdayLong(today)} {dayNumber(today)} {monthLong(today)}
            </Muted>
            <Heading style={{ marginTop: 4 }}>{headline}</Heading>
          </View>
          <Pressable
            accessibilityLabel="Add habit"
            onPress={() => router.push("/habit/new")}
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: theme.tint,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#FFFCF8", fontSize: 28, marginTop: -2 }}>+</Text>
          </Pressable>
        </View>

        <QuoteCard />
        <ProgressRing done={doneCount} total={todayHabits.length} />

        {!hydrated ? (
          <Muted>Loading your board…</Muted>
        ) : activeHabits.length === 0 ? (
          <View
            style={{
              marginTop: 8,
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: theme.line,
              borderRadius: 24,
              padding: 28,
              alignItems: "center",
            }}
          >
            <Heading style={{ fontSize: 20 }}>No habits yet</Heading>
            <Muted style={{ marginTop: 8, textAlign: "center" }}>
              One daily tap. Start with water, reading, or a walk.
            </Muted>
            <Button title="Add a habit" style={{ marginTop: 16 }} onPress={() => router.push("/habit/new")} />
          </View>
        ) : todayHabits.length === 0 ? (
          <Muted>Nothing is scheduled for today. Enjoy the gap, or add a daily habit.</Muted>
        ) : (
          <View style={{ gap: 10 }}>
            {todayHabits.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                checks={completedDates(habit.id)}
                weekStartsOn={weekStartsOn}
                onToggle={() => toggleCheck(habit.id)}
                taps={tapCountFor(habit.id, today)}
              />
            ))}
          </View>
        )}
        <Body style={{ marginTop: 24, color: theme.muted, fontSize: 13 }}>
          Free tracks habits. Premium helps you understand them.
        </Body>
      </ScrollView>
    </Screen>
  )
}
