import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Input, Textarea } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { Page, BrandMark } from '@/components/shared/Page'
import { ChallengeIcon } from '@/components/shared/ChallengeIcon'
import {
  Users,
  Plus,
  Send,
  LogOut,
  Search,
  Activity,
  Trophy,
  Sparkles,
  RefreshCw,
  Pause,
  Play,
} from 'lucide-react'
import { formatMMSS, formatIST } from '@/lib/utils'
import { CHALLENGES } from '@/data/challenges'

type Tab = 'participants' | 'surprise'

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const { signOut } = useAuthStore()
  const [participants, setParticipants] = useState<any[]>([])
  const [surpriseTasks, setSurpriseTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('participants')
  const [query, setQuery] = useState('')

  const [selectedParticipant, setSelectedParticipant] = useState<any>(null)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [templates, setTemplates] = useState<Record<number, { title: string; instructions: string }>>({})
  const [taskTitle, setTaskTitle] = useState('')
  const [taskInstructions, setTaskInstructions] = useState('')
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [publishConfirm, setPublishConfirm] = useState<any>(null)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    setRefreshing(true)
    try {
      // Finalize any sessions whose authoritative deadline has passed.
      await supabase.rpc('finalize_expired_sessions')

      // Use the database clock, not this browser's clock, for countdowns.
      const { data: serverTs } = await supabase.rpc('server_now')
      const nowMs = serverTs ? new Date(serverTs as string).getTime() : Date.now()

      const { data: parts } = await supabase.from('participants').select('*').order('created_at', { ascending: false })
      const { data: sessions } = await supabase.from('sessions').select('*').not('session_status', 'eq', 'cancelled')
      const { data: challenges } = await supabase.from('challenges').select('*')

      const combined = (parts || []).map((p) => {
        const session = (sessions || []).find((s) => s.participant_id === p.id) ?? null
        const challenge = session && session.challenge_id
          ? (challenges || []).find((c) => c.id === session.challenge_id) || null
          : null
        let remaining: number | null = null
        if (session && session.deadline_at && session.session_status === 'active') {
          remaining = Math.max(0, Math.floor((new Date(session.deadline_at).getTime() - nowMs) / 1000))
        }
        return { participant: p, session, challenge, remaining }
      })
      setParticipants(combined)

      const { data: tasks } = await supabase
        .from('surprise_tasks')
        .select('*, participants(full_name, register_number), sessions(id)')
        .order('created_at', { ascending: false })
      setSurpriseTasks(tasks || [])

      // Coordinator-only defaults, one per challenge.
      const { data: tpl } = await supabase
        .from('challenge_surprise_templates')
        .select('challenge_number, title, instructions')
      if (tpl) {
        setTemplates(
          Object.fromEntries(
            tpl.map((t) => [t.challenge_number, { title: t.title, instructions: t.instructions }]),
          ),
        )
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const openTaskForm = (row: any) => {
    const existing = row.session
      ? surpriseTasks.find((t) => t.session_id === row.session.id && t.status !== 'withdrawn')
      : null
    const num = row.challenge?.challenge_number
    const template = num ? templates[num] : undefined

    setSelectedParticipant(row)
    setEditingTask(existing || null)
    setTaskTitle(existing?.title || template?.title || '')
    setTaskInstructions(existing?.instructions || template?.instructions || '')
    setShowTaskForm(true)
  }

  const closeTaskForm = () => {
    setShowTaskForm(false)
    setEditingTask(null)
    setTaskTitle('')
    setTaskInstructions('')
    setSelectedParticipant(null)
  }

  const saveDraftTask = async () => {
    if (!selectedParticipant || !taskTitle.trim() || !taskInstructions.trim()) return
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (editingTask) {
        if (editingTask.status !== 'draft') return
        await supabase
          .from('surprise_tasks')
          .update({ title: taskTitle.trim(), instructions: taskInstructions.trim() })
          .eq('id', editingTask.id)
      } else {
        const { data: sess } = await supabase
          .from('sessions')
          .select('id')
          .eq('participant_id', selectedParticipant.participant.id)
          .single()
        if (!sess) return

        await supabase.from('surprise_tasks').insert({
          session_id: sess.id,
          participant_id: selectedParticipant.participant.id,
          title: taskTitle.trim(),
          instructions: taskInstructions.trim(),
          status: 'draft',
          created_by_admin_id: user?.id,
        })
      }

      closeTaskForm()
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const publishTask = async (task: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('surprise_tasks').update({
        status: 'published',
        published_at: new Date().toISOString(),
        published_by_admin_id: user?.id,
      }).eq('id', task.id)
      setPublishConfirm(null)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const togglePause = async (row: any) => {
    if (!row.session) return
    const isPaused = row.session.session_status === 'paused'
    const { error } = await supabase.rpc(isPaused ? 'resume_session' : 'pause_session', {
      p_session_id: row.session.id,
    })
    if (error) console.error(error)
    loadData()
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/admin/login')
  }

  const stats = useMemo(() => {
    const active = participants.filter((p) => p.session?.session_status === 'active').length
    const paused = participants.filter((p) => p.session?.session_status === 'paused').length
    const completed = participants.filter((p) => p.session?.session_status === 'completed').length
    return { total: participants.length, active, paused, completed }
  }, [participants])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return participants
    return participants.filter((p) =>
      p.participant.full_name.toLowerCase().includes(q) ||
      p.participant.register_number.toLowerCase().includes(q),
    )
  }, [participants, query])

  const tabs: { id: Tab; label: string; count: number; icon: typeof Users }[] = [
    { id: 'participants', label: 'Participants', count: participants.length, icon: Users },
    { id: 'surprise', label: 'Surprise tasks', count: surpriseTasks.length, icon: Sparkles },
  ]

  return (
    <Page>
      <header className="border-b border-vf-border/70 bg-vf-bg/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-4">
            <BrandMark />
            <span className="hidden h-5 w-px bg-vf-border sm:block" />
            <span className="hidden text-xs font-bold uppercase tracking-[0.18em] text-vf-text-muted sm:block">
              Coordinator
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 rounded-lg border border-vf-border bg-vf-surface/60 px-3 py-2 text-xs font-medium text-vf-text-2 transition-colors hover:border-vf-border-2 hover:text-vf-text"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-20 pt-8">
        <div className="mb-7">
          <h1 className="text-2xl font-black tracking-tight text-vf-text sm:text-3xl">Live dashboard</h1>
          <p className="mt-1 text-sm text-vf-text-muted">
            Auto-refreshes every 10 seconds. All times are IST (Asia/Kolkata); deadlines are
            calculated by the server, not the participant's browser.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Users className="h-4 w-4" />} label="Registered" value={stats.total} accent="violet" />
          <StatCard icon={<Activity className="h-4 w-4" />} label="Running now" value={stats.active} accent="green" />
          <StatCard icon={<Pause className="h-4 w-4" />} label="Paused" value={stats.paused} accent="orange" />
          <StatCard icon={<Trophy className="h-4 w-4" />} label="Completed" value={stats.completed} accent="cyan" />
        </div>

        {/* Tabs + search */}
        <div className="mt-8 flex flex-col gap-3 border-b border-vf-border pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="-mx-1 flex gap-1 overflow-x-auto px-1">
            {tabs.map(({ id, label, count, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  activeTab === id
                    ? 'bg-vf-violet text-white shadow-vf'
                    : 'text-vf-text-2 hover:bg-vf-surface-2 hover:text-vf-text'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeTab === id ? 'bg-white/20' : 'bg-vf-surface-3'}`}>
                  {count}
                </span>
              </button>
            ))}
          </div>

          {activeTab === 'participants' && (
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-vf-text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name or register no."
                className="h-10 w-full rounded-lg border border-vf-border bg-vf-surface/60 pl-9 pr-3 text-sm text-vf-text placeholder:text-vf-text-muted/70 focus:border-vf-violet focus:outline-none focus:ring-1 focus:ring-vf-violet"
              />
            </div>
          )}
        </div>

        <div className="mt-5">
          {activeTab === 'participants' && (
            <div className="overflow-hidden rounded-2xl border border-vf-border bg-vf-surface/50">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1080px]">
                  <thead>
                    <tr className="border-b border-vf-border bg-vf-surface-2/60 text-left text-[11px] font-bold uppercase tracking-wider text-vf-text-muted">
                      <th className="px-5 py-3.5">Participant</th>
                      <th className="px-5 py-3.5">Year</th>
                      <th className="px-5 py-3.5">Challenge</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Start (IST)</th>
                      <th className="px-5 py-3.5">End (IST)</th>
                      <th className="px-5 py-3.5">Remaining</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={8} className="px-5 py-14 text-center text-sm text-vf-text-muted">Loading participants…</td></tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-5 py-16 text-center">
                          <div className="mx-auto flex max-w-xs flex-col items-center">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-vf-border bg-vf-surface-2">
                              <Users className="h-5 w-5 text-vf-text-muted" />
                            </div>
                            <p className="text-sm font-medium text-vf-text-2">
                              {query ? 'No matching participants' : 'No participants yet'}
                            </p>
                            <p className="mt-1 text-xs text-vf-text-muted">
                              {query ? 'Try a different search term.' : 'They will appear here as soon as they register.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((p) => {
                        const brief = p.challenge ? CHALLENGES.find((c) => c.number === p.challenge.challenge_number) : null
                        const existingTask = p.session
                          ? surpriseTasks.find((t) => t.session_id === p.session.id && t.status !== 'withdrawn')
                          : null
                        const taskLocked = !!existingTask && existingTask.status !== 'draft'
                        return (
                          <tr key={p.participant.id} className="border-b border-vf-border/60 transition-colors last:border-0 hover:bg-vf-surface-2/40">
                            <td className="px-5 py-3.5">
                              <div className="text-sm font-semibold text-vf-text">{p.participant.full_name}</div>
                              <div className="font-mono text-xs text-vf-text-muted">{p.participant.register_number}</div>
                            </td>
                            <td className="px-5 py-3.5 text-sm text-vf-text-2">{p.participant.academic_year}</td>
                            <td className="px-5 py-3.5">
                              {p.challenge ? (
                                <div className="flex items-center gap-2.5">
                                  <ChallengeIcon number={p.challenge.challenge_number} size="sm" />
                                  <span className="text-sm text-vf-text-2">{brief?.title || p.challenge.title}</span>
                                </div>
                              ) : (
                                <span className="text-sm text-vf-text-muted">Not selected</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              <StatusBadge status={p.session?.session_status || 'pending_challenge'} />
                            </td>
                            <td className="px-5 py-3.5">
                              {p.session?.started_at ? (
                                <span className="font-mono text-sm text-vf-text-2">
                                  {formatIST(p.session.started_at, 'hh:mm a')}
                                </span>
                              ) : (
                                <span className="text-sm text-vf-text-muted">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              {p.session?.deadline_at ? (
                                <div>
                                  <div className="font-mono text-sm text-vf-text-2">
                                    {formatIST(p.session.deadline_at, 'hh:mm a')}
                                  </div>
                                  {p.session.ended_at && (
                                    <div className="text-[10px] uppercase tracking-wide text-vf-text-muted">
                                      ended {formatIST(p.session.ended_at, 'hh:mm a')}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-vf-text-muted">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              {p.remaining !== null ? (
                                <span className={`font-mono text-sm ${p.remaining <= 300 ? 'text-vf-orange' : 'text-vf-text-2'}`}>
                                  {formatMMSS(p.remaining)}
                                </span>
                              ) : (
                                <span className="text-sm text-vf-text-muted">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center justify-end gap-2">
                                {p.session && (p.session.session_status === 'active' || p.session.session_status === 'paused') && (
                                  <Button
                                    size="sm"
                                    variant={p.session.session_status === 'paused' ? 'success' : 'secondary'}
                                    onClick={() => togglePause(p)}
                                    title={p.session.session_status === 'paused' ? 'Resume session' : 'Pause session'}
                                  >
                                    {p.session.session_status === 'paused'
                                      ? <Play className="h-3 w-3" />
                                      : <Pause className="h-3 w-3" />}
                                    {p.session.session_status === 'paused' ? 'Resume' : 'Pause'}
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => openTaskForm(p)}
                                  disabled={!p.session || !p.challenge || taskLocked}
                                  title={
                                    taskLocked
                                      ? 'A surprise task has already been sent'
                                      : existingTask
                                        ? 'Edit the draft surprise task'
                                        : 'Add the default surprise task for this challenge'
                                  }
                                >
                                  <Plus className="h-3 w-3" />
                                  {taskLocked ? 'Task sent' : existingTask ? 'Edit draft' : 'Surprise'}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'surprise' && (
            <div className="rounded-2xl border border-vf-border bg-vf-surface/50">
              {surpriseTasks.length === 0 ? (
                <EmptyState
                  icon={<Sparkles className="h-5 w-5" />}
                  title="No surprise tasks yet"
                  body="Create a confidential task from the Participants tab, then publish it when you are ready."
                />
              ) : (
                <div className="divide-y divide-vf-border/60">
                  {surpriseTasks.map((task) => (
                    <div key={task.id} className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-vf-text">{task.title}</h3>
                          <p className="mt-0.5 text-xs text-vf-text-muted">
                            {task.participants?.full_name} · <span className="font-mono">{task.participants?.register_number}</span>
                          </p>
                        </div>
                        <StatusBadge status={task.status} />
                      </div>
                      <p className="mt-3 whitespace-pre-wrap rounded-lg border border-vf-border bg-vf-bg/50 p-3 text-sm leading-relaxed text-vf-text-2">
                        {task.instructions}
                      </p>
                      {task.status === 'draft' && (
                        <div className="mt-3">
                          <Button size="sm" onClick={() => setPublishConfirm(task)}>
                            <Send className="h-3.5 w-3.5" />
                            Publish to participant
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {showTaskForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-vf-border bg-vf-surface p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-vf-text">
                  {editingTask ? 'Edit surprise task' : 'New surprise task'}
                </h2>
                <p className="mt-1 text-sm text-vf-text-muted">
                  For {selectedParticipant?.participant.full_name} — saved as a draft until you publish it.
                </p>
              </div>
              <StatusBadge status="draft" />
            </div>

            {!editingTask && selectedParticipant?.challenge && (
              <p className="mt-4 flex items-start gap-2 rounded-lg border border-vf-violet/25 bg-vf-violet/[0.07] px-3 py-2.5 text-xs leading-relaxed text-vf-violet-light">
                <Sparkles className="mt-px h-3.5 w-3.5 shrink-0" />
                Pre-filled with the default task for Challenge{' '}
                {selectedParticipant.challenge.challenge_number}. Edit anything before saving.
              </p>
            )}

            <div className="mt-5 space-y-4">
              <Input label="Task title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="e.g. Bonus challenge" />
              <Textarea label="Instructions" value={taskInstructions} onChange={(e) => setTaskInstructions(e.target.value)} placeholder="What must the participant do?" rows={6} />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={closeTaskForm}>
                  Cancel
                </Button>
                <Button onClick={saveDraftTask} disabled={!taskTitle.trim() || !taskInstructions.trim()}>
                  {editingTask ? 'Update draft' : 'Save draft'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!publishConfirm}
        onClose={() => setPublishConfirm(null)}
        onConfirm={() => publishTask(publishConfirm)}
        title="Publish this surprise task?"
        message="It will appear instantly on the participant's screen and cannot be hidden once published."
        confirmLabel="Publish now"
        variant="warning"
      />


    </Page>
  )
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: number
  accent: 'violet' | 'green' | 'cyan' | 'orange'
}) {
  const accents = {
    violet: 'border-vf-violet/25 bg-vf-violet/[0.07] text-vf-violet-light',
    green: 'border-vf-success/25 bg-vf-success/[0.07] text-vf-success',
    cyan: 'border-vf-cyan/25 bg-vf-cyan/[0.07] text-vf-cyan',
    orange: 'border-vf-orange/25 bg-vf-orange/[0.07] text-vf-orange',
  }
  return (
    <div className="rounded-2xl border border-vf-border bg-vf-surface/60 p-4 backdrop-blur">
      <div className={`mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg border ${accents[accent]}`}>
        {icon}
      </div>
      <div className="text-2xl font-black tabular-nums tracking-tight text-vf-text">{value}</div>
      <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-vf-text-muted">{label}</div>
    </div>
  )
}

function EmptyState({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-vf-border bg-vf-surface-2 text-vf-text-muted">
        {icon}
      </div>
      <p className="text-sm font-medium text-vf-text-2">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-vf-text-muted">{body}</p>
    </div>
  )
}
