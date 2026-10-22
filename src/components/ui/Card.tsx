import { cn } from '@/lib/utils'
import { type HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hover' | 'glow' | 'surface2'
}

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
  const variants = {
    default: 'bg-vf-surface border border-vf-border rounded-xl',
    hover: 'bg-vf-surface border border-vf-border rounded-xl transition-all duration-200 hover:border-vf-violet hover:shadow-vf cursor-pointer',
    glow: 'bg-vf-surface border border-vf-violet/50 rounded-xl shadow-vf',
    surface2: 'bg-vf-surface-2 border border-vf-border rounded-xl',
  }
  return (
    <div className={cn(variants[variant], className)} {...props}>
      {children}
    </div>
  )
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div className={cn('px-6 py-4 border-b border-vf-border', className)} {...props}>
      {children}
    </div>
  )
}

interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {}

export function CardBody({ className, children, ...props }: CardBodyProps) {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  )
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <div className={cn('px-6 py-4 border-t border-vf-border', className)} {...props}>
      {children}
    </div>
  )
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'violet' | 'cyan' | 'orange' | 'green' | 'red' | 'yellow' | 'gray'
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-vf-surface-2 text-vf-text-2 border border-vf-border',
    violet: 'bg-violet-900/50 text-violet-400 border border-violet-700',
    cyan: 'bg-cyan-900/50 text-cyan-400 border border-cyan-700',
    orange: 'bg-orange-900/50 text-orange-400 border border-orange-700',
    green: 'bg-green-900/50 text-green-400 border border-green-700',
    red: 'bg-red-900/50 text-red-400 border border-red-700',
    yellow: 'bg-yellow-900/50 text-yellow-400 border border-yellow-700',
    gray: 'bg-gray-900/50 text-gray-400 border border-gray-700',
  }
  return (
    <span className={cn('vf-badge', variants[variant], className)} {...props}>
      {children}
    </span>
  )
}
