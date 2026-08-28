import { Pressable, StyleSheet, Text, View } from "react-native"
import { Link } from "expo-router"
import type { Habit } from "@/src/domain/types.ts"
import { habitStats, isScheduledOn } from "@/src/domain/habit-logic.ts"
import { todayISO } from "@/src/domain/dates.ts"
import { paletteOf } from "@/src/domain/palettes.ts"
import { useTheme } from "@/components/ui"

export function HabitRow({
  habit,
  checks,
  weekStartsOn,
  onToggle,
  taps,
}: {
  habit: Habit
  checks: ReadonlySet<string>
  weekStartsOn: 0 | 1
  onToggle: () => void
  taps: number
}) {
  const theme = useTheme()
  const today = todayISO()
  const done = checks.has(today)
  const stats = habitStats(habit, checks, today, weekStartsOn)
  const due = isScheduledOn(habit, today, checks, weekStartsOn)
  const palette = paletteOf(habit.palette)
  const target = habit.frequency === "times_per_day" ? Math.max(1, habit.timesPerDay ?? 1) : 1

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: theme.card, borderColor: theme.line },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={done ? `Undo ${habit.name}` : `Complete ${habit.name}`}
        onPress={onToggle}
        style={[
          styles.check,
          {
            backgroundColor: done ? palette.cell : theme.background,
            borderColor: done ? palette.cell : theme.line,
          },
        ]}
      >
        <Text style={{ fontSize: 18 }}>{done ? "✓" : habit.icon}</Text>
      </Pressable>
      <Link href={`/habit/${habit.id}`} asChild>
        <Pressable style={styles.body}>
          <Text style={{ color: theme.text, fontSize: 17, fontWeight: "600" }}>{habit.name}</Text>
          <Text style={{ color: theme.muted, fontSize: 13, marginTop: 2 }}>
            {stats.currentStreak} {stats.streakUnit} streak
            {due && !done ? " · due today" : ""}
            {target > 1 ? ` · ${taps}/${target}` : ""}
          </Text>
        </Pressable>
      </Link>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 20,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  check: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  body: {
    flex: 1,
    paddingVertical: 4,
  },
})
