import { StyleSheet, Text, View } from "react-native";
import { quoteForDate } from "@/src/domain/quotes";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

export function QuoteCard({ dateKey }: { dateKey: string }) {
  const scheme = useColorScheme() ?? "light";
  const palette = Colors[scheme];
  const quote = quoteForDate(dateKey);

  return (
    <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.line }]}>
      <Text style={[styles.kicker, { color: palette.muted }]}>Today</Text>
      <Text style={[styles.body, { color: palette.text }]}>“{quote.text}”</Text>
      <Text style={[styles.by, { color: palette.muted }]}>— {quote.by}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  kicker: { fontSize: 11, fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase" },
  body: { fontSize: 16, lineHeight: 24, fontStyle: "italic" },
  by: { fontSize: 13 },
});
