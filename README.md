# Habitly

A habit tracker for iOS, Android, and web.

**Free** tracks habits. **Premium** helps you understand them, build routines, and stay consistent.

- Frontend: React Native (Expo)
- Backend: Supabase (optional — the app runs fully on-device without keys)
- AI layer: Cursor-owned prompts in `ai/prompts`, optional Supabase Edge Function `habit-insights`

## Run it

```bash
npm install
npm run check
npm run web
```

`npm install` also writes app icons under `assets/images` from `scripts/encoded-assets.json`. GitHub's file API in this publish path cannot take PNG/TTF bytes, so the icons ship as base64 and unpack locally.

Web preview: [http://127.0.0.1:43123](http://127.0.0.1:43123)

On a Mac:

```bash
npm run ios
```

On a device with Expo Go:

```bash
npx expo start
```

First launch starts with an empty board. In a development build, **You → Load demo board** can load sample habits.

## Supabase (optional)

Without env vars, habits stay on this device via AsyncStorage. Existing boards under `tessera.v1` / `tessera.v2` still migrate into `tessera.v3`.

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/migrations/001_habitly.sql` in the SQL editor
3. Copy `.env.example` to `.env` and set:

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Enable Email auth. Sign in from **You**. The board syncs last-write-wins by `updatedAt` and never drops a habit that only exists locally.

## AI layer (Cursor)

The insights prompt lives at `ai/prompts/habit-insights.md` so you can iterate it in Cursor without shipping a fake model.

Runtime (`src/ai/insights.ts`):

1. If Premium is off, show the upgrade screen
2. Call the `habit-insights` Edge Function when Supabase is configured
3. If there is no model key, or the function is missing, use the local rule-based `generateInsights`

The UI never claims an external AI wrote the copy unless the function returns `source: "model"`.

Deploy the function with `supabase functions deploy habit-insights` and set `OPENAI_API_KEY` (and optionally `HABITLY_INSIGHTS_PROMPT`) in the function secrets.

## Premium

Gated through `PremiumEntitlementManager`. Access comes from RevenueCat CustomerInfo or the `entitlements` table (RevenueCat webhook). Habit board JSON is never proof of Premium.

Product IDs (attach these to a RevenueCat entitlement named `premium`):

- `habitly_premium_monthly`
- `habitly_premium_annual`
- `habitly_premium_lifetime`

Public SDK keys go in `.env` as `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` and `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`. Expo Go and web cannot complete App Store purchases; use an EAS development build.

Webhook: deploy `supabase/functions/revenuecat-webhook`, run `supabase/migrations/002_entitlements.sql`, and set function secret `REVENUECAT_WEBHOOK_AUTH` to the same `Authorization` header value configured in the RevenueCat dashboard. `Purchases.logIn` uses the Supabase user id so the webhook can write that row.

## App Store

This repo is the React Native app. Ship with [EAS Build](https://docs.expo.dev/build/setup/) from a machine with an Apple Developer account. Linux cannot produce an `.ipa`. `eas.json` has development / preview / production profiles.

## Tests

`npm run check` covers Free habit logic plus Premium analytics, goals, stacks, entitlements, schedules, achievements, and migration.
