import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { Clock, ArrowLeft } from 'lucide-react'

export function RecoveryAwaitingPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-vf-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-vf-text-muted hover:text-vf-text mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />Back to Home
        </button>
        <Card>
          <CardBody className="text-center py-8">
            <Clock className="w-16 h-16 text-vf-warning mx-auto mb-4 animate-pulse" />
            <h1 className="text-2xl font-bold mb-2">Awaiting Approval</h1>
            <p className="text-vf-text-2 mb-4">Your recovery request has been submitted. The coordinator will review and approve it shortly.</p>
            <p className="text-sm text-vf-text-muted mb-6">You will be notified once approved. You can then access your existing session.</p>
            <Button onClick={() => navigate('/')} variant="secondary">Return to Home</Button>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
