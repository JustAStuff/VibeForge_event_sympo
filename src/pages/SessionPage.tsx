import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useParticipantStore } from '@/stores/participantStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Page, BrandMark } from '@/components/shared/Page'
import { ChallengeIcon, challengeAccent } from '@/components/shared/ChallengeIcon'
import { MilestoneWatcher } from '@/components/shared/MilestoneWatcher'
import { formatMMSS } from '@/lib/utils'
import { CHALLENGES } from '@/data/challenges'
import { notifySurpriseTask } from '@/lib/notifications'
import { Clock, Bell, CheckCircle2, AlertTriangle, PauseCircle, Timer } from 'lucide-react'
import { LoadingPage } from '@/components/ui/Loading'

const TOTAL_SECONDS = 45 * 60

export function SessionPage() {
  const { user } = useAuthStore()
  const { participant, session, surpriseTask, loadParticipantData, tickTimer, remainingSeconds } = useParticipantStore()
  const [challengeNum, setChallengeNum] = useState<number | null>(null)
  const [notificationEnabled, setNotificationEnabled] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted',
  )
  const [notifDenied, setNotifDenied] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'denied',
  )

  useEffect(() => {
    if (user) loadParticipantData(user.id)
  }, [user, loadParticipantData])

  // Keep in sync with coordinator actions (pause, resume, deadline shifts).
  useEffect(() => {
    if (!user) return
    const interval = setInterval(() => loadParticipantData(user.id), 15000)
    return () => clearInterval(interval)
  }, [user, loadParticipantData])

  useEffect(() => {
    const interval = setInterval(tickTimer, 1000)
    return () => clearInterval(interval)
  }, [tickTimer])

  // Once a session has started, the browser back button must not take the
  // participant back to challenge selection.
  useEffect(() => {
    window.history.pushState(null, '', window.location.href)
    const blockBack = () => {
      window.history.pushState(null, '', window.location.href)
    }
    window.addEventListener('popstate', blockBack)
    return () => window.removeEventListener('popstate', blockBack)
  }, [])

  // Auto-complete when the server-authoritative deadline passes.
  useEffect(() => {
    if (remainingSeconds > 0) return
    if (!session || session.session_status !== 'active') return
    let cancelled = false
    ;(async () => {
      const { error } = await supabase.rpc('finalize_expired_sessions')
      if (cancelled) return
      if (!error && user) loadParticipantData(user.id)
    })()
    return () => { cancelled = true }
  }, [remainingSeconds, session, user, loadParticipantData])

  useEffect(() => {
    if (!session?.challenge_id) return
    supabase
      .from('challenges')
      .select('challenge_number')
      .eq('id', session.challenge_id)
      .single()
      .then(({ data }) => { if (data) setChallengeNum(data.challenge_number) })
  }, [session?.challenge_id])

  // Realtime: reveal a surprise task the instant the coordinator publishes it.
  useEffect(() => {
    if (!session?.id) return
    const channel = supabase
      .channel(`session-${session.id}`)
      .on(
        'postgres_changes' as never,
        { event: '*', schema: 'public', table: 'surprise_tasks', filter: `session_id=eq.${session.id}` },
        (payload: { new?: { status?: string } }) => {
          if (payload.new?.status === 'published') {
            if (notificationEnabled) notifySurpriseTask()
            if (user) loadParticipantData(user.id)
          }
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [session?.id, notificationEnabled, user, loadParticipantData])

  const enableNotifications = async () => {
    const { requestNotificationPermission } = await import('@/lib/notifications')
    const result = await requestNotificationPermission()
    setNotificationEnabled(result === 'granted')
    setNotifDenied(result === 'denied')
  }

  const handleAcknowledge = async () => {
    if (!surpriseTask || !participant) return
    await supabase.from('surprise_tasks').update({
      status: 'acknowledged',
      acknowledged_at: new Date().toISOString(),
      acknowledged_by_participant_id: participant.id,
    }).eq('id', surpriseTask.id)
    if (user) loadParticipantData(user.id)
  }

  const handleComplete = async () => {
    if (!surpriseTask || !participant) return
    await supabase.from('surprise_tasks').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_by_participant_id: participant.id,
    }).eq('id', surpriseTask.id)
    if (user) loadParticipantData(user.id)
  }

  if (!participant || !session) return <LoadingPage message="Loading your session…" />

  const brief = challengeNum ? CHALLENGES.find((c) => c.number === challengeNum) : null
  const accent = challengeAccent(challengeNum || 1)
  const isPaused = session.session_status === 'paused'
  const isEnded = session.session_status === 'completed' || session.session_status === 'expired'
  const timeUp = remainingSeconds <= 0
  const pct = Math.max(0, Math.min(1, remainingSeconds / TOTAL_SECONDS))
  const urgent = remainingSeconds <= 300 && !timeUp
  const R = 86
  const C = 2 * Math.PI * R

  return (
    <Page>
      <MilestoneWatcher sessionId={session.id} participantName={participant.full_name} />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <BrandMark />
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-vf-border bg-vf-surface/60 px-3 py-1.5 text-xs font-medium text-vf-text-2 sm:inline">
            {participant.full_name}
          </span>
          <span className="rounded-full border border-vf-border bg-vf-surface/60 px-3 py-1.5 font-mono text-xs tracking-wide text-vf-text-muted">
            {participant.register_number}
          </span>
          <StatusBadge status={session.session_status} />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-20">
        {/* Timer + session meta */}
        <section className="relative overflow-hidden rounded-3xl border border-vf-border bg-vf-surface/60 p-6 backdrop-blur sm:p-8">
          <div className={`pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gradient-to-br ${accent.from} ${accent.to} opacity-[0.12] blur-3xl`} />

          <div className="relative flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-6">
              {/* Circular countdown */}
              <div className="relative h-48 w-48 shrink-0">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 200 200" aria-hidden="true">
                  <circle cx="100" cy="100" r={R} fill="none" stroke="#1e1e3a" strokeWidth="10" />
                  <circle
                    cx="100"
                    cy="100"
                    r={R}
                    fill="none"
                    strokeWidth="10"
                    strokeLinecap="round"
                    stroke={timeUp || isEnded ? '#ef4444' : urgent ? '#f97316' : '#7c3aed'}
                    strokeDasharray={C}
                    strokeDashoffset={C * (1 - pct)}
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`font-mono text-4xl font-bold tabular-nums tracking-tight ${timeUp || isEnded ? 'text-vf-error' : urgent ? 'text-vf-orange' : 'text-vf-text'}`}>
                    {formatMMSS(remainingSeconds)}
                  </span>
                  <span className="mt-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em] text-vf-text-muted">
                    {isPaused ? <><PauseCircle className="h-3 w-3" /> Paused</> : timeUp || isEnded ? 'Time up' : <><Timer className="h-3 w-3" /> Left</>}
                  </span>
                </div>
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-vf-text-muted">
                  Your challenge
                </p>
                <div className="mt-2 flex items-center gap-3">
                  {challengeNum && <ChallengeIcon number={challengeNum} size="sm" />}
                  <h1 className="text-xl font-bold leading-tight tracking-tight text-vf-text sm:text-2xl">
                    {brief?.title || 'Challenge'}
                  </h1>
                </div>
                <p className={`mt-1 text-xs font-semibold uppercase tracking-wider ${accent.text}`}>
                  Challenge {brief?.number ?? '—'}
                </p>
                {session.deadline_at && (
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-vf-text-muted">
                    <Clock className="h-3.5 w-3.5" />
                    Ends {new Date(session.deadline_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>

            <div className="w-full shrink-0 sm:w-56">
              {isEnded || timeUp ? (
                <div className="rounded-xl border border-vf-error/40 bg-vf-error/10 p-4 text-center">
                  <p className="text-sm font-bold text-vf-error">Session ended</p>
                  <p className="mt-1 text-xs text-vf-text-2">Present your work to the coordinator.</p>
                </div>
              ) : notificationEnabled ? (
                <div className="rounded-xl border border-vf-success/30 bg-vf-success/10 p-4 text-center">
                  <Bell className="mx-auto mb-1 h-4 w-4 text-vf-success" />
                  <p className="text-xs font-semibold text-vf-success">Notifications on</p>
                  <p className="mt-0.5 text-[11px] text-vf-text-muted">Alerts at 15, 30 and 45 min</p>
                </div>
              ) : notifDenied ? (
                <div className="rounded-xl border border-vf-border bg-vf-surface-2 p-4 text-center">
                  <Bell className="mx-auto mb-1 h-4 w-4 text-vf-text-muted" />
                  <p className="text-xs font-semibold text-vf-text-2">Notifications blocked</p>
                  <p className="mt-0.5 text-[11px] text-vf-text-muted">Enable them in your browser's site settings.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-vf-cyan/30 bg-vf-cyan/5 p-4 text-center">
                  <Bell className="mx-auto mb-2 h-4 w-4 text-vf-cyan" />
                  <p className="mb-2.5 text-[11px] leading-snug text-vf-text-2">Get a browser alert at each checkpoint.</p>
                  <Button onClick={enableNotifications} variant="cyan" size="sm" fullWidth>
                    Enable notifications
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {/* Brief */}
          <section className="rounded-2xl border border-vf-border bg-vf-surface/60 backdrop-blur">
            <div className="border-b border-vf-border px-6 py-4">
              <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-vf-text-muted">The brief</h2>
            </div>
            <div className="space-y-6 p-6">
              {brief ? (
                <>
                  <p className={`text-sm font-semibold italic leading-relaxed ${accent.text}`}>
                    {brief.emoji} {brief.tagline}
                  </p>
                  <div className="space-y-3">
                    {brief.intro.map((para) => (
                      <p key={para.slice(0, 32)} className="text-sm leading-relaxed text-vf-text-2">
                        {para}
                      </p>
                    ))}
                  </div>
                  <div>
                    <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-vf-cyan">
                      {brief.build_heading}
                    </h3>
                    <ul className="space-y-2.5">
                      {brief.core_requirements.map((req) => (
                        <li key={req} className="flex gap-2.5 text-sm text-vf-text-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-vf-success/80" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-vf-border bg-vf-bg/50 p-4">
                    <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-vf-text-muted">
                      How it might work
                    </h3>
                    <p className="text-sm leading-relaxed text-vf-text-2">{brief.example}</p>
                  </div>
                  <p className="text-[11px] leading-relaxed text-vf-text-muted">
                    A surprise task is official only when it appears in the panel on the right.
                  </p>
                </>
              ) : (
                <p className="text-sm text-vf-text-muted">Loading challenge details…</p>
              )}
            </div>
          </section>

          {/* Surprise task */}
          <section className={`rounded-2xl border backdrop-blur transition-colors ${surpriseTask ? 'border-vf-orange/40 bg-vf-orange/[0.06]' : 'border-vf-border bg-vf-surface/60'}`}>
            <div className="flex items-center justify-between border-b border-vf-border px-6 py-4">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-vf-text-muted">
                <AlertTriangle className={`h-3.5 w-3.5 ${surpriseTask ? 'text-vf-orange' : ''}`} />
                Surprise task
              </h2>
              {surpriseTask && <StatusBadge status={surpriseTask.status} />}
            </div>
            <div className="p-6">
              {surpriseTask && surpriseTask.status !== 'withdrawn' ? (
                <div className="space-y-5">
                  <div>
                    <h3 className="mb-2 text-base font-bold text-vf-orange">{surpriseTask.title}</h3>
                    <div className="rounded-xl border border-vf-border bg-vf-bg/60 p-4">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-vf-text-2">
                        {surpriseTask.instructions}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {surpriseTask.status === 'published' && (
                      <Button size="sm" onClick={handleAcknowledge}>Acknowledge</Button>
                    )}
                    {surpriseTask.status === 'acknowledged' && (
                      <Button size="sm" variant="success" onClick={handleComplete}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Mark complete
                      </Button>
                    )}
                    {surpriseTask.status === 'completed' && (
                      <p className="flex items-center gap-2 text-sm font-medium text-vf-success">
                        <CheckCircle2 className="h-4 w-4" />
                        Completed — the coordinator can see this.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-vf-border bg-vf-surface-2">
                    <AlertTriangle className="h-5 w-5 text-vf-text-muted" />
                  </div>
                  <p className="text-sm font-medium text-vf-text-2">Nothing yet</p>
                  <p className="mt-1 max-w-[16rem] text-xs leading-relaxed text-vf-text-muted">
                    Your coordinator can reveal a confidential task at any moment. Keep this tab open — it
                    will appear here instantly.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </Page>
  )
}
