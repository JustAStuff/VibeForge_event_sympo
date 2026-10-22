import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Page, BrandMark, StatChip } from '@/components/shared/Page'
import { ChallengeIcon, challengeAccent } from '@/components/shared/ChallengeIcon'
import { CHALLENGES } from '@/data/challenges'
import { Zap, Clock, Layers, Trophy, ArrowRight, ShieldCheck } from 'lucide-react'

export function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [resuming, setResuming] = useState(false)

  // If this browser already owns a live session, go straight back to it.
  useEffect(() => {
    async function checkSession() {
      if (!user) return
      const { data: identity } = await supabase
        .from('participant_identities')
        .select('participant_id')
        .eq('auth_user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()
      if (!identity) return
      const { data: session } = await supabase
        .from('sessions')
        .select('session_status, deadline_at')
        .eq('participant_id', identity.participant_id)
        .in('session_status', ['active', 'paused', 'challenge_selected'])
        .maybeSingle()
      if (!session) return
      const live = session.session_status !== 'active' || !session.deadline_at || new Date(session.deadline_at).getTime() > Date.now()
      if (live) {
        setResuming(true)
        navigate('/session')
      }
    }
    checkSession()
  }, [user, navigate])

  return (
    <Page>
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <BrandMark />
        <button
          onClick={() => navigate('/admin/login')}
          className="inline-flex items-center gap-2 rounded-lg border border-vf-border bg-vf-surface/60 px-3.5 py-2 text-xs font-semibold text-vf-text-2 backdrop-blur transition-colors hover:border-vf-border-2 hover:text-vf-text"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Coordinator
        </button>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-5 pb-24 pt-8 sm:pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-vf-violet/30 bg-vf-violet/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-vf-violet-light">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-vf-violet-light opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-vf-violet-light" />
            </span>
            Live build challenge
          </div>

          <h1 className="text-balance text-5xl font-black leading-[1.05] tracking-tight sm:text-7xl">
            <span className="text-vf-text">Forge something</span>
            <br />
            <span className="text-gradient-full">in 45 minutes.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-vf-text-2 sm:text-lg">
            Pick one of six challenges, start the clock, and ship a working prototype with AI.
            No passwords, no setup — just you and the timer.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="xl" onClick={() => navigate('/register')} disabled={resuming} className="group w-full sm:w-auto">
              <Zap className="h-5 w-5" />
              {resuming ? 'Resuming session…' : 'Register & Start'}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
            <Button size="xl" variant="secondary" onClick={() => navigate('/admin/login')} className="w-full sm:w-auto">
              <ShieldCheck className="h-4 w-4" />
              Admin Login
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <StatChip icon={<Clock className="h-4 w-4" />} value="45:00" label="Hard limit" />
            <StatChip icon={<Layers className="h-4 w-4" />} value="6" label="Challenges" />
            <StatChip icon={<Trophy className="h-4 w-4" />} value="100" label="Points" />
          </div>
        </div>

        {/* Challenge preview */}
        <section className="mt-24">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-vf-text sm:text-2xl">The six challenges</h2>
              <p className="mt-1 text-sm text-vf-text-muted">
                Full briefs unlock only after you start your session.
              </p>
            </div>
            <span className="hidden shrink-0 rounded-full border border-vf-border px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-vf-text-muted sm:inline">
              Choose one
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CHALLENGES.map((c) => {
              const a = challengeAccent(c.number)
              return (
                <div
                  key={c.number}
                  className="group relative overflow-hidden rounded-2xl border border-vf-border bg-vf-surface/60 p-5 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-vf-border-2 hover:bg-vf-surface"
                >
                  <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${a.from} ${a.to} opacity-[0.12] blur-2xl transition-opacity group-hover:opacity-25`} />
                  <div className="flex items-start gap-4">
                    <ChallengeIcon number={c.number} />
                    <div className="min-w-0">
                      <div className={`mb-1 text-[11px] font-bold uppercase tracking-[0.16em] ${a.text}`}>
                        Challenge {c.number}
                      </div>
                      <h3 className="text-[15px] font-semibold leading-snug text-vf-text">{c.title}</h3>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <footer className="mt-20 flex flex-col items-center gap-2 border-t border-vf-border/60 pt-8 text-center text-xs text-vf-text-muted">
          <span className="font-mono uppercase tracking-[0.2em]">VibeForge</span>
          <span>Build. Create. Forge. — 45-minute AI-assisted development challenge.</span>
        </footer>
      </main>
    </Page>
  )
}
