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
  const TEST_MODE = true // 5 min test

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
      const { data: challenge } = await supabase.from('challenges').select('id').eq('challenge_number', selected).maybeSingle()
      if (!challenge) throw new Error('Challenge not found')

      const duration = TEST_MODE ? 5 : 45
      const now = new Date()
      const { data: updated, error: sErr } = await supabase
        .from('sessions')
        .update({
          challenge_id: challenge.id,
          session_status: 'active',
          started_at: now.toISOString(),
          deadline_at: new Date(now.getTime() + duration * 60 * 1000).toISOString(),
          resumed_at: now.toISOString(),
        })
        .eq('participant_id', participantId)
        .select()
        .maybeSingle()

      if (sErr) throw sErr
      if (!updated) throw new Error('Could not start session')

      // Create milestones for test
      if (TEST_MODE) {
        await supabase.from('milestone_events').insert([
          { session_id: updated.id, participant_id: participantId, milestone_type: 'elapsed_15min', due_at: new Date(now.getTime() + 2 * 60 * 1000).toISOString() },
          { session_id: updated.id, participant_id: participantId, milestone_type: 'elapsed_30min', due_at: new Date(now.getTime() + 3 * 60 * 1000).toISOString() },
          { session_id: updated.id, participant_id: participantId, milestone_type: 'elapsed_45min', due_at: new Date(now.getTime() + 5 * 60 * 1000).toISOString() },
        ])
      } else {
        await supabase.from('milestone_events').insert([
          { session_id: updated.id, participant_id: participantId, milestone_type: 'elapsed_15min', due_at: new Date(now.getTime() + 15 * 60 * 1000).toISOString() },
          { session_id: updated.id, participant_id: participantId, milestone_type: 'elapsed_30min', due_at: new Date(now.getTime() + 30 * 60 * 1000).toISOString() },
          { session_id: updated.id, participant_id: participantId, milestone_type: 'elapsed_45min', due_at: new Date(now.getTime() + 45 * 60 * 1000).toISOString() },
        ])
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
          <h1 className="text-3xl font-bold mb-2">Choose Your Challenge {TEST_MODE && <span className="text-vf-orange">(TEST MODE - 5 MIN)</span>}</h1>
          <p className="text-vf-text-muted">Select one of the six challenges.</p>
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
            {loading ? 'Starting...' : `Start ${TEST_MODE ? '5 Min Test' : 'Session'} with Challenge ${selected}`}
          </Button>
        </div>

        <ConfirmDialog
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleConfirm}
          title="Start Test Session"
          message={
            <div>
              <p className="mb-2">You are about to start a <span className="text-vf-orange font-bold">5-MINUTE TEST</span> session with:</p>
              <p className={`font-semibold ${getChallengeAccent(selected || 1)}`}>Challenge {challenge?.number}: {challenge?.title}</p>
              <p className="mt-3 text-vf-cyan">Notifications will trigger at 2 min, 3 min, and 5 min.</p>
            </div>
          }
          confirmLabel="Start Test (5 min)"
          loading={loading}
        />
      </div>
    </div>
  )
}
