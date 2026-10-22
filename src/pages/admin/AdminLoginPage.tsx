import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Dialog'
import { ArrowLeft, Shield } from 'lucide-react'

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
    <div className="min-h-screen bg-vf-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-vf-text-muted hover:text-vf-text mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />Back to Home
        </button>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-vf-violet" />
              <div>
                <h1 className="text-2xl font-bold">Admin Login</h1>
                <p className="text-vf-text-muted text-sm mt-1">VibeForge Coordinator Access</p>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert type="error">{error}</Alert>}
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="admin@example.com" />
              <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required placeholder="Enter password" />
              <Button type="submit" fullWidth loading={loading}>Sign In</Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
