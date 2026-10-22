import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Alert, ConfirmDialog } from '@/components/ui/Dialog'
import { Page, BrandMark } from '@/components/shared/Page'
import { ChallengeIcon, challengeAccent } from '@/components/shared/ChallengeIcon'
import { CHALLENGES } from '@/data/challenges'
import {
  Check,
  Clock,
  Lock,
  Sparkles,
  MousePointerClick,
  Bell,
  Flag,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react'

const RULES = [
  {
    icon: Clock,
    title: '45 minutes, server-timed',
    body: 'The clock starts the moment you press start. Refreshing or closing the tab will not pause or reset it.',
  },
  {
    icon: MousePointerClick,
    title: 'One challenge, no switching',
    body: 'You choose once. The full brief unlocks only after you start — there are no previews and no take-backs.',
  },
  {
    icon: Sparkles,
    title: 'Build with AI, own your work',
    body: 'Any AI tool is allowed, but you must be able to explain and demo what you built to the coordinator.',
  },
  {
    icon: AlertTriangle,
    title: 'Surprise task may drop',
    body: 'A confidential task can appear at any time. Keep this tab open — it shows up instantly when published.',
  },
  {
    icon: Bell,
    title: 'Checkpoint alerts',
    body: 'Browser notifications fire at 15, 30 and 45 minutes. Allow notifications when your browser asks.',
  },
  {
    icon: Flag,
    title: 'Time up means stop',
    body: 'Your session closes automatically at zero. Present your work to the coordinator — no restarts or extensions.',
  },
]

export function ChallengeSelectPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<number | null>(null)
  const [acknowledged, setAcknowledged] = useState(false)
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
  const ready = !!selected && acknowledged

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

      <main className="mx-auto max-w-6xl px-5 pb-36 pt-4">
        <div className="max-w-2xl">
          <h1 className="text-balance text-3xl font-black tracking-tight text-vf-text sm:text-4xl">
            Read this first
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-vf-text-2">
            Six challenges. One attempt. Here is exactly how the next 45 minutes work.
          </p>
        </div>

        {error && <Alert type="error" className="mt-6 max-w-2xl">{error}</Alert>}

        {/* Instructions — deliberately above the list */}
        <section
          aria-labelledby="instructions-heading"
          className="relative mt-6 overflow-hidden rounded-2xl border border-vf-violet/25 bg-vf-surface/60 backdrop-blur"
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-vf-violet/15 blur-3xl" />
          <div className="relative flex flex-col gap-2 border-b border-vf-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <h2 id="instructions-heading" className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-vf-text">
              <ShieldCheck className="h-4 w-4 text-vf-violet-light" />
              Session rules
            </h2>
            <span className="text-[11px] font-medium text-vf-text-muted">
              Read all six before choosing a challenge
            </span>
          </div>

          <div className="relative grid gap-x-8 gap-y-5 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
            {RULES.map(({ icon: Icon, title, body }, i) => (
              <div key={title} className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-vf-border bg-vf-bg/60 text-vf-cyan">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold leading-snug text-vf-text">
                    <span className="mr-1.5 font-mono text-[11px] text-vf-text-muted">{String(i + 1).padStart(2, '0')}</span>
                    {title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-vf-text-muted">{body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="relative border-t border-vf-border bg-vf-orange/[0.06] px-5 py-3 sm:px-6">
            <p className="flex items-start gap-2 text-xs leading-relaxed text-vf-orange">
              <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
              No restarts. No extensions. Choose carefully — the decision is final.
            </p>
          </div>
        </section>

        {/* Acknowledgement gate */}
        <label
          className={`mt-4 flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
            acknowledged
              ? 'border-vf-success/35 bg-vf-success/[0.06]'
              : 'border-vf-border bg-vf-surface/50 hover:border-vf-border-2'
          }`}
        >
          <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="peer sr-only"
            />
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-vf-violet peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-vf-bg ${
                acknowledged ? 'border-vf-success bg-vf-success text-vf-bg' : 'border-vf-border-2 bg-vf-bg'
              }`}
            >
              {acknowledged && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
            </span>
          </span>
          <span className="text-sm leading-relaxed text-vf-text-2">
            I have read the session rules and understand that my session cannot be restarted or extended.
          </span>
        </label>

        {/* Challenge list */}
        <div className="mt-10 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-vf-text sm:text-xl">Choose your challenge</h2>
            <p className="mt-1 text-sm text-vf-text-muted">Titles only. Full briefs unlock after you start.</p>
          </div>
          <span className="hidden shrink-0 rounded-full border border-vf-border px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-vf-text-muted sm:inline">
            6 options
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute -bottom-4 right-2 select-none font-black leading-none text-vf-text/[0.04] transition-colors ${
                    isSelected ? 'text-vf-text/[0.07]' : ''
                  } text-6xl`}
                >
                  {String(c.number).padStart(2, '0')}
                </span>
                <span className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${a.from} ${a.to} blur-2xl transition-opacity ${isSelected ? 'opacity-30' : 'opacity-[0.10] group-hover:opacity-20'}`} />

                <div className="relative flex items-start gap-4">
                  <ChallengeIcon number={c.number} />
                  <div className="min-w-0 flex-1">
                    <div className={`mb-1 text-[11px] font-bold uppercase tracking-[0.16em] ${a.text}`}>
                      Challenge {c.number}
                    </div>
                    <h3 className="text-[15px] font-semibold leading-snug text-vf-text">{c.title}</h3>
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

        <div className="mt-6 flex items-start gap-2 text-xs text-vf-text-muted">
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
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Button
              size="lg"
              disabled={!ready || loading}
              onClick={() => setConfirmOpen(true)}
            >
              <Clock className="h-4 w-4" />
              {loading ? 'Starting…' : 'Start 45-min session'}
            </Button>
            {!acknowledged && (
              <span className="text-[11px] text-vf-text-muted">Confirm the rules above to unlock</span>
            )}
          </div>
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
