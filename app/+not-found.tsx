import { Link, Stack } from "expo-router"
import { StyleSheet } from "react-native"
import { Body, Button, Heading, Screen } from "@/components/ui"

export default function NotFoundScreen() {
  return (
    <Screen style={styles.container}>
      <Stack.Screen options={{ title: "Missing" }} />
      <Heading>This screen does not exist.</Heading>
      <Link href="/" asChild>
        <Button title="Back to Today" style={{ marginTop: 16 }} />
      </Link>
      <Body style={{ marginTop: 12 }}>If a habit link broke, it was deleted from this board.</Body>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
})
