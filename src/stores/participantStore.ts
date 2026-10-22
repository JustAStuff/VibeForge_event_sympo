import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type {
  Participant,
  Session,
  Challenge,
  ParticipantSurpriseTask,
  RecoveryRequest,
} from '@/types'
import { calcRemainingSeconds } from '@/lib/utils'

/**
 * Difference between the server clock and this browser's clock.
 * Used for display only — the deadline itself is enforced by Postgres.
 */
let serverOffsetMs = 0

function remainingFor(session: Session | null): number {
  if (!session?.deadline_at) return 0
  const base = calcRemainingSeconds(session.deadline_at, serverOffsetMs)
  if (session.session_status === 'paused' && session.paused_at) {
    return base + Math.floor(((Date.now() + serverOffsetMs) - new Date(session.paused_at).getTime()) / 1000)
  }
  return base
}

interface ParticipantState {
  participant: Participant | null
  session: Session | null
  challenge: Challenge | null
  surpriseTask: ParticipantSurpriseTask | null
  pendingRecovery: RecoveryRequest | null
  remainingSeconds: number
  loading: boolean
  error: string | null

  setParticipant: (p: Participant | null) => void
  setSession: (s: Session | null) => void
  setChallenge: (c: Challenge | null) => void
  setSurpriseTask: (t: ParticipantSurpriseTask | null) => void
  setPendingRecovery: (r: RecoveryRequest | null) => void

  loadParticipantData: (authUserId: string) => Promise<void>
  tickTimer: () => void
  reset: () => void
}

export const useParticipantStore = create<ParticipantState>((set, get) => ({
  participant: null,
  session: null,
  challenge: null,
  surpriseTask: null,
  pendingRecovery: null,
  remainingSeconds: 0,
  loading: false,
  error: null,

  setParticipant: (participant) => set({ participant }),
  setSession: (session) => {
    set({ session, remainingSeconds: remainingFor(session) })
  },
  setChallenge: (challenge) => set({ challenge }),
  setSurpriseTask: (surpriseTask) => set({ surpriseTask }),
  setPendingRecovery: (pendingRecovery) => set({ pendingRecovery }),

  loadParticipantData: async (authUserId: string) => {
    set({ loading: true, error: null })
    try {
      // Align the countdown with the server clock (display only).
      const { data: serverTs } = await supabase.rpc('server_now')
      if (serverTs) {
        serverOffsetMs = new Date(serverTs as string).getTime() - Date.now()
      }

      // Find participant linked to this auth user
      const { data: identity, error: idErr } = await supabase
        .from('participant_identities')
        .select('participant_id')
        .eq('auth_user_id', authUserId)
        .eq('is_active', true)
        .maybeSingle()

      if (idErr) throw idErr
      if (!identity) {
        set({ loading: false, participant: null })
        return
      }

      const { data: participant, error: pErr } = await supabase
        .from('participants')
        .select('*')
        .eq('id', identity.participant_id)
        .single()

      if (pErr) throw pErr
      set({ participant })

      // Load session
      const { data: session, error: sErr } = await supabase
        .from('sessions')
        .select('*')
        .eq('participant_id', participant.id)
        .not('session_status', 'eq', 'cancelled')
        .maybeSingle()

      if (sErr) throw sErr
      if (!session) {
        set({ session: null, loading: false })
        return
      }

      set({
        session,
        remainingSeconds: remainingFor(session),
      })

      // Load challenge
      if (session.challenge_id) {
        const { data: challenge } = await supabase
          .from('challenges')
          .select('*')
          .eq('id', session.challenge_id)
          .single()
        set({ challenge: challenge || null })
      }

      // Load ONLY published surprise task (CRITICAL: no draft access).
      // The status filter is defence-in-depth only — the authoritative guard is
      // the RLS policy on surprise_tasks, which makes draft rows unreadable to
      // participants at the database level.
      const { data: task } = await supabase
        .from('surprise_tasks')
        .select('id, session_id, participant_id, title, instructions, status, published_at, acknowledged_at, completed_at, created_at, updated_at')
        .eq('session_id', session.id)
        .in('status', ['published', 'acknowledged', 'completed'])
        .maybeSingle()

      set({ surpriseTask: task || null })

      // Load pending recovery request for this auth user
      const { data: recovery } = await supabase
        .from('recovery_requests')
        .select('*')
        .eq('requesting_auth_user_id', authUserId)
        .eq('status', 'pending')
        .maybeSingle()

      set({ pendingRecovery: recovery || null })

    } catch (err) {
      set({ error: (err as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  tickTimer: () => {
    const { session } = get()
    if (!session?.deadline_at || session.session_status === 'paused') return
    set({ remainingSeconds: remainingFor(session) })
  },

  reset: () => set({
    participant: null,
    session: null,
    challenge: null,
    surpriseTask: null,
    pendingRecovery: null,
    remainingSeconds: 0,
    loading: false,
    error: null,
  }),
}))
