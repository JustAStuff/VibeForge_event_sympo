import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Alert, ConfirmDialog } from '@/components/ui/Dialog'
import { Page, BrandMark } from '@/components/shared/Page'
import { ChallengeIcon, challengeAccent } from '@/components/shared/ChallengeIcon'
import { CHALLENGES } from '@/data/challenges'
import { Check, Clock, Lock, Sparkles } from 'lucide-react'

export function ChallengeSelectPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<number | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [participantName, setParticipantName] = useState<string>('')

  useEffect(() => {
    async function getParticipant() {
      if (!user) { navigate('/register'); return }
      const { data: identity } = await supabase
        .from('participant_identities')
        .select('participant_id')
        .eq('auth_user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()
      if (!identity) { navigate('/register'); return }
      setParticipantId(identity.participant_id)

      const { data: p } = await supabase
        .from('participants')
        .select('full_name')
        .eq('id', identity.participant_id)
        .maybeSingle()
      if (p) setParticipantName(p.full_name)

      const { data: sess } = await supabase
        .from('sessions')
        .select('session_status')
        .eq('participant_id', identity.participant_id)
        .in('session_status', ['active', 'paused'])
        .maybeSingle()
      if (sess) navigate('/session')
    }
    getParticipant()
  }, [user, navigate])

  const handleConfirm = async () => {
    if (!selected || !participantId) { setError('Missing participant information. Please reload.'); return }
    setError('')
    setLoading(true)

    try {
      // Server-authoritative: the backend sets started_at, deadline_at and the
      // milestone schedule. The client cannot influence the clock.
      const { error: sErr } = await supabase.rpc('start_session', {
        p_challenge_number: selected,
      })

      if (sErr) throw new Error(sErr.message)

      navigate('/session')
    } catch (err) {
      setError((err as Error).message)
      setLoading(false)
      setConfirmOpen(false)
    }
  }

  const challenge = selected ? CHALLENGES.find((c) => c.number === selected) : null

  return (
    <Page>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <BrandMark />
        <div className="flex items-center gap-3 text-xs text-vf-text-muted">
          {participantName && (
            <span className="hidden rounded-full border border-vf-border bg-vf-surface/60 px-3 py-1.5 font-medium text-vf-text-2 sm:inline">
              {participantName}
            </span>
          )}
          <span className="rounded-full border border-vf-violet/30 bg-vf-violet/10 px-3 py-1.5 font-bold uppercase tracking-wider text-vf-violet-light">
            Step 2 of 3
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-32 pt-4">
        <div className="max-w-2xl">
          <h1 className="text-balance text-3xl font-black tracking-tight text-vf-text sm:text-4xl">
            Pick your challenge
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-vf-text-2">
            You get one shot at one challenge. The full brief and requirements unlock the moment you
            start your session.
          </p>
        </div>

        {error && <Alert type="error" className="mt-6 max-w-2xl">{error}</Alert>}

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CHALLENGES.map((c) => {
            const a = challengeAccent(c.number)
            const isSelected = selected === c.number
            return (
              <button
                key={c.number}
                type="button"
                onClick={() => setSelected(c.number)}
                aria-pressed={isSelected}
                className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-vf-violet ${
                  isSelected
                    ? `border-transparent bg-vf-surface-2 ring-2 ${a.ring} ${a.glow}`
                    : 'border-vf-border bg-vf-surface/60 hover:-translate-y-0.5 hover:border-vf-border-2 hover:bg-vf-surface'
                }`}
              >
                <div className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${a.from} ${a.to} blur-2xl transition-opacity ${isSelected ? 'opacity-30' : 'opacity-[0.10] group-hover:opacity-20'}`} />

                <div className="relative flex items-start gap-4">
                  <ChallengeIcon number={c.number} />
                  <div className="min-w-0 flex-1">
                    <div className={`mb-1 text-[11px] font-bold uppercase tracking-[0.16em] ${a.text}`}>
                      Challenge {c.number}
                    </div>
                    <h2 className="text-[15px] font-semibold leading-snug text-vf-text">{c.title}</h2>
                  </div>
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all ${
                      isSelected
                        ? 'border-transparent bg-vf-violet text-white'
                        : 'border-vf-border-2 text-transparent group-hover:border-vf-text-muted'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-8 flex items-start gap-2 text-xs text-vf-text-muted">
          <Lock className="mt-px h-3.5 w-3.5 shrink-0" />
          Challenge details stay hidden until your session starts, so everyone begins from the same page.
        </div>
      </main>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-vf-border bg-vf-bg/85 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div className="min-w-0">
            {challenge ? (
              <>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-vf-text-muted">
                  Selected
                </p>
                <p className="truncate text-sm font-semibold text-vf-text">
                  {challenge.number}. {challenge.title}
                </p>
              </>
            ) : (
              <p className="flex items-center gap-2 text-sm text-vf-text-muted">
                <Sparkles className="h-4 w-4" />
                Select a challenge to continue
              </p>
            )}
          </div>
          <Button
            size="lg"
            disabled={!selected || loading}
            onClick={() => setConfirmOpen(true)}
            className="shrink-0"
          >
            <Clock className="h-4 w-4" />
            {loading ? 'Starting…' : 'Start 45-min session'}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        title="Start your session?"
        message={
          <div className="space-y-3">
            <p>You are about to start your 45-minute session with:</p>
            <p className={`rounded-lg border border-vf-border bg-vf-surface-2 px-3 py-2 font-semibold ${getAccentText(selected)}`}>
              Challenge {challenge?.number}: {challenge?.title}
            </p>
            <p className="text-vf-warning">
              The timer starts immediately. You cannot pause it yourself, and it cannot be restarted
              once it ends.
            </p>
          </div>
        }
        confirmLabel="Start (45 min)"
        loading={loading}
      />
    </Page>
  )
}

function getAccentText(num: number | null): string {
  if (!num) return 'text-vf-text'
  return challengeAccent(num).text
}
