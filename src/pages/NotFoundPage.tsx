import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Home } from 'lucide-react'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-vf-bg flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gradient-full mb-4">404</h1>
        <p className="text-xl text-vf-text-2 mb-2">Page Not Found</p>
        <p className="text-vf-text-muted mb-6">The page you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/')}><Home className="w-4 h-4" />Go Home</Button>
      </div>
    </div>
  )
}
