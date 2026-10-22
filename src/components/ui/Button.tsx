import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline' | 'cyan' | 'orange'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, fullWidth, children, disabled, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-vf-bg disabled:opacity-50 disabled:cursor-not-allowed select-none'

    const variants = {
      primary:
        'bg-vf-violet hover:bg-vf-violet-light text-white shadow-vf-sm hover:shadow-vf focus-visible:ring-vf-violet',
      secondary:
        'bg-vf-surface-2 hover:bg-vf-surface-3 text-vf-text border border-vf-border hover:border-vf-border-2 focus-visible:ring-vf-violet',
      ghost:
        'bg-transparent hover:bg-vf-surface-2 text-vf-text-2 hover:text-vf-text focus-visible:ring-vf-violet',
      danger:
        'bg-red-700 hover:bg-red-600 text-white focus-visible:ring-red-500',
      success:
        'bg-green-700 hover:bg-green-600 text-white focus-visible:ring-green-500',
      outline:
        'bg-transparent border border-vf-violet text-vf-violet hover:bg-vf-violet/10 focus-visible:ring-vf-violet',
      cyan:
        'bg-vf-cyan hover:bg-vf-cyan-light text-vf-bg font-bold focus-visible:ring-vf-cyan',
      orange:
        'bg-vf-orange hover:bg-vf-orange-light text-white focus-visible:ring-vf-orange',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
      xl: 'px-8 py-4 text-lg',
    }

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
