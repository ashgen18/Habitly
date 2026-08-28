import { Text, View } from "react-native"
import { useTheme } from "@/components/ui"

export function ProgressRing({ done, total }: { done: number; total: number }) {
  const theme = useTheme()
  const pct = total === 0 ? 0 : done / total
  return (
    <View style={{ marginVertical: 24 }}>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
        <Text style={{ color: theme.text, fontSize: 32, fontWeight: "600" }}>{done}</Text>
        <Text style={{ color: theme.muted, fontSize: 18 }}>/ {total}</Text>
      </View>
      <View
        style={{
          height: 10,
          backgroundColor: theme.line,
          borderRadius: 8,
          marginTop: 10,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${Math.round(pct * 100)}%`,
            height: 10,
            backgroundColor: theme.tint,
          }}
        />
      </View>
      <Text style={{ color: theme.muted, fontSize: 14, marginTop: 8 }}>
        {total === 0 ? "Nothing due today" : done === total ? "Today is complete" : "completed today"}
      </Text>
    </View>
  )
}
