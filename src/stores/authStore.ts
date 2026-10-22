import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  isAdmin: boolean
  loading: boolean
  initialized: boolean
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  signInAnonymously: () => Promise<{ error: Error | null }>
  signInAdmin: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

// Admin check by querying the participants check — admin emails stored in Supabase metadata
function checkIsAdmin(user: User | null): boolean {
  if (!user) return false
  const meta = user.user_metadata || {}
  const appMeta = user.app_metadata || {}
  return (
    meta.role === 'admin' ||
    appMeta.role === 'admin' ||
    appMeta.claims_admin === true
  )
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isAdmin: false,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user, isAdmin: checkIsAdmin(user) }),
  setSession: (session) => set({ session }),

  signInAnonymously: async () => {
    try {
      const { data, error } = await supabase.auth.signInAnonymously()
      if (error) return { error: new Error(error.message) }
      set({ user: data.user, session: data.session, isAdmin: false })
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  },

  signInAdmin: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error: new Error(error.message) }
      const isAdmin = checkIsAdmin(data.user)
      set({ user: data.user, session: data.session, isAdmin })
      if (!isAdmin) {
        await supabase.auth.signOut()
        return { error: new Error('This account does not have administrator access.') }
      }
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null, isAdmin: false })
  },

  initialize: async () => {
    const { data } = await supabase.auth.getSession()
    set({
      user: data.session?.user ?? null,
      session: data.session,
      isAdmin: checkIsAdmin(data.session?.user ?? null),
      loading: false,
      initialized: true,
    })

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        user: session?.user ?? null,
        session,
        isAdmin: checkIsAdmin(session?.user ?? null),
      })
    })
  },
}))
