import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Dialog'
import { Page, BrandMark } from '@/components/shared/Page'
import { normalizeRegisterNumber } from '@/lib/utils'
import type { AcademicYear } from '@/types'
import { ArrowLeft, Clock, Sparkles, ShieldCheck, UserRound } from 'lucide-react'

const YEARS = [
  { value: 'Second Year', label: 'Second Year' },
  { value: 'Third Year', label: 'Third Year' },
]

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
      // Anonymous identity is the participant's session handle.
      if (!user) {
        const { error: authErr } = await signInAnonymously()
        if (authErr) throw authErr
      }

      const normalized = normalizeRegisterNumber(form.register_number)

      // One atomic server-side call: duplicate detection, identity linking and
      // session creation all happen in Postgres.
      const { data, error: rpcErr } = await supabase.rpc('register_participant', {
        p_full_name: form.full_name.trim(),
        p_academic_year: form.academic_year,
        p_register_number: form.register_number.trim(),
        p_normalized: normalized,
      })

      if (rpcErr) throw new Error(rpcErr.message)

      const result = data as { status: string; route?: string } | null

      if (result?.status === 'ended') {
        setError('Your session has already ended. Please contact the coordinator for recovery.')
        return
      }

      navigate(result?.route || '/challenges')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Page>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <button onClick={() => navigate('/')} className="transition-opacity hover:opacity-80">
          <BrandMark />
        </button>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs font-medium text-vf-text-muted transition-colors hover:text-vf-text"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Home
        </button>
      </header>

      <main className="mx-auto grid max-w-5xl gap-10 px-5 pb-24 pt-6 lg:grid-cols-[1fr_460px] lg:items-center lg:gap-16 lg:pt-14">
        {/* Left: pitch */}
        <div className="hidden lg:block">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-vf-cyan">
            Step 1 of 3
          </p>
          <h1 className="text-4xl font-black leading-tight tracking-tight text-vf-text">
            Three fields.
            <br />
            <span className="text-gradient-full">Then the clock starts.</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-vf-text-2">
            No password, no email verification. Your register number is your identity for the event —
            keep it exactly as it appears on your college record.
          </p>

          <ul className="mt-8 space-y-4">
            {[
              { icon: UserRound, title: 'Identify yourself', body: 'Name, year and register number. That is all.' },
              { icon: Sparkles, title: 'Pick a challenge', body: 'Six options. Full brief shown only after you start.' },
              { icon: Clock, title: '45 minutes on the clock', body: 'Server-authoritative. Refreshing will not reset it.' },
            ].map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3.5">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-vf-border bg-vf-surface/70 text-vf-violet-light">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-vf-text">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-vf-text-muted">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: form */}
        <div className="relative">
          <div className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-br from-vf-violet/40 via-vf-cyan/20 to-vf-orange/30 opacity-60 blur-sm" />
          <div className="relative rounded-3xl border border-vf-border bg-vf-surface/90 p-7 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="mb-6">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-vf-violet-light lg:hidden">
                Step 1 of 3
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-vf-text">Participant registration</h2>
              <p className="mt-1.5 text-sm text-vf-text-muted">
                Takes about 20 seconds. No password needed.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert type="error">{error}</Alert>}

              <Input
                label="Full name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
                autoComplete="name"
                placeholder="e.g. Priya Raman"
              />

              <Select
                label="Academic year"
                value={form.academic_year}
                onChange={(e) => setForm({ ...form, academic_year: e.target.value as AcademicYear })}
                required
                options={YEARS}
                placeholder="Select your year"
              />

              <Input
                label="Register number"
                value={form.register_number}
                onChange={(e) => setForm({ ...form, register_number: e.target.value })}
                required
                autoComplete="off"
                placeholder="e.g. 21CS1043"
                hint="Letters and digits are both fine — leading zeros are preserved."
              />

              <Button type="submit" size="lg" fullWidth loading={loading} className="mt-2 h-12">
                Continue to Challenges
              </Button>

              <p className="flex items-start gap-2 pt-1 text-[11px] leading-relaxed text-vf-text-muted">
                <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-vf-cyan/70" />
                Already registered? Enter the same register number and you will be returned to your
                session if the timer is still running.
              </p>
            </form>
          </div>
        </div>
      </main>
    </Page>
  )
}
