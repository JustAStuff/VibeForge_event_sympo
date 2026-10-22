import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { Alert, ConfirmDialog } from '@/components/ui/Dialog'
import { CHALLENGES } from '@/data/challenges'
import { getChallengeColor, getChallengeAccent } from '@/lib/utils'
import { ArrowLeft, CheckCircle } from 'lucide-react'

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
      if (!user) return
      const { data: identity } = await supabase.from('participant_identities').select('participant_id').eq('auth_user_id', user.id).eq('is_active', true).maybeSingle()
      if (identity) setParticipantId(identity.participant_id)
    }
    getParticipant()
  }, [user])

  const handleConfirm = async () => {
    if (!selected || !participantId) return
    setError('')
    setLoading(true)
    try {
      const { data: challenge, error: cErr } = await supabase.from('challenges').select('id').eq('challenge_number', selected).single()
      if (cErr || !challenge) throw new Error('Challenge not found in database. Please contact the administrator.')
      const { data: session, error: sErr } = await supabase.from('sessions').update({
        challenge_id: challenge.id,
        session_status: 'active',
        started_at: new Date().toISOString(),
        deadline_at: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
        resumed_at: new Date().toISOString(),
      }).eq('participant_id', participantId).in('session_status', ['pending_challenge', 'challenge_selected']).select().single()
      if (sErr) throw sErr
      const milestones = [
        { milestone_type: 'elapsed_15min', offset_min: 15 },
        { milestone_type: 'elapsed_30min', offset_min: 30 },
        { milestone_type: 'elapsed_45min', offset_min: 45 },
      ]
      for (const m of milestones) {
        await supabase.from('milestone_events').insert({ session_id: session.id, participant_id: participantId, milestone_type: m.milestone_type, due_at: new Date(Date.now() + m.offset_min * 60 * 1000).toISOString() })
      }
      navigate('/session')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
      setConfirmOpen(false)
    }
  }

  const challenge = selected ? CHALLENGES.find((c) => c.number === selected) : null

  return (
    <div className="min-h-screen bg-vf-bg">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-vf-text-muted hover:text-vf-text mb-6 transition-colors"><ArrowLeft className="w-4 h-4" />Back</button>
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
        <div className="mt-6"><Button size="lg" disabled={!selected} onClick={() => setConfirmOpen(true)}>Continue with Challenge {selected}</Button></div>
        <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleConfirm} title="Start Your Session" message={<div><p className="mb-2">You are about to start your 45-minute session with:</p><p className={`font-semibold ${getChallengeAccent(selected || 1)}`}>Challenge {challenge?.number}: {challenge?.title}</p><p className="mt-3 text-vf-warning">Once started, the timer cannot be paused by you and cannot be restarted if the session ends.</p></div>} confirmLabel="Start Session (45 min)" loading={loading} />
      </div>
    </div>
  )
}
