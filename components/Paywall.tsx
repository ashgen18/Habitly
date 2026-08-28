import { FEATURE_COPY, type PremiumFeature } from "@/src/domain/premium/entitlement.ts"
import { STORE_PRODUCTS } from "@/src/domain/premium/entitlement.ts"
import { Body, Button, Card, Heading, Muted } from "@/components/ui"

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
        StoreKit is not connected in this build. Product IDs are {STORE_PRODUCTS.monthly.id},{" "}
        {STORE_PRODUCTS.annual.id}, and {STORE_PRODUCTS.lifetime.id}. Prices come from the store,
        never from this app.
      </Muted>
      <Button title="Restore purchases" variant="ghost" style={{ marginTop: 12 }} onPress={() => undefined} />
    </Card>
  )
}
