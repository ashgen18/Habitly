import type { AppState } from "@/src/domain/types.ts"
import { todayISO } from "@/src/domain/dates.ts"
import { nextReminderDate } from "@/src/domain/habit-logic.ts"
import { completedSet } from "@/src/domain/seed.ts"

const timers = new Map<string, ReturnType<typeof setTimeout>>()

function clearAll() {
  for (const id of timers.values()) clearTimeout(id)
  timers.clear()
}

function canNotify() {
  return typeof Notification !== "undefined"
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (!canNotify()) return "unsupported"
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<
  NotificationPermission | "unsupported"
> {
  if (!canNotify()) return "unsupported"
  try {
    return await Notification.requestPermission()
  } catch {
    return "denied"
  }
}

function arm(key: string, when: Date, now: Date, title: string, body: string) {
  const delay = when.getTime() - now.getTime()
  if (delay <= 0 || delay > 36 * 60 * 60 * 1000) return
  const timer = setTimeout(() => {
    try {
      new Notification(title, { body, tag: key })
    } catch {
      // Permission revoked mid-session.
    }
  }, delay)
  timers.set(key, timer)
}

export function syncReminders(state: AppState): () => void {
  clearAll()
  if (!canNotify() || Notification.permission !== "granted") return () => undefined

  const now = new Date()
  const today = todayISO(now)
  for (const habit of state.habits) {
    if (habit.archivedAt || !habit.reminderEnabled) continue
    const title = habit.reminderMessage?.trim() || `Time for ${habit.icon} ${habit.name}`
    const body = habit.notes || "A small check-in is enough."
    const primary = nextReminderDate(habit.reminderTime, now)
    if (primary) arm(`habitly-${habit.id}`, primary, now, title, body)

    const extras = (habit.extraReminders ?? []).slice(0, 3)
    const doneToday = completedSet(state, habit.id).has(today)
    extras.forEach((extra, i) => {
      if (extra.kind === "followup" && doneToday) return
      const when = nextReminderDate(extra.time, now)
      if (!when) return
      const extraTitle =
        extra.message?.trim() ||
        (extra.kind === "followup" ? `You haven't completed ${habit.name} today.` : title)
      arm(`habitly-${habit.id}-x${i}`, when, now, extraTitle, body)
    })
  }

  return () => clearAll()
}
