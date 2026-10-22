import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { Alert, ConfirmDialog } from '@/components/ui/Dialog'
import { CHALLENGES } from '@/data/challenges'
import { getChallengeColor, getChallengeAccent } from '@/lib/utils'
import { CheckCircle } from 'lucide-react'

export function ChallengeSelectPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<number | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [participantId, setParticipantId] = useState<string | null>(null)

  useEffect(() => {
    async function getParticipant() {
      if (!user) { navigate('/'); return }
      const { data: identity } = await supabase
        .from('participant_identities')
        .select('participant_id')
        .eq('auth_user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()
      if (identity) {
        setParticipantId(identity.participant_id)
        // Check if already has active session
        const { data: sess } = await supabase
          .from('sessions')
          .select('session_status')
          .eq('participant_id', identity.participant_id)
          .in('session_status', ['active', 'paused'])
          .maybeSingle()
        if (sess) navigate('/session')
      } else {
        navigate('/register')
      }
    }
    getParticipant()
  }, [user, navigate])

  const handleConfirm = async () => {
    if (!selected || !participantId) { setError('Missing participant info'); return }
    setError('')
    setLoading(true)

    try {
      const { data: challenge, error: cErr } = await supabase
        .from('challenges')
        .select('id')
        .eq('challenge_number', selected)
        .maybeSingle()

      if (cErr) throw cErr
      if (!challenge) throw new Error('Challenge not found')

      // Try update first
      const { data: updated, error: sErr } = await supabase
        .from('sessions')
        .update({
          challenge_id: challenge.id,
          session_status: 'active',
          started_at: new Date().toISOString(),
          deadline_at: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
          resumed_at: new Date().toISOString(),
        })
        .eq('participant_id', participantId)
        .eq('session_status', 'pending_challenge')
        .select()
        .maybeSingle()

      if (sErr) throw sErr
      if (!updated) {
        // Try challenge_selected
        const { data: updated2, error: sErr2 } = await supabase
          .from('sessions')
          .update({
            challenge_id: challenge.id,
            session_status: 'active',
            started_at: new Date().toISOString(),
            deadline_at: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
          })
          .eq('participant_id', participantId)
          .select()
          .maybeSingle()
        if (sErr2) throw sErr2
        if (!updated2) throw new Error('Could not start session. Please refresh and try again.')
        
        // Create milestones
        for (const m of [{t:'elapsed_15min',o:15},{t:'elapsed_30min',o:30},{t:'elapsed_45min',o:45}]) {
          await supabase.from('milestone_events').insert({ session_id: updated2.id, participant_id: participantId, milestone_type: m.t, due_at: new Date(Date.now() + m.o * 60 * 1000).toISOString() })
        }
        navigate('/session')
        return
      }

      for (const m of [{t:'elapsed_15min',o:15},{t:'elapsed_30min',o:30},{t:'elapsed_45min',o:45}]) {
        await supabase.from('milestone_events').insert({ session_id: updated.id, participant_id: participantId, milestone_type: m.t, due_at: new Date(Date.now() + m.o * 60 * 1000).toISOString() })
      }
      navigate('/session')
    } catch (err) {
      console.error(err)
      setError((err as Error).message)
      setLoading(false)
      setConfirmOpen(false)
    }
  }

  const challenge = selected ? CHALLENGES.find((c) => c.number === selected) : null

  return (
    <div className="min-h-screen bg-vf-bg">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Choose Your Challenge</h1>
          <p className="text-vf-text-muted">Select one of the six challenges. Full details will appear after you start the session.</p>
        </div>

        {error && <Alert type="error" className="mb-6">{error}</Alert>}

        <div className="grid md:grid-cols-2 gap-4">
          {CHALLENGES.map((c) => (
            <Card key={c.number} variant="hover" onClick={() => setSelected(c.number)} className={selected === c.number ? 'ring-2 ring-vf-violet' : ''}>
              <CardBody>
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getChallengeColor(c.number)} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>{c.number}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{c.title}</h3>
                    <p className="text-sm text-vf-text-muted">Challenge {c.number}</p>
                  </div>
                  {selected === c.number && <CheckCircle className="w-6 h-6 text-vf-violet" />}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        <div className="mt-6">
          <Button size="lg" disabled={!selected || loading} onClick={() => setConfirmOpen(true)}>
            {loading ? 'Starting...' : `Continue with Challenge ${selected}`}
          </Button>
        </div>

        <ConfirmDialog
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleConfirm}
          title="Start Your Session"
          message={
            <div>
              <p className="mb-2">You are about to start your 45-minute session with:</p>
              <p className={`font-semibold ${getChallengeAccent(selected || 1)}`}>Challenge {challenge?.number}: {challenge?.title}</p>
              <p className="mt-3 text-vf-warning">Once started, the timer cannot be paused by you and cannot be restarted if the session ends.</p>
            </div>
          }
          confirmLabel="Start Session (45 min)"
          loading={loading}
        />
      </div>
    </div>
  )
}
