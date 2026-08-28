import { useMemo, useState } from "react"
import { Pressable, ScrollView, Text, View } from "react-native"
import { addMonths, dayKind, daysInMonth, startOfMonth, weekday } from "@/src/domain/habit-logic.ts"
import { monthLong, todayISO } from "@/src/domain/dates.ts"
import { paletteOf } from "@/src/domain/palettes.ts"
import { useStore } from "@/src/lib/store"
import { Heading, Muted, Screen, useTheme } from "@/components/ui"

export default function HistoryScreen() {
  const theme = useTheme()
  const { activeHabits, completedDates, state, hydrated, toggleCheck } = useStore()
  const [habitId, setHabitId] = useState<string | null>(null)
  const [cursor, setCursor] = useState(startOfMonth(todayISO()))
  const weekStartsOn = state.settings.weekStartsOn
  const today = todayISO()
  const habit = activeHabits.find((h) => h.id === (habitId ?? activeHabits[0]?.id)) ?? null
  const checks = habit ? completedDates(habit.id) : new Set<string>()
  const days = useMemo(() => daysInMonth(cursor), [cursor])
  const lead = days[0] ? (weekday(days[0]) + 7 - weekStartsOn) % 7 : 0
  const palette = habit ? paletteOf(habit.palette) : null

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Heading>History</Heading>
        {!hydrated ? <Muted style={{ marginTop: 12 }}>Loading your board…</Muted> : null}
        {hydrated && activeHabits.length === 0 ? (
          <Muted style={{ marginTop: 12 }}>Add a habit on Today to fill this calendar.</Muted>
        ) : null}
        <ScrollView horizontal style={{ marginTop: 16 }} contentContainerStyle={{ gap: 8 }}>
          {activeHabits.map((h) => {
            const on = habit?.id === h.id
            return (
              <Pressable
                key={h.id}
                onPress={() => setHabitId(h.id)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 14,
                  backgroundColor: on ? theme.tint : theme.card,
                }}
              >
                <Text style={{ color: on ? "#FFFCF8" : theme.text }}>
                  {h.icon} {h.name}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20, alignItems: "center" }}>
          <Pressable onPress={() => setCursor(addMonths(cursor, -1))}>
            <Text style={{ color: theme.tint, fontSize: 16 }}>Previous</Text>
          </Pressable>
          <Muted>
            {monthLong(cursor)} {cursor.slice(0, 4)}
          </Muted>
          <Pressable onPress={() => setCursor(addMonths(cursor, 1))}>
            <Text style={{ color: theme.tint, fontSize: 16 }}>Next</Text>
          </Pressable>
        </View>
        {habit && palette ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 16 }}>
            {Array.from({ length: lead }).map((_, i) => (
              <View key={`lead-${i}`} style={{ width: "14.28%", aspectRatio: 1 }} />
            ))}
            {days.map((iso) => {
              const kind = dayKind(habit, iso, checks, today, weekStartsOn)
              const bg =
                kind === "completed"
                  ? palette.cell
                  : kind === "missed"
                    ? "#E8D5C8"
                    : kind === "due"
                      ? theme.line
                      : "transparent"
              return (
                <Pressable
                  key={iso}
                  disabled={iso > today}
                  onPress={() => toggleCheck(habit.id, iso)}
                  style={{
                    width: "14.28%",
                    aspectRatio: 1,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      backgroundColor: bg,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: kind === "completed" ? "#FFFCF8" : theme.text, fontSize: 13 }}>
                      {Number(iso.slice(8))}
                    </Text>
                  </View>
                </Pressable>
              )
            })}
          </View>
        ) : null}
        <Muted style={{ marginTop: 16 }}>Tap a past day to complete or undo. Off days stay empty.</Muted>
      </ScrollView>
    </Screen>
  )
}
