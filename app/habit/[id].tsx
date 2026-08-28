import { useLocalSearchParams, useRouter } from "expo-router"
import { Pressable, ScrollView, Text, TextInput, View } from "react-native"
import { useState } from "react"
import { addMonths, dayKind, daysInMonth, habitStats, startOfMonth } from "@/src/domain/habit-logic.ts"
import { todayISO } from "@/src/domain/dates.ts"
import { paletteOf } from "@/src/domain/palettes.ts"
import { habitToDraft, useStore } from "@/src/lib/store"
import { Body, Button, Card, Heading, Muted, Screen, useTheme } from "@/components/ui"
import { HabitForm } from "@/components/HabitForm"

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const theme = useTheme()
  const store = useStore()
  const habit = store.state.habits.find((h) => h.id === id)
  const [editing, setEditing] = useState(false)
  const [note, setNote] = useState("")
  const today = todayISO()

  if (!store.hydrated) {
    return (
      <Screen>
        <Muted style={{ padding: 20 }}>Loading your board…</Muted>
      </Screen>
    )
  }

  if (!habit) {
    return (
      <Screen>
        <View style={{ padding: 20, gap: 12 }}>
          <Heading>Habit gone</Heading>
          <Muted>It may have been deleted on this device.</Muted>
          <Button title="Back to Today" onPress={() => router.replace("/")} />
        </View>
      </Screen>
    )
  }

  const checks = store.completedDates(habit.id)
  const stats = habitStats(habit, checks, today, store.state.settings.weekStartsOn)
  const palette = paletteOf(habit.palette)
  const month = startOfMonth(today)
  const days = daysInMonth(month)

  if (editing) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <HabitForm
            initial={habitToDraft(habit)}
            onSave={(draft) => {
              const error = store.updateHabit(habit.id, draft)
              if (!error) setEditing(false)
              return error
            }}
            onCancel={() => setEditing(false)}
          />
        </ScrollView>
      </Screen>
    )
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 12 }}>
        <Heading>
          {habit.icon} {habit.name}
        </Heading>
        <Muted>
          {stats.currentStreak} {stats.streakUnit} streak · {stats.completionPct}% complete
        </Muted>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
          {days.map((iso) => {
            const kind = dayKind(habit, iso, checks, today, store.state.settings.weekStartsOn)
            const bg = kind === "completed" ? palette.cell : kind === "missed" ? "#E8D5C8" : "transparent"
            return (
              <View
                key={iso}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 5,
                  margin: 2,
                  backgroundColor: bg || theme.line,
                  opacity: kind === "off" || kind === "future" ? 0.25 : 1,
                }}
              />
            )
          })}
        </View>
        <Muted>
          {addMonths(month, 0).slice(0, 7)} grid. Off days stay empty on purpose.
        </Muted>
        <Card>
          <Muted>Note for today</Muted>
          <TextInput
            value={note || store.completionNote(habit.id, today)}
            onChangeText={(value) => {
              setNote(value)
              store.setCompletionNote(habit.id, today, value)
            }}
            placeholder="What counted today"
            placeholderTextColor={theme.muted}
            multiline
            style={{ color: theme.text, marginTop: 8, minHeight: 64 }}
          />
        </Card>
        {habit.notes ? (
          <Card>
            <Muted>Habit note</Muted>
            <Body style={{ marginTop: 6 }}>{habit.notes}</Body>
          </Card>
        ) : null}
        <Button title={store.isChecked(habit.id, today) ? "Undo today" : "Complete today"} onPress={() => store.toggleCheck(habit.id)} />
        <Button title="Edit" variant="ghost" onPress={() => setEditing(true)} />
        {habit.archivedAt ? (
          <Button title="Restore" variant="ghost" onPress={() => store.restoreHabit(habit.id)} />
        ) : (
          <Button title="Archive" variant="ghost" onPress={() => store.archiveHabit(habit.id)} />
        )}
        <Pressable onPress={() => store.deleteHabit(habit.id)}>
          <Text style={{ color: "#B42318", textAlign: "center", marginTop: 8 }}>Delete forever</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  )
}
