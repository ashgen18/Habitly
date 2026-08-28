import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type TextProps,
  type ViewProps,
} from "react-native"
import Colors from "@/constants/Colors"
import { useColorScheme } from "@/components/useColorScheme"

export function useTheme() {
  const scheme = useColorScheme()
  return Colors[scheme]
}

export function Screen({ style, ...props }: ViewProps) {
  const theme = useTheme()
  return <View style={[{ flex: 1, backgroundColor: theme.background }, style]} {...props} />
}

export function Card({ style, ...props }: ViewProps) {
  const theme = useTheme()
  return (
    <View
      style={[
        {
          backgroundColor: theme.card,
          borderRadius: 20,
          padding: 16,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.line,
        },
        style,
      ]}
      {...props}
    />
  )
}

export function Heading({ style, ...props }: TextProps) {
  const theme = useTheme()
  return (
    <Text
      style={[{ color: theme.text, fontSize: 26, fontWeight: "600", letterSpacing: -0.4 }, style]}
      {...props}
    />
  )
}

export function Body({ style, ...props }: TextProps) {
  const theme = useTheme()
  return <Text style={[{ color: theme.text, fontSize: 16, lineHeight: 22 }, style]} {...props} />
}

export function Muted({ style, ...props }: TextProps) {
  const theme = useTheme()
  return <Text style={[{ color: theme.muted, fontSize: 14, lineHeight: 20 }, style]} {...props} />
}

type ButtonProps = PressableProps & {
  title: string
  variant?: "primary" | "ghost" | "danger"
}

export function Button({ title, variant = "primary", style, disabled, ...props }: ButtonProps) {
  const theme = useTheme()
  const bg =
    variant === "primary" ? theme.tint : variant === "danger" ? "#B42318" : "transparent"
  const color = variant === "ghost" ? theme.tint : "#FFFCF8"
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
          borderRadius: 16,
          paddingVertical: 12,
          paddingHorizontal: 16,
          alignItems: "center",
          borderWidth: variant === "ghost" ? 1 : 0,
          borderColor: theme.line,
        },
        style,
      ]}
      {...props}
    >
      <Text style={{ color, fontWeight: "600", fontSize: 16 }}>{title}</Text>
    </Pressable>
  )
}
