import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Ambient page background: subtle grid + two soft gradient orbs.
 * Purely decorative, pointer-events disabled.
 */
export function PageBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-vf-bg" />
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #2a2a4a 1px, transparent 1px), linear-gradient(to bottom, #2a2a4a 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)',
        }}
      />
      <div className="absolute -top-40 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-vf-violet/20 blur-[120px]" />
      <div className="absolute top-1/3 -right-40 h-[26rem] w-[26rem] rounded-full bg-vf-cyan/10 blur-[120px]" />
      <div className="absolute bottom-0 -left-40 h-[26rem] w-[26rem] rounded-full bg-vf-orange/10 blur-[120px]" />
    </div>
  )
}

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="relative min-h-screen">
      <PageBackground />
      <div className={cn('relative', className)}>{children}</div>
    </div>
  )
}

export function BrandMark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const box = size === 'lg' ? 'w-12 h-12' : size === 'sm' ? 'w-7 h-7' : 'w-9 h-9'
  const text = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-lg'
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`${box} rounded-xl bg-gradient-to-br from-vf-violet via-vf-cyan to-vf-orange p-[1.5px] shadow-vf`}
      >
        <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-vf-bg">
          <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill="none" aria-hidden="true">
            <path d="M12 3 L21 8.5 L12 14 L3 8.5 Z" fill="url(#bg1)" />
            <path d="M3 13 L12 18.5 L21 13" stroke="url(#bg1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="bg1" x1="3" y1="3" x2="21" y2="19">
                <stop stopColor="#9f6ef7" />
                <stop offset="0.5" stopColor="#22d3ee" />
                <stop offset="1" stopColor="#fb923c" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      <span className={`${text} font-bold tracking-tight text-vf-text`}>
        Vibe<span className="text-gradient-full">Forge</span>
      </span>
    </div>
  )
}

export function StatChip({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-vf-border bg-vf-surface/60 px-4 py-3 backdrop-blur">
      <span className="text-vf-violet">{icon}</span>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-vf-text">{value}</div>
        <div className="text-[11px] uppercase tracking-wider text-vf-text-muted">{label}</div>
      </div>
    </div>
  )
}
