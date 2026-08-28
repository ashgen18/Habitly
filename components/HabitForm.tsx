import { useState } from "react"
import { Pressable, ScrollView, Text, TextInput, View } from "react-native"
import { DEFAULT_DRAFT, type HabitDraft } from "@/src/domain/types.ts"
import type { FrequencyKind } from "@/src/domain/habit-logic.ts"
import { ICONS, PALETTE_LIST, PREMIUM_ICONS, type PaletteId } from "@/src/domain/palettes.ts"
import { todayISO } from "@/src/domain/dates.ts"
import { Body, Button, Muted, useTheme } from "@/components/ui"
import { useStore } from "@/src/lib/store"
import { PremiumFeature } from "@/src/domain/premium/entitlement.ts"

const FREQ: { id: FrequencyKind; label: string; premium?: boolean }[] = [
  { id: "daily", label: "Daily" },
  { id: "weekdays", label: "Selected days" },
  { id: "times_per_week", label: "Times per week" },
  { id: "every_n_days", label: "Every N days", premium: true },
  { id: "specific_dates", label: "Specific dates", premium: true },
  { id: "times_per_day", label: "Times per day", premium: true },
]

const DAYS = [
  { n: 1, label: "M" },
  { n: 2, label: "T" },
  { n: 3, label: "W" },
  { n: 4, label: "T" },
  { n: 5, label: "F" },
  { n: 6, label: "S" },
  { n: 0, label: "S" },
]

export function HabitForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<HabitDraft>
  onSave: (draft: HabitDraft) => string | null
  onCancel: () => void
}) {
  const theme = useTheme()
  const { canAccess } = useStore()
  const advanced = canAccess(PremiumFeature.advancedScheduling)
  const [draft, setDraft] = useState<HabitDraft>({
    ...DEFAULT_DRAFT,
    startDate: todayISO(),
    ...initial,
  })
  const [error, setError] = useState<string | null>(null)
  const icons = canAccess(PremiumFeature.advancedCustomization)
    ? [...ICONS, ...PREMIUM_ICONS]
    : ICONS

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40, gap: 16 }}>
      <TextInput
        value={draft.name}
        onChangeText={(name) => setDraft((d) => ({ ...d, name }))}
        placeholder="Habit name"
        placeholderTextColor={theme.muted}
        style={{
          color: theme.text,
          fontSize: 22,
          fontWeight: "600",
          borderBottomWidth: 1,
          borderColor: theme.line,
          paddingVertical: 8,
        }}
      />
      <Muted>Icon</Muted>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {icons.map((icon) => (
          <Pressable
            key={icon}
            onPress={() => setDraft((d) => ({ ...d, icon }))}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: draft.icon === icon ? theme.line : theme.card,
            }}
          >
            <Text style={{ fontSize: 18 }}>{icon}</Text>
          </Pressable>
        ))}
      </View>
      <Muted>Color</Muted>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {PALETTE_LIST.filter((p) => !p.pro || canAccess(PremiumFeature.advancedCustomization)).map(
          (p) => (
            <Pressable
              key={p.id}
              onPress={() => setDraft((d) => ({ ...d, palette: p.id as PaletteId }))}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: p.cell,
                borderWidth: draft.palette === p.id ? 3 : 0,
                borderColor: theme.text,
              }}
            />
          )
        )}
      </View>
      <Muted>Schedule</Muted>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {FREQ.filter((f) => !f.premium || advanced).map((f) => (
          <Pressable
            key={f.id}
            onPress={() => setDraft((d) => ({ ...d, frequency: f.id }))}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 14,
              backgroundColor: draft.frequency === f.id ? theme.tint : theme.card,
            }}
          >
            <Text style={{ color: draft.frequency === f.id ? "#FFFCF8" : theme.text }}>{f.label}</Text>
          </Pressable>
        ))}
      </View>
      {draft.frequency === "weekdays" ? (
        <View style={{ flexDirection: "row", gap: 6 }}>
          {DAYS.map((day) => {
            const on = draft.scheduledDays.includes(day.n)
            return (
              <Pressable
                key={day.n}
                onPress={() =>
                  setDraft((d) => ({
                    ...d,
                    scheduledDays: on
                      ? d.scheduledDays.filter((n) => n !== day.n)
                      : [...d.scheduledDays, day.n],
                  }))
                }
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: on ? theme.tint : theme.card,
                }}
              >
                <Text style={{ color: on ? "#FFFCF8" : theme.text }}>{day.label}</Text>
              </Pressable>
            )
          })}
        </View>
      ) : null}
      {draft.frequency === "times_per_week" ? (
        <View>
          <Muted>Times each week</Muted>
          <TextInput
            keyboardType="number-pad"
            value={String(draft.targetPerWeek)}
            onChangeText={(v) =>
              setDraft((d) => ({ ...d, targetPerWeek: Math.max(1, Math.min(7, Number(v) || 1)) }))
            }
            style={{ color: theme.text, fontSize: 18, marginTop: 6 }}
          />
        </View>
      ) : null}
      {draft.frequency === "every_n_days" ? (
        <View>
          <Muted>Every how many days</Muted>
          <TextInput
            keyboardType="number-pad"
            value={String(draft.everyNDays)}
            onChangeText={(v) =>
              setDraft((d) => ({ ...d, everyNDays: Math.max(1, Number(v) || 2) }))
            }
            style={{ color: theme.text, fontSize: 18, marginTop: 6 }}
          />
        </View>
      ) : null}
      {draft.frequency === "times_per_day" ? (
        <View>
          <Muted>Taps required each scheduled day</Muted>
          <TextInput
            keyboardType="number-pad"
            value={String(draft.timesPerDay)}
            onChangeText={(v) =>
              setDraft((d) => ({ ...d, timesPerDay: Math.max(1, Number(v) || 1)) }))
            }
            style={{ color: theme.text, fontSize: 18, marginTop: 6 }}
          />
        </View>
      ) : null}
      <TextInput
        value={draft.notes}
        onChangeText={(notes) => setDraft((d) => ({ ...d, notes }))}
        placeholder="Notes (optional)"
        placeholderTextColor={theme.muted}
        multiline
        style={{ color: theme.text, minHeight: 72, fontSize: 16 }}
      />
      {error ? <Body style={{ color: "#B42318" }}>{error}</Body> : null}
      <Button
        title="Save habit"
        onPress={() => {
          const next = onSave(draft)
          setError(next)
        }}
      />
      <Button title="Cancel" variant="ghost" onPress={onCancel} />
    </ScrollView>
  )
}
