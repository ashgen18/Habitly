import { Pressable, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { todayKey } from "@/src/domain/dates";
import type { BoardState, Habit } from "@/src/domain/types";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { ProgressRing } from "./ProgressRing";

export function HabitRow({
  habit,
  state,
  onTick,
}: {
  habit: Habit;
  state: BoardState;
  onTick: () => void;
}) {
  const scheme = useColorScheme() ?? "light";
  const palette = Colors[scheme];
  const today = todayKey();
  const logged = state.logs[habit.id]?.[today] ?? 0;
  const done = logged >= habit.target;
  const color = Colors.habit[habit.color];

  return (
    <View style={[styles.row, { backgroundColor: palette.card, borderColor: palette.line }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={done ? `Undo ${habit.name}` : `Log ${habit.name}`}
        onPress={onTick}
        style={styles.ringHit}
      >
        <ProgressRing value={logged} target={habit.target} color={color} size={44} />
      </Pressable>
      <Link href={`/habit/${habit.id}`} asChild>
        <Pressable style={styles.body}>
          <Text style={[styles.name, { color: palette.text }]} numberOfLines={1}>
            {habit.name}
          </Text>
          <Text style={[styles.meta, { color: palette.muted }]}>
            {logged} / {habit.target} {habit.unit}
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 12,
  },
  ringHit: { padding: 2 },
  body: { flex: 1, minWidth: 0, gap: 2 },
  name: { fontSize: 16, fontWeight: "600" },
  meta: { fontSize: 13 },
});
