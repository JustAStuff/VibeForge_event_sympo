import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatInTimeZone } from 'date-fns-tz'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const IST_TZ = 'Asia/Kolkata'

/**
 * Format a UTC timestamp in IST
 */
export function formatIST(date: string | Date, fmt = 'dd MMM yyyy, hh:mm:ss a'): string {
  return formatInTimeZone(new Date(date), IST_TZ, fmt)
}

/**
 * Format seconds into MM:SS display
 */
export function formatMMSS(seconds: number): string {
  if (seconds < 0) seconds = 0
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * Calculate remaining seconds from a deadline (server-authoritative).
 * `serverOffsetMs` compensates for a participant's skewed local clock.
 */
export function calcRemainingSeconds(deadlineAt: string | null, serverOffsetMs = 0): number {
  if (!deadlineAt) return 0
  const deadline = new Date(deadlineAt).getTime()
  const now = Date.now() + serverOffsetMs
  return Math.max(0, Math.floor((deadline - now) / 1000))
}

/**
 * Calculate elapsed seconds from a start time, accounting for total paused seconds
 */
export function calcElapsedSeconds(
  startedAt: string | null,
  totalPausedSeconds = 0,
  pausedAt: string | null = null
): number {
  if (!startedAt) return 0
  const start = new Date(startedAt).getTime()
  const now = pausedAt ? new Date(pausedAt).getTime() : Date.now()
  const elapsed = Math.floor((now - start) / 1000) - totalPausedSeconds
  return Math.max(0, elapsed)
}

/**
 * Normalize register number for consistent duplicate checking
 */
export function normalizeRegisterNumber(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '')
}

/**
 * Get challenge color by challenge number (1-6)
 */
export function getChallengeColor(num: number): string {
  const colors = [
    'from-violet-600 to-purple-800',
    'from-cyan-600 to-blue-800',
    'from-orange-500 to-red-700',
    'from-emerald-600 to-teal-800',
    'from-rose-500 to-pink-700',
    'from-amber-500 to-orange-700',
  ]
  return colors[(num - 1) % colors.length]
}

export function getChallengeAccent(num: number): string {
  const accents = [
    'text-violet-400 border-violet-700',
    'text-cyan-400 border-cyan-700',
    'text-orange-400 border-orange-700',
    'text-emerald-400 border-emerald-700',
    'text-rose-400 border-rose-700',
    'text-amber-400 border-amber-700',
  ]
  return accents[(num - 1) % accents.length]
}

/**
 * Get status badge styling
 */
export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'active': return 'bg-green-900/50 text-green-400 border border-green-700'
    case 'paused': return 'bg-yellow-900/50 text-yellow-400 border border-yellow-700'
    case 'completed': return 'bg-blue-900/50 text-blue-400 border border-blue-700'
    case 'expired': return 'bg-gray-900/50 text-gray-400 border border-gray-700'
    case 'connection_lost': return 'bg-orange-900/50 text-orange-400 border border-orange-700'
    case 'pending': return 'bg-purple-900/50 text-purple-400 border border-purple-700'
    case 'published': return 'bg-cyan-900/50 text-cyan-400 border border-cyan-700'
    case 'acknowledged': return 'bg-blue-900/50 text-blue-400 border border-blue-700'
    case 'draft': return 'bg-gray-900/50 text-gray-400 border border-gray-700'
    case 'withdrawn': return 'bg-red-900/50 text-red-400 border border-red-700'
    default: return 'bg-gray-900/50 text-gray-400 border border-gray-700'
  }
}

/**
 * Human-readable status labels
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending_challenge: 'Pending Challenge',
    challenge_selected: 'Challenge Selected',
    active: 'Active',
    paused: 'Paused',
    completed: 'Completed',
    expired: 'Time Expired',
    cancelled: 'Cancelled',
    connection_lost: 'Connection Lost',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    draft: 'Draft',
    published: 'Published',
    acknowledged: 'Acknowledged',
    withdrawn: 'Withdrawn',
    connected: 'Connected',
    unknown: 'Unknown',
  }
  return labels[status] || status
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '…'
}

/**
 * Format a duration in seconds to human-readable form
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

/**
 * Safe JSON parse
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

/**
 * Debounce utility
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
