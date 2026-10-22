import { getStatusBadgeClass, getStatusLabel } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        getStatusBadgeClass(status),
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {getStatusLabel(status)}
    </span>
  )
}
