import { useState } from "react"
import { Pressable, ScrollView, Text, TextInput, View } from "react-native"
import { PremiumFeature, STORE_PRODUCTS } from "@/src/domain/premium/entitlement.ts"
import { TEMPLATES } from "@/src/domain/premium/achievements.ts"
import { ACHIEVEMENTS } from "@/src/domain/premium/achievements.ts"
import { useStore } from "@/src/lib/store"
import { useAuth } from "@/src/lib/auth"
import { Body, Button, Card, Heading, Muted, Screen, useTheme } from "@/components/ui"
import { Paywall } from "@/components/Paywall"

export default function YouScreen() {
  const theme = useTheme()
  const store = useStore()
  const auth = useAuth()
  const { state, updateSettings, setSimulatedPremium, persistError, syncMessage, hydrated } = store
  const premium = store.canAccess(PremiumFeature.habitTemplates)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [authError, setAuthError] = useState<string | null>(null)
  const simulated = state.entitlement.source === "simulated"

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 12 }}>
        <Heading>You</Heading>
        {!hydrated ? <Muted>Loading your board…</Muted> : null}

        <Card>
          <Muted>Display name</Muted>
          <TextInput
            value={state.settings.displayName}
            onChangeText={(displayName) => updateSettings({ displayName })}
            placeholder="Optional"
            placeholderTextColor={theme.muted}
            style={{ color: theme.text, fontSize: 18, marginTop: 6 }}
          />
        </Card>

        <Card>
          <Muted>Week starts on</Muted>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
            {([1, 0] as const).map((n) => (
              <Pressable
                key={n}
                onPress={() => updateSettings({ weekStartsOn: n })}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 14,
                  backgroundColor: state.settings.weekStartsOn === n ? theme.tint : theme.background,
                }}
              >
                <Text style={{ color: state.settings.weekStartsOn === n ? "#FFFCF8" : theme.text }}>
                  {n === 1 ? "Monday" : "Sunday"}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card>
          <Muted>Appearance</Muted>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            {(["system", "light", "dark"] as const).map((appearance) => (
              <Pressable
                key={appearance}
                onPress={() => updateSettings({ appearance })}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 14,
                  backgroundColor: state.settings.appearance === appearance ? theme.tint : theme.background,
                }}
              >
                <Text style={{ color: state.settings.appearance === appearance ? "#FFFCF8" : theme.text }}>
                  {appearance}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card>
          <Heading style={{ fontSize: 18 }}>Account</Heading>
          {!auth.configured ? (
            <Muted style={{ marginTop: 8 }}>
              Supabase is not configured. Habits stay on this device. Add EXPO_PUBLIC_SUPABASE_URL and
              EXPO_PUBLIC_SUPABASE_ANON_KEY to sync across phones.
            </Muted>
          ) : auth.user ? (
            <>
              <Body style={{ marginTop: 8 }}>{auth.user.email}</Body>
              {syncMessage ? <Muted style={{ marginTop: 6 }}>{syncMessage}</Muted> : null}
              <Button title="Sign out" variant="ghost" style={{ marginTop: 12 }} onPress={() => void auth.signOut()} />
            </>
          ) : (
            <>
              <Muted style={{ marginTop: 8 }}>Sign in to keep the same board on every device.</Muted>
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={theme.muted}
                style={{ color: theme.text, marginTop: 12, fontSize: 16 }}
              />
              <TextInput
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={theme.muted}
                style={{ color: theme.text, marginTop: 8, fontSize: 16 }}
              />
              {authError ? <Body style={{ color: "#B42318", marginTop: 8 }}>{authError}</Body> : null}
              <Button
                title="Sign in"
                style={{ marginTop: 12 }}
                onPress={async () => setAuthError(await auth.signIn(email, password))}
              />
              <Button
                title="Create account"
                variant="ghost"
                style={{ marginTop: 8 }}
                onPress={async () => setAuthError(await auth.signUp(email, password))}
              />
            </>
          )}
        </Card>

        <Card>
          <Heading style={{ fontSize: 18 }}>Premium</Heading>
          <Muted style={{ marginTop: 8 }}>
            Status: {store.entitlement.status}
            {simulated ? " (device preview)" : ""}
          </Muted>
          <Muted style={{ marginTop: 6 }}>
            Products {STORE_PRODUCTS.monthly.id}, {STORE_PRODUCTS.annual.id}, {STORE_PRODUCTS.lifetime.id}.
            StoreKit is not connected yet.
          </Muted>
        </Card>

        {premium ? (
          <>
            <Heading style={{ fontSize: 20, marginTop: 8 }}>Templates</Heading>
            {TEMPLATES.map((t) => (
              <Card key={t.id}>
                <Body>{t.name}</Body>
                <Muted style={{ marginTop: 4 }}>{t.blurb}</Muted>
                <Button
                  title="Install"
                  variant="ghost"
                  style={{ marginTop: 10 }}
                  onPress={() => store.installTemplate(t.id)}
                />
              </Card>
            ))}
            <Heading style={{ fontSize: 20, marginTop: 8 }}>Achievements</Heading>
            {ACHIEVEMENTS.map((a) => {
              const got = state.achievements.some((u) => u.id === a.id)
              return (
                <Card key={a.id} style={{ opacity: got ? 1 : 0.55 }}>
                  <Body>{got ? "● " : "○ "}{a.name}</Body>
                  <Muted style={{ marginTop: 4 }}>{a.description}</Muted>
                </Card>
              )
            })}
          </>
        ) : (
          <Paywall feature={PremiumFeature.habitTemplates} />
        )}

        <Card>
          <Heading style={{ fontSize: 18 }}>Device preview</Heading>
          <Muted style={{ marginTop: 8 }}>
            Turns Premium on for this device only. Not a store purchase. Hide this before App Store
            review.
          </Muted>
          <Button
            title={simulated ? "Turn off device preview" : "Preview Premium on this device"}
            variant="ghost"
            style={{ marginTop: 12 }}
            onPress={() => setSimulatedPremium(!simulated)}
          />
        </Card>

        <Card>
          <Button title="Load demo board" variant="ghost" onPress={store.loadDemo} />
          <Button title="Start with an empty board" variant="ghost" style={{ marginTop: 8 }} onPress={store.resetEmpty} />
        </Card>
        {persistError ? <Muted>{persistError}</Muted> : null}
      </ScrollView>
    </Screen>
  )
}
