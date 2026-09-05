import { FEATURE_COPY, type PremiumFeature } from "@/src/domain/premium/entitlement.ts"
import { Body, Card, Heading, Muted } from "@/components/ui"

export function Paywall({ feature }: { feature: PremiumFeature }) {
  const copy = FEATURE_COPY[feature]
  return (
    <Card>
      <Muted>Premium</Muted>
      <Heading style={{ fontSize: 22, marginTop: 4 }}>{copy.title}</Heading>
      <Body style={{ marginTop: 8 }}>{copy.benefit}</Body>
      {copy.perks.map((perk) => (
        <Muted key={perk} style={{ marginTop: 8 }}>
          · {perk}
        </Muted>
      ))}
      <Muted style={{ marginTop: 16 }}>
        Premium isn’t available to purchase in this version.
      </Muted>
    </Card>
  )
}
