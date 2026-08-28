import { useFonts } from "expo-font"
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { useEffect } from "react"
import { useColorScheme as useSystemColorScheme } from "react-native"
import "react-native-reanimated"

import { AuthProvider } from "@/src/lib/auth"
import { StoreProvider, useStore } from "@/src/lib/store"

export { ErrorBoundary } from "expo-router"

export const unstable_settings = {
  initialRouteName: "(tabs)",
}

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  })

  useEffect(() => {
    if (error) throw error
  }, [error])

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync()
  }, [loaded])

  if (!loaded) return null
  return (
    <AuthProvider>
      <StoreProvider>
        <ThemedStack />
      </StoreProvider>
    </AuthProvider>
  )
}

function ThemedStack() {
  const system = useSystemColorScheme()
  const appearance = useStore().state.settings.appearance
  const scheme = appearance === "system" ? (system === "dark" ? "dark" : "light") : appearance
  return (
    <ThemeProvider value={scheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="habit/[id]" options={{ title: "Habit" }} />
        <Stack.Screen name="habit/new" options={{ title: "New habit", presentation: "modal" }} />
      </Stack>
    </ThemeProvider>
  )
}
