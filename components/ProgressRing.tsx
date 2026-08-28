import { StyleSheet, Text, View } from "react-native";

export function ProgressRing({
  value,
  target,
  color,
  size = 48,
}: {
  value: number;
  target: number;
  color: string;
  size?: number;
}) {
  const progress = target <= 0 ? 0 : Math.min(1, value / target);
  const done = progress >= 1;

  return (
    <View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          backgroundColor: done ? color : "transparent",
        },
      ]}
    >
      <Text style={[styles.label, { color: done ? "#fff" : color, fontSize: size * 0.28 }]}>
        {done ? "✓" : `${Math.round(progress * 100)}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontWeight: "700" },
});
