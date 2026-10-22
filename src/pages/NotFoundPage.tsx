import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Page, BrandMark } from '@/components/shared/Page'
import { Home, ArrowLeft } from 'lucide-react'

export function NotFoundPage() {
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
        <div className="text-center">
          <p className="bg-gradient-to-r from-vf-violet via-vf-cyan to-vf-orange bg-clip-text text-7xl font-black tracking-tight text-transparent sm:text-8xl">
            404
          </p>
          <h1 className="mt-4 text-xl font-bold text-vf-text">Page not found</h1>
          <p className="mt-2 text-sm text-vf-text-muted">The page you are looking for does not exist.</p>
          <Button onClick={() => navigate('/')} className="mt-7">
            <Home className="h-4 w-4" />
            Back to home
          </Button>
        </div>
      </main>
    </Page>
  )
}
