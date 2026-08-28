import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabase, supabaseConfigured } from "@/src/lib/supabase.ts"

type Auth = {
  configured: boolean
  session: Session | null
  user: User | null
  ready: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<Auth | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(!supabaseConfigured)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setReady(true)
      return
    }
    let alive = true
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return
      setSession(data.session ?? null)
      setReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })
    return () => {
      alive = false
      data.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return "Supabase is not configured. Habits stay on this device."
    setError(null)
    const { error: next } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (next) {
      setError(next.message)
      return next.message
    }
    return null
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) return "Supabase is not configured. Habits stay on this device."
    setError(null)
    const { error: next } = await supabase.auth.signUp({ email: email.trim(), password })
    if (next) {
      setError(next.message)
      return next.message
    }
    return null
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }, [])

  const value = useMemo<Auth>(
    () => ({
      configured: supabaseConfigured,
      session,
      user: session?.user ?? null,
      ready,
      error,
      signIn,
      signUp,
      signOut,
    }),
    [error, ready, session, signIn, signOut, signUp]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
