import {
  Gavel,
  Armchair,
  MessageSquare,
  Keyboard,
  Gamepad2,
  GraduationCap,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const ICONS: Record<number, LucideIcon> = {
  1: Gavel,
  2: Armchair,
  3: MessageSquare,
  4: Keyboard,
  5: Gamepad2,
  6: GraduationCap,
}

const ACCENTS: Record<number, { text: string; ring: string; glow: string; from: string; to: string }> = {
  1: { text: 'text-violet-300', ring: 'ring-violet-500/40', glow: 'shadow-[0_0_40px_-8px_rgba(139,92,246,0.55)]', from: 'from-violet-500', to: 'to-fuchsia-700' },
  2: { text: 'text-cyan-300', ring: 'ring-cyan-500/40', glow: 'shadow-[0_0_40px_-8px_rgba(6,182,212,0.55)]', from: 'from-cyan-500', to: 'to-blue-700' },
  3: { text: 'text-emerald-300', ring: 'ring-emerald-500/40', glow: 'shadow-[0_0_40px_-8px_rgba(16,185,129,0.55)]', from: 'from-emerald-500', to: 'to-teal-700' },
  4: { text: 'text-amber-300', ring: 'ring-amber-500/40', glow: 'shadow-[0_0_40px_-8px_rgba(245,158,11,0.55)]', from: 'from-amber-500', to: 'to-orange-700' },
  5: { text: 'text-rose-300', ring: 'ring-rose-500/40', glow: 'shadow-[0_0_40px_-8px_rgba(244,63,94,0.55)]', from: 'from-rose-500', to: 'to-pink-700' },
  6: { text: 'text-sky-300', ring: 'ring-sky-500/40', glow: 'shadow-[0_0_40px_-8px_rgba(14,165,233,0.55)]', from: 'from-sky-500', to: 'to-indigo-700' },
}

export function challengeIcon(num: number): LucideIcon {
  return ICONS[num] ?? Sparkles
}

export function challengeAccent(num: number) {
  return ACCENTS[num] ?? ACCENTS[1]
}

export function ChallengeIcon({ number, size = 'md' }: { number: number; size?: 'sm' | 'md' | 'lg' }) {
  const Icon = challengeIcon(number)
  const a = challengeAccent(number)
  const dims = size === 'lg' ? 'w-16 h-16 rounded-2xl' : size === 'sm' ? 'w-9 h-9 rounded-lg' : 'w-12 h-12 rounded-xl'
  const icon = size === 'lg' ? 'w-8 h-8' : size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'
  return (
    <div
      className={`${dims} bg-gradient-to-br ${a.from} ${a.to} flex items-center justify-center text-white shrink-0 ring-1 ${a.ring} ${a.glow}`}
    >
      <Icon className={icon} />
    </div>
  )
}
