import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useParticipantStore } from '@/stores/participantStore'
import { supabase } from '@/lib/supabase'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatMMSS, getChallengeColor } from '@/lib/utils'
import { CHALLENGES } from '@/data/challenges'
import { notifySurpriseTask } from '@/lib/notifications'
import { Clock, Bell, CheckCircle, AlertTriangle } from 'lucide-react'
import { LoadingPage } from '@/components/ui/Loading'

export function SessionPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { participant, session, surpriseTask, loadParticipantData, tickTimer, remainingSeconds } = useParticipantStore()
  const [challengeBrief, setChallengeBrief] = useState<typeof CHALLENGES[0] | null>(null)
  const [notificationEnabled, setNotificationEnabled] = useState(typeof Notification !== 'undefined' && Notification.permission === 'granted')

  useEffect(() => {
    if (user) loadParticipantData(user.id)
  }, [user, loadParticipantData])

  useEffect(() => {
    const interval = setInterval(tickTimer, 1000)
    return () => clearInterval(interval)
  }, [tickTimer])

  useEffect(() => {
    if (session?.challenge_id && challengeBrief === null) {
      supabase.from('challenges').select('challenge_number').eq('id', session.challenge_id).single().then(({ data }) => {
        if (data) {
          const brief = CHALLENGES.find((c) => c.number === data.challenge_number)
          setChallengeBrief(brief || null)
        }
      })
    }
  }, [session?.challenge_id, challengeBrief])

  useEffect(() => {
    if (!session?.id) return
    const channel = supabase
      .channel(`session-${session.id}`)
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'surprise_tasks', filter: `session_id=eq.${session.id}` }, (payload: any) => {
        if (payload.new && payload.new.status === 'published') {
          if (notificationEnabled) notifySurpriseTask()
          if (user) loadParticipantData(user.id)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [session?.id, notificationEnabled, user, loadParticipantData])

  const enableNotifications = async () => {
    const { requestNotificationPermission } = await import('@/lib/notifications')
    const result = await requestNotificationPermission()
    setNotificationEnabled(result === 'granted')
  }

  const handleAcknowledge = async () => {
    if (!surpriseTask || !participant) return
    await supabase.from('surprise_tasks').update({ status: 'acknowledged', acknowledged_at: new Date().toISOString(), acknowledged_by_participant_id: participant.id }).eq('id', surpriseTask.id)
    if (user) loadParticipantData(user.id)
  }

  const handleComplete = async () => {
    if (!surpriseTask || !participant) return
    await supabase.from('surprise_tasks').update({ status: 'completed', completed_at: new Date().toISOString(), completed_by_participant_id: participant.id }).eq('id', surpriseTask.id)
    if (user) loadParticipantData(user.id)
  }

  if (!participant || !session) return <LoadingPage message="Loading your session..." />

  const isTimeUp = remainingSeconds <= 0 && (session.session_status === 'active' || session.session_status === 'paused')
  const isPaused = session.session_status === 'paused'

  return (
    <div className="min-h-screen bg-vf-bg">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">VibeForge Session</h1>
            <p className="text-vf-text-muted">{participant.full_name} • {participant.register_number}</p>
          </div>
          <StatusBadge status={session.session_status} />
        </div>

        <Card className="mb-6">
          <CardBody className="text-center py-8">
            <div className="flex items-center justify-center gap-2 mb-2 text-vf-text-muted">
              <Clock className="w-5 h-5" />
              <span>{isPaused ? 'PAUSED' : isTimeUp ? 'TIME UP' : 'TIME REMAINING'}</span>
            </div>
            <div className={`timer-display ${remainingSeconds <= 300 ? 'text-vf-orange' : remainingSeconds <= 600 ? 'text-vf-warning' : 'text-vf-violet'}`}>
              {formatMMSS(remainingSeconds)}
            </div>
            {(isTimeUp || session.session_status === 'completed' || session.session_status === 'expired') && (
              <p className="mt-4 text-vf-error font-semibold">Your session has ended. Please present your work to the coordinator.</p>
            )}
          </CardBody>
        </Card>

        {!notificationEnabled && session.session_status === 'active' && (
          <Card className="mb-6 border-vf-cyan/50">
            <CardBody className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-vf-cyan" />
                <div>
                  <p className="font-medium">Enable browser notifications</p>
                  <p className="text-sm text-vf-text-muted">Get alerts for surprise tasks and milestones</p>
                </div>
              </div>
              <Button onClick={enableNotifications} variant="cyan" size="sm">Enable</Button>
            </CardBody>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getChallengeColor(challengeBrief?.number || 1)} flex items-center justify-center text-white font-bold`}>{challengeBrief?.number || '?'}</div>
                {challengeBrief?.title || 'Challenge Details'}
              </h2>
            </CardHeader>
            <CardBody>
              {challengeBrief ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2 text-vf-cyan">Brief</h3>
                    <p className="text-vf-text-2 text-sm leading-relaxed">{challengeBrief.brief}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-vf-violet">Core Requirements</h3>
                    <ul className="space-y-2">
                      {challengeBrief.core_requirements.map((req, i) => (
                        <li key={i} className="flex gap-2 text-sm text-vf-text-2"><CheckCircle className="w-4 h-4 text-vf-success flex-shrink-0 mt-0.5" />{req}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : <p className="text-vf-text-muted">Loading challenge details...</p>}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-vf-orange" />Surprise Task</h2>
            </CardHeader>
            <CardBody>
              {surpriseTask && surpriseTask.status !== 'withdrawn' ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-vf-orange mb-2">{surpriseTask.title}</h3>
                    <div className="bg-vf-surface-2 p-4 rounded-lg border border-vf-border">
                      <p className="text-vf-text-2 text-sm whitespace-pre-wrap">{surpriseTask.instructions}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <StatusBadge status={surpriseTask.status} />
                    <div className="flex gap-2">
                      {surpriseTask.status === 'published' && <Button size="sm" onClick={handleAcknowledge}>Acknowledge</Button>}
                      {surpriseTask.status === 'acknowledged' && <Button size="sm" variant="success" onClick={handleComplete}>Mark Complete</Button>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-vf-text-muted mx-auto mb-3" />
                  <p className="text-vf-text-muted">No surprise task yet</p>
                  <p className="text-sm text-vf-text-muted mt-1">The coordinator will assign one at the appropriate time</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
