import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Dialog'
import { normalizeRegisterNumber } from '@/lib/utils'
import type { AcademicYear } from '@/types'
import { ArrowLeft } from 'lucide-react'

export function RegisterPage() {
  const navigate = useNavigate()
  const { signInAnonymously, user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [form, setForm] = useState({
    full_name: '',
    academic_year: '' as AcademicYear | '',
    register_number: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let currentUser = user
      if (!currentUser) {
        const { error: authErr } = await signInAnonymously()
        if (authErr) throw authErr
        const { data: { user: u2 } } = await supabase.auth.getUser()
        currentUser = u2
      }
      if (!currentUser) {
        const { data: { user: u } } = await supabase.auth.getUser()
        currentUser = u
      }

      const normalized = normalizeRegisterNumber(form.register_number)
      
      const { data: existing } = await supabase
        .from('participants')
        .select('*')
        .eq('normalized_register_number', normalized)
        .maybeSingle()

      if (existing) {
        const { data: existingSession } = await supabase
          .from('sessions')
          .select('*')
          .eq('participant_id', existing.id)
          .maybeSingle()
        
        if (existingSession) {
          // Allow resume if session is still running
          if (existingSession.session_status === 'active' || existingSession.session_status === 'paused') {
            let canResume = true
            if (existingSession.deadline_at) {
              if (new Date(existingSession.deadline_at).getTime() <= Date.now()) {
                canResume = false
              }
            }
            if (canResume && currentUser) {
              // Link this auth user to the participant
              await supabase.from('participant_identities').upsert({
                participant_id: existing.id,
                auth_user_id: currentUser.id,
                is_active: true,
              }, { onConflict: 'participant_id,auth_user_id' })
              navigate('/session')
              return
            }
            if (!canResume) {
              setError('This session has ended. Please contact the coordinator.')
              setLoading(false)
              return
            }
          }
          if (existingSession.session_status === 'challenge_selected') {
            if (currentUser) {
              await supabase.from('participant_identities').upsert({
                participant_id: existing.id,
                auth_user_id: currentUser.id,
                is_active: true,
              }, { onConflict: 'participant_id,auth_user_id' })
            }
            navigate('/session')
            return
          }
          if (existingSession.session_status === 'pending_challenge') {
            if (currentUser) {
              await supabase.from('participant_identities').upsert({
                participant_id: existing.id,
                auth_user_id: currentUser.id,
                is_active: true,
              }, { onConflict: 'participant_id,auth_user_id' })
            }
            navigate('/challenges')
            return
          }
        }
        
        // If we get here, try to resume anyway if session exists and not completed/cancelled
        if (existingSession && existingSession.session_status !== 'completed' && existingSession.session_status !== 'cancelled' && existingSession.session_status !== 'expired') {
          if (currentUser) {
            await supabase.from('participant_identities').upsert({
              participant_id: existing.id,
              auth_user_id: currentUser.id,
              is_active: true,
            }, { onConflict: 'participant_id,auth_user_id' })
          }
          if (existingSession.session_status === 'active' || existingSession.session_status === 'paused') {
            navigate('/session')
            return
          }
          if (existingSession.session_status === 'challenge_selected') {
            navigate('/challenges')
            return
          }
          navigate('/challenges')
          return
        }
        
        setError('This register number is already registered. Please contact the coordinator for recovery.')
        setLoading(false)
        return
      }

      const { data: participant, error: pErr } = await supabase
        .from('participants')
        .insert({
          full_name: form.full_name.trim(),
          academic_year: form.academic_year,
          register_number: form.register_number.trim(),
          normalized_register_number: normalized,
        })
        .select()
        .single()

      if (pErr) throw pErr

      if (currentUser) {
        await supabase.from('participant_identities').upsert({
          participant_id: participant.id,
          auth_user_id: currentUser.id,
          is_active: true,
        }, { onConflict: 'participant_id,auth_user_id' })
      }

      await supabase
        .from('sessions')
        .insert({
          participant_id: participant.id,
          session_status: 'pending_challenge',
        })

      navigate('/challenges')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-vf-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-vf-text-muted hover:text-vf-text mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <Card>
          <CardHeader>
            <h1 className="text-2xl font-bold">Participant Registration</h1>
            <p className="text-vf-text-muted text-sm mt-1">Register to start your 45-minute challenge</p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert type="error">{error}</Alert>}
              
              <Input label="Full Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required placeholder="Enter your full name" />
              <Select label="Academic Year" value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value as AcademicYear })} required options={[
                { value: 'Second Year', label: 'Second Year' },
                { value: 'Third Year', label: 'Third Year' },
              ]} placeholder="Select year" />
              <Input label="Register Number" value={form.register_number} onChange={(e) => setForm({ ...form, register_number: e.target.value })} required placeholder="Enter your register number" hint="Leading zeros will be preserved" />

              <Button type="submit" fullWidth loading={loading}>Register & Continue</Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
