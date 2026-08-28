import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { PALETTES, type Palette } from "@/src/domain/palettes";
import {
  HABIT_UNITS,
  type HabitUnit,
} from "@/src/domain/types";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

export type HabitFormValue = {
  name: string;
  color: Palette;
  unit: HabitUnit;
  target: number;
};

export function HabitForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Partial<HabitFormValue>;
  submitLabel: string;
  onSubmit: (value: HabitFormValue) => void;
}) {
  const scheme = useColorScheme() ?? "light";
  const palette = Colors[scheme];
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState<Palette>(initial?.color ?? "sage");
  const [unit, setUnit] = useState<HabitUnit>(initial?.unit ?? "times");
  const [target, setTarget] = useState(String(initial?.target ?? 1));

  return (
    <View style={styles.form}>
      <View style={styles.field}>
        <Text style={[styles.label, { color: palette.muted }]}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Morning walk"
          placeholderTextColor={palette.faint}
          style={[styles.input, { color: palette.text, borderColor: palette.line }]}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: palette.muted }]}>Color</Text>
        <View style={styles.swatches}>
          {PALETTES.map((p) => (
            <Pressable
              key={p}
              accessibilityRole="button"
              accessibilityLabel={p}
              onPress={() => setColor(p)}
              style={[
                styles.swatch,
                { backgroundColor: Colors.habit[p] },
                color === p && styles.swatchOn,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: palette.muted }]}>Unit</Text>
        <View style={styles.chips}>
          {HABIT_UNITS.map((u) => (
            <Pressable
              key={u}
              onPress={() => setUnit(u)}
              style={[
                styles.chip,
                { borderColor: palette.line },
                unit === u && { backgroundColor: palette.ink, borderColor: palette.ink },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: palette.text },
                  unit === u && { color: palette.paper },
                ]}
              >
                {u}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: palette.muted }]}>Daily target</Text>
        <TextInput
          value={target}
          onChangeText={setTarget}
          keyboardType="number-pad"
          style={[styles.input, { color: palette.text, borderColor: palette.line }]}
        />
      </View>

      <Pressable
        onPress={() => {
          const parsed = Math.max(1, Math.round(Number(target) || 1));
          const trimmed = name.trim();
          if (!trimmed) return;
          onSubmit({ name: trimmed, color, unit, target: parsed });
        }}
        style={[styles.submit, { backgroundColor: palette.ink }]}
      >
        <Text style={[styles.submitText, { color: palette.paper }]}>{submitLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 20 },
  field: { gap: 8 },
  label: { fontSize: 12, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  swatches: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  swatch: { width: 32, height: 32, borderRadius: 16 },
  swatchOn: { transform: [{ scale: 1.12 }] },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: { fontSize: 13, fontWeight: "600" },
  submit: {
    marginTop: 8,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitText: { fontSize: 16, fontWeight: "700" },
});
