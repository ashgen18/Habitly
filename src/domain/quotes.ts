import AsyncStorage from "@react-native-async-storage/async-storage"

export type HabitQuote = {
  id: string
  text: string
  by?: string
}

export const HABIT_QUOTES: HabitQuote[] = [
  { id: "repeatedly", text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", by: "Will Durant" },
  { id: "keeps-going", text: "Motivation is what gets you started. Habit is what keeps you going.", by: "Jim Ryun" },
  { id: "daily-routine", text: "The secret of your future is hidden in your daily routine.", by: "Mike Murdock" },
  { id: "sow-habit", text: "Sow a habit and you reap a character; sow a character and you reap a destiny.", by: "Charles Reade" },
  { id: "chains", text: "Habits are first cobwebs, then cables.", by: "Spanish proverb" },
  { id: "tiny", text: "You do not rise to the level of your goals. You fall to the level of your systems.", by: "James Clear" },
  { id: "one-percent", text: "Small disciplines, done consistently, outrun big intentions." },
  { id: "show-up", text: "The habit is not the workout. The habit is showing up." },
  { id: "quiet", text: "Consistency is quieter than motivation, and it lasts longer." },
  { id: "today", text: "A streak is just today, decided again." },
  { id: "miss", text: "Missing once is an accident. Missing twice is the start of a new habit." },
  { id: "identity", text: "Every check-in is a vote for the person you are becoming." },
  { id: "boring", text: "The most powerful habits look boring from the outside." },
  { id: "start-small", text: "Make it so small you cannot talk yourself out of it." },
  { id: "environment", text: "You do not need more willpower. You need a kinder path of least resistance." },
  { id: "compound", text: "Nothing compounds like a day you almost skipped, and didn’t." },
]

const LAST_KEY = "tessera.lastQuote"

let sessionQuote: HabitQuote | null = null
let sessionReady = false
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function subscribeOpeningQuote(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function currentOpeningQuote(): HabitQuote | null {
  return sessionQuote
}

export async function hydrateOpeningQuote(): Promise<HabitQuote> {
  if (sessionQuote) return sessionQuote
  const fallback = HABIT_QUOTES[0] as HabitQuote
  try {
    const last = await AsyncStorage.getItem(LAST_KEY)
    const pool = HABIT_QUOTES.filter((q) => q.id !== last)
    const pick = pool[Math.floor(Math.random() * pool.length)] ?? fallback
    sessionQuote = pick
    sessionReady = true
    await AsyncStorage.setItem(LAST_KEY, pick.id)
    emit()
    return pick
  } catch {
    sessionQuote = fallback
    sessionReady = true
    emit()
    return fallback
  }
}

export function pickOpeningQuote(): HabitQuote {
  if (sessionQuote) return sessionQuote
  return HABIT_QUOTES[0] as HabitQuote
}

void sessionReady
