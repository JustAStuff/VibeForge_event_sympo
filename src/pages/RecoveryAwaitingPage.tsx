import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Page, BrandMark } from '@/components/shared/Page'
import { Clock, ArrowLeft } from 'lucide-react'

export function RecoveryAwaitingPage() {
  const navigate = useNavigate()
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
        <div className="w-full max-w-md rounded-3xl border border-vf-border bg-vf-surface/80 p-8 text-center backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-vf-warning/30 bg-vf-warning/10">
            <Clock className="h-6 w-6 animate-pulse text-vf-warning" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-vf-text">Awaiting approval</h1>
          <p className="mt-2 text-sm leading-relaxed text-vf-text-2">
            Your recovery request has been submitted. The coordinator will review it shortly.
          </p>
          <p className="mt-3 text-xs leading-relaxed text-vf-text-muted">
            Once approved, return here with the same register number to access your existing session.
          </p>
          <Button onClick={() => navigate('/')} variant="secondary" className="mt-6">
            Return to home
          </Button>
        </div>
      </main>
    </Page>
  )
}
