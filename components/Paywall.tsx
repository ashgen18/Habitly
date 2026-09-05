import { FEATURE_COPY, type PremiumFeature } from "@/src/domain/premium/entitlement.ts"
import { Body, Button, Card, Heading, Muted } from "@/components/ui"
import { useStore } from "@/src/lib/store"

export function Paywall({ feature }: { feature: PremiumFeature }) {
  const copy = FEATURE_COPY[feature]
  const { purchasesReady, offerings, purchase, restorePurchases, purchaseBusy, purchaseError } =
    useStore()

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
      {purchasesReady && offerings.length > 0 ? (
        <>
          {offerings.map((plan) => (
            <Button
              key={plan.productId}
              title={`${plan.title} · ${plan.priceString}`}
              disabled={purchaseBusy}
              style={{ marginTop: 12 }}
              onPress={() => void purchase(plan.productId)}
            />
          ))}
          <Button
            title="Restore purchases"
            variant="ghost"
            disabled={purchaseBusy}
            style={{ marginTop: 8 }}
            onPress={() => void restorePurchases()}
          />
        </>
      ) : (
        <Muted style={{ marginTop: 16 }}>
          Premium isn’t available to purchase on this device. Buy or restore on iPhone or Android.
        </Muted>
      )}
      {purchaseError ? <Muted style={{ marginTop: 8 }}>{purchaseError}</Muted> : null}
    </Card>
  )
}
