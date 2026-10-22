import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { Zap, Clock, Trophy, Code2 } from 'lucide-react'

export function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    async function checkSession() {
      if (!user) return
      setChecking(true)
      try {
        const { data: identity } = await supabase
          .from('participant_identities')
          .select('participant_id')
          .eq('auth_user_id', user.id)
          .eq('is_active', true)
          .maybeSingle()
        if (!identity) return
        const { data: session } = await supabase
          .from('sessions')
          .select('session_status')
          .eq('participant_id', identity.participant_id)
          .in('session_status', ['active', 'paused', 'challenge_selected'])
          .maybeSingle()
        if (session) navigate('/session')
      } catch {}
      setChecking(false)
    }
    checkSession()
  }, [user, navigate])

  return (
    <div className="min-h-screen bg-vf-bg">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            <span className="text-gradient-full">VibeForge</span>
          </h1>
          <p className="text-xl text-vf-text-2 mb-2">45-Minute AI-Assisted Development Challenge</p>
          <p className="text-vf-text-muted">Build. Create. Forge.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardBody className="text-center">
              <Clock className="w-8 h-8 text-vf-violet mx-auto mb-2" />
              <h3 className="font-semibold mb-1">45 Minutes</h3>
              <p className="text-sm text-vf-text-muted">Time-limited challenge</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <Code2 className="w-8 h-8 text-vf-cyan mx-auto mb-2" />
              <h3 className="font-semibold mb-1">6 Challenges</h3>
              <p className="text-sm text-vf-text-muted">Pick your battle</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <Trophy className="w-8 h-8 text-vf-orange mx-auto mb-2" />
              <h3 className="font-semibold mb-1">AI-Assisted</h3>
              <p className="text-sm text-vf-text-muted">Build with AI tools</p>
            </CardBody>
          </Card>
        </div>

        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => navigate('/register')} disabled={checking}>
            <Zap className="w-5 h-5" />
            Register & Start
          </Button>
          <Button size="lg" variant="secondary" onClick={() => navigate('/admin/login')}>
            Admin Login
          </Button>
        </div>
      </div>
    </div>
  )
}
