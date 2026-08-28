import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  PREMIUM_FEATURES,
  formatPrice,
  type PremiumPlanId,
} from "@/src/domain/premium/catalog";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

export function Paywall({
  onUnlock,
}: {
  onUnlock: (plan: PremiumPlanId) => void;
}) {
  const scheme = useColorScheme() ?? "light";
  const palette = Colors[scheme];

  return (
    <View style={styles.wrap}>
      <Text style={[styles.kicker, { color: palette.muted }]}>Habitly Premium</Text>
      <Text style={[styles.title, { color: palette.text }]}>
        Track for free. Understand with Premium.
      </Text>
      <Text style={[styles.lede, { color: palette.muted }]}>
        Insights, routines, and consistency tools that help habits stick — without locking the tracker behind a paywall.
      </Text>

      <View style={styles.features}>
        {PREMIUM_FEATURES.map((feature) => (
          <View key={feature.id} style={styles.feature}>
            <Text style={[styles.featureName, { color: palette.text }]}>{feature.name}</Text>
            <Text style={[styles.featureBody, { color: palette.muted }]}>
              {feature.description}
            </Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={() => onUnlock("yearly")}
        style={[styles.cta, { backgroundColor: palette.ink }]}
      >
        <Text style={[styles.ctaTitle, { color: palette.paper }]}>Yearly · {formatPrice("yearly")}</Text>
        <Text style={[styles.ctaSub, { color: palette.paper }]}>Best value · 2 months free</Text>
      </Pressable>
      <Pressable
        onPress={() => onUnlock("monthly")}
        style={[styles.secondary, { borderColor: palette.line }]}
      >
        <Text style={[styles.secondaryText, { color: palette.text }]}>
          Monthly · {formatPrice("monthly")}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  kicker: { fontSize: 12, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
  title: { fontSize: 26, fontWeight: "700", letterSpacing: -0.4 },
  lede: { fontSize: 15, lineHeight: 22 },
  features: { gap: 12, marginTop: 8 },
  feature: { gap: 2 },
  featureName: { fontSize: 15, fontWeight: "700" },
  featureBody: { fontSize: 13, lineHeight: 18 },
  cta: { marginTop: 8, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  ctaTitle: { fontSize: 16, fontWeight: "700" },
  ctaSub: { fontSize: 12, marginTop: 2, opacity: 0.8 },
  secondary: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryText: { fontSize: 15, fontWeight: "600" },
});
