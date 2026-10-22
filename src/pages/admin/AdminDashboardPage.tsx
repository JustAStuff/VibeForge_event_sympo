import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Input, Textarea } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { Users, AlertTriangle, Plus, Send, CheckCircle, XCircle } from 'lucide-react'
import { formatMMSS, getChallengeColor } from '@/lib/utils'
import { CHALLENGES } from '@/data/challenges'

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const { signOut } = useAuthStore()
  const [participants, setParticipants] = useState<any[]>([])
  const [recoveryRequests, setRecoveryRequests] = useState<any[]>([])
  const [surpriseTasks, setSurpriseTasks] = useState<any[]>([])
  const [_loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'participants' | 'recovery' | 'surprise'>('participants')
  
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null)
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
    try {
      // Finalize any sessions whose authoritative deadline has passed.
      // This keeps the dashboard correct even if the participant closed the tab.
      await supabase.rpc('finalize_expired_sessions')

      const { data: parts } = await supabase.from('participants').select('*').order('created_at', { ascending: false })
      const { data: sessions } = await supabase.from('sessions').select('*').not('session_status', 'eq', 'cancelled')
      const { data: challenges } = await supabase.from('challenges').select('*')
      
      const combined = (parts || []).map(p => {
        const sess = (sessions || []).find(s => s.participant_id === p.id)
        const session = sess ?? null
        const challenge = session && session.challenge_id ? ((challenges || []).find(c => c.id === session.challenge_id) || null) : null
        const sessObj = session
        let rem: number | null = null
        if (sessObj && sessObj.deadline_at && sessObj.session_status === 'active') {
          rem = Math.max(0, Math.floor((new Date(sessObj.deadline_at).getTime() - Date.now()) / 1000))
        }
        return { participant: p, session: sessObj, challenge, remaining: rem }
      })
      setParticipants(combined)

      const { data: rec } = await supabase
        .from('recovery_requests')
        .select('*, participants(full_name, register_number)')
        .eq('status', 'pending')
        .order('requested_at', { ascending: true })
      setRecoveryRequests(rec || [])

      const { data: tasks } = await supabase
        .from('surprise_tasks')
        .select('*, participants(full_name, register_number), sessions(id)')
        .order('created_at', { ascending: false })
      setSurpriseTasks(tasks || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const createDraftTask = async () => {
    if (!selectedParticipant || !taskTitle || !taskInstructions) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: sess } = await supabase.from('sessions').select('id').eq('participant_id', selectedParticipant.participant.id).single()
      if (!sess) return
      
      await supabase.from('surprise_tasks').insert({
        session_id: sess.id,
        participant_id: selectedParticipant.participant.id,
        title: taskTitle,
        instructions: taskInstructions,
        status: 'draft',
        created_by_admin_id: user?.id,
      })
      
      setShowTaskForm(false)
      setTaskTitle('')
      setTaskInstructions('')
      setSelectedParticipant(null)
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

  const handleLogout = async () => {
    await signOut()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-vf-bg">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">VibeForge Admin Dashboard</h1>
            <p className="text-vf-text-muted">Coordinator Control Panel</p>
          </div>
          <Button variant="secondary" onClick={handleLogout}>Logout</Button>
        </div>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab('participants')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'participants' ? 'bg-vf-violet text-white' : 'bg-vf-surface-2 text-vf-text-2 hover:bg-vf-surface-3'}`}>
            <Users className="w-4 h-4 inline mr-2" />
            Participants ({participants.length})
          </button>
          <button onClick={() => setActiveTab('recovery')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'recovery' ? 'bg-vf-violet text-white' : 'bg-vf-surface-2 text-vf-text-2 hover:bg-vf-surface-3'}`}>
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            Recovery Requests ({recoveryRequests.length})
          </button>
          <button onClick={() => setActiveTab('surprise')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'surprise' ? 'bg-vf-violet text-white' : 'bg-vf-surface-2 text-vf-text-2 hover:bg-vf-surface-3'}`}>
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            Surprise Tasks
          </button>
        </div>

        {activeTab === 'participants' && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">All Participants</h2>
            </CardHeader>
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-vf-surface-2">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-vf-text-2">Participant</th>
                      <th className="text-left p-4 text-sm font-medium text-vf-text-2">Register No.</th>
                      <th className="text-left p-4 text-sm font-medium text-vf-text-2">Year</th>
                      <th className="text-left p-4 text-sm font-medium text-vf-text-2">Challenge</th>
                      <th className="text-left p-4 text-sm font-medium text-vf-text-2">Status</th>
                      <th className="text-left p-4 text-sm font-medium text-vf-text-2">Time</th>
                      <th className="text-left p-4 text-sm font-medium text-vf-text-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((p) => {
                      const brief = p.challenge ? CHALLENGES.find(c => c.number === p.challenge.challenge_number) : null
                      return (
                        <tr key={p.participant.id} className="border-t border-vf-border hover:bg-vf-surface-2/50">
                          <td className="p-4">{p.participant.full_name}</td>
                          <td className="p-4 font-mono text-sm">{p.participant.register_number}</td>
                          <td className="p-4 text-sm">{p.participant.academic_year}</td>
                          <td className="p-4">
                            {p.challenge ? (
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded bg-gradient-to-br ${getChallengeColor(p.challenge.challenge_number)} flex items-center justify-center text-white text-xs font-bold`}>
                                  {p.challenge.challenge_number}
                                </div>
                                <span className="text-sm">{brief?.title || p.challenge.title}</span>
                              </div>
                            ) : (
                              <span className="text-vf-text-muted text-sm">Not selected</span>
                            )}
                          </td>
                          <td className="p-4"><StatusBadge status={p.session?.session_status || 'pending_challenge'} /></td>
                          <td className="p-4 font-mono">
                            {p.remaining !== null ? (
                              <span className={p.remaining <= 300 ? 'text-vf-orange' : ''}>{formatMMSS(p.remaining)}</span>
                            ) : (
                              <span className="text-vf-text-muted">-</span>
                            )}
                          </td>
                          <td className="p-4">
                            <Button size="sm" variant="secondary" onClick={() => { setSelectedParticipant(p); setShowTaskForm(true) }} disabled={!p.session}>
                              <Plus className="w-3 h-3" />
                              Add Surprise Task
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        )}

        {activeTab === 'recovery' && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Pending Recovery Requests</h2>
            </CardHeader>
            <CardBody>
              {recoveryRequests.length === 0 ? (
                <p className="text-vf-text-muted text-center py-8">No pending recovery requests</p>
              ) : (
                <div className="space-y-3">
                  {recoveryRequests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between p-4 bg-vf-surface-2 rounded-lg border border-vf-border">
                      <div>
                        <p className="font-medium">{req.participants?.full_name}</p>
                        <p className="text-sm text-vf-text-muted font-mono">{req.participants?.register_number}</p>
                        <p className="text-xs text-vf-text-muted mt-1">Requested: {new Date(req.requested_at).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="success"><CheckCircle className="w-3 h-3" />Allow Student</Button>
                        <Button size="sm" variant="danger"><XCircle className="w-3 h-3" />Reject</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {activeTab === 'surprise' && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Surprise Tasks</h2>
            </CardHeader>
            <CardBody>
              {surpriseTasks.length === 0 ? (
                <p className="text-vf-text-muted text-center py-8">No surprise tasks created yet</p>
              ) : (
                <div className="space-y-3">
                  {surpriseTasks.map((task) => (
                    <div key={task.id} className="p-4 bg-vf-surface-2 rounded-lg border border-vf-border">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{task.title}</h3>
                          <p className="text-sm text-vf-text-muted">{task.participants?.full_name} • {task.participants?.register_number}</p>
                        </div>
                        <StatusBadge status={task.status} />
                      </div>
                      <p className="text-sm text-vf-text-2 mb-3 whitespace-pre-wrap">{task.instructions}</p>
                      <div className="flex gap-2">
                        {task.status === 'draft' && (
                          <Button size="sm" onClick={() => setPublishConfirm(task)}><Send className="w-3 h-3" />Display Surprise Task to Participant</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {showTaskForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
            <Card className="w-full max-w-lg">
              <CardHeader>
                <h2 className="text-lg font-semibold">Create Surprise Task</h2>
                <p className="text-sm text-vf-text-muted">For: {selectedParticipant?.participant.full_name}</p>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input label="Task Title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="e.g., Bonus Challenge" />
                <Textarea label="Instructions" value={taskInstructions} onChange={(e) => setTaskInstructions(e.target.value)} placeholder="Enter task instructions..." rows={6} />
                <div className="flex gap-2 justify-end">
                  <Button variant="secondary" onClick={() => setShowTaskForm(false)}>Cancel</Button>
                  <Button onClick={createDraftTask}>Save as Draft</Button>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        <ConfirmDialog
          isOpen={!!publishConfirm}
          onClose={() => setPublishConfirm(null)}
          onConfirm={() => publishTask(publishConfirm)}
          title="Display Surprise Task to Participant"
          message="Are you sure you want to publish this surprise task? Once published, the participant will see it immediately and cannot be hidden."
          confirmLabel="Publish & Display"
          variant="warning"
        />
      </div>
    </div>
  )
}
