import { useRouter } from "expo-router"
import { View } from "react-native"
import { HabitForm } from "@/components/HabitForm"
import { Screen } from "@/components/ui"
import { useStore } from "@/src/lib/store"

export default function NewHabitScreen() {
  const router = useRouter()
  const { addHabit } = useStore()
  return (
    <Screen>
      <View style={{ padding: 20, flex: 1 }}>
        <HabitForm
          onSave={(draft) => {
            const error = addHabit(draft)
            if (!error) router.back()
            return error
          }}
          onCancel={() => router.back()}
        />
      </View>
    </Screen>
  )
}
