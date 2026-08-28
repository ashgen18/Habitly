import { useEffect, useState } from "react"
import { Text, View } from "react-native"
import {
  currentOpeningQuote,
  hydrateOpeningQuote,
  subscribeOpeningQuote,
  type HabitQuote,
} from "@/src/domain/quotes.ts"
import { Card, useTheme } from "@/components/ui"

export function QuoteCard() {
  const theme = useTheme()
  const [quote, setQuote] = useState<HabitQuote | null>(currentOpeningQuote)

  useEffect(() => {
    const unsub = subscribeOpeningQuote(() => setQuote(currentOpeningQuote()))
    void hydrateOpeningQuote().then(setQuote)
    return unsub
  }, [])

  if (!quote) return null
  return (
    <Card style={{ marginTop: 16 }}>
      <Text style={{ color: theme.text, fontSize: 15, lineHeight: 22 }}>“{quote.text}”</Text>
      {quote.by ? (
        <Text style={{ color: theme.muted, fontSize: 12, marginTop: 6 }}>— {quote.by}</Text>
      ) : null}
    </Card>
  )
}
