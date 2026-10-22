import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Dialog'
import { Page, BrandMark } from '@/components/shared/Page'
import { ArrowLeft, ShieldCheck, KeyRound } from 'lucide-react'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const { signInAdmin } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', password: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: err } = await signInAdmin(form.email, form.password)
      if (err) throw err
      navigate('/admin')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Page className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6">
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

      <main className="flex flex-1 items-center justify-center px-5 pb-16">
        <div className="relative w-full max-w-md">
          <div className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-br from-vf-violet/50 via-vf-cyan/20 to-vf-orange/40 opacity-60 blur-sm" />
          <div className="relative rounded-3xl border border-vf-border bg-vf-surface/90 p-7 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="mb-7">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-vf-violet/30 bg-vf-violet/10 text-vf-violet-light">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-vf-text">Coordinator access</h1>
              <p className="mt-1.5 text-sm text-vf-text-muted">
                Sign in to manage participants, sessions and surprise tasks.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert type="error">{error}</Alert>}

              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="username"
                placeholder="coordinator@college.edu"
              />
              <Input
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />

              <Button type="submit" size="lg" fullWidth loading={loading} className="mt-2 h-12">
                <KeyRound className="h-4 w-4" />
                Sign in
              </Button>
            </form>

            <p className="mt-5 flex items-start gap-2 text-[11px] leading-relaxed text-vf-text-muted">
              <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-vf-cyan/70" />
              Admin access is restricted to accounts with the coordinator role. Participants never
              need an account.
            </p>
          </div>
        </div>
      </main>
    </Page>
  )
}
