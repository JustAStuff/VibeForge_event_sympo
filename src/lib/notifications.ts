/**
 * Browser Notification Service
 * Handles native Web Notifications API — no in-app toasts as substitutes.
 */

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported'

/**
 * Check if the Notifications API is available in this browser
 */
export function isNotificationsSupported(): boolean {
  return 'Notification' in window
}

/**
 * Get current notification permission state
 */
export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationsSupported()) return 'unsupported'
  return Notification.permission
}

/**
 * Request notification permission — must be called from a user interaction (click handler)
 * Returns the resulting permission state
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationsSupported()) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'

  try {
    const result = await Notification.requestPermission()
    return result as NotificationPermissionState
  } catch (err) {
    console.error('[Notifications] Failed to request permission:', err)
    return 'denied'
  }
}

export interface BrowserNotificationOptions {
  title: string
  body: string
  icon?: string
  tag?: string // prevents duplicate notifications with same tag
  requireInteraction?: boolean
}

/**
 * Show a native browser notification.
 * Does NOT fall back to in-app toasts.
 * Returns true if shown, false if permission not granted or API unavailable.
 */
export function showBrowserNotification(options: BrowserNotificationOptions): boolean {
  if (!isNotificationsSupported()) return false
  if (Notification.permission !== 'granted') return false

  try {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/vf-icon.svg',
      tag: options.tag,
      requireInteraction: options.requireInteraction || false,
    })

    // Auto-close after 8 seconds unless requireInteraction is true
    if (!options.requireInteraction) {
      setTimeout(() => notification.close(), 8000)
    }

    return true
  } catch (err) {
    console.error('[Notifications] Failed to show notification:', err)
    return false
  }
}

// ============================================================
// Predefined notification templates
// ============================================================

export function notifyMilestone15(participantName?: string): boolean {
  return showBrowserNotification({
    title: 'VibeForge: 15 minutes completed',
    body: participantName
      ? `${participantName}: Keep building and refining your solution.`
      : 'Keep building and refining your solution.',
    tag: 'milestone-15',
  })
}

export function notifyMilestone30(participantName?: string): boolean {
  return showBrowserNotification({
    title: 'VibeForge: 30 minutes completed',
    body: participantName
      ? `${participantName}: Check your session for any coordinator updates.`
      : 'Check your session for any coordinator updates.',
    tag: 'milestone-30',
  })
}

export function notifyMilestone45(participantName?: string): boolean {
  return showBrowserNotification({
    title: 'VibeForge: Session ended',
    body: participantName
      ? `${participantName}: Your 45-minute session has ended. Please present your final outcome.`
      : 'Your 45-minute session has ended. Please present your final outcome.',
    tag: 'milestone-45',
    requireInteraction: true,
  })
}

export function notifySurpriseTask(): boolean {
  return showBrowserNotification({
    title: 'VibeForge: Surprise Task Revealed!',
    body: 'Your coordinator has revealed a surprise task. Open your active session to read it.',
    tag: 'surprise-task',
    requireInteraction: true,
  })
}

export function notifyRecoveryApproved(): boolean {
  return showBrowserNotification({
    title: 'VibeForge: Access Approved',
    body: 'Your coordinator has approved your session recovery. Resuming your session now.',
    tag: 'recovery-approved',
    requireInteraction: true,
  })
}

export function notifyRecoveryRejected(reason?: string): boolean {
  return showBrowserNotification({
    title: 'VibeForge: Recovery Request Rejected',
    body: reason
      ? `Your recovery request was rejected: ${reason}`
      : 'Your recovery request was rejected. Please contact your coordinator.',
    tag: 'recovery-rejected',
    requireInteraction: true,
  })
}

// Admin notifications
export function notifyAdminCheckpoint30(
  participantName: string,
  registerNumber: string,
  challengeNumber: number
): boolean {
  return showBrowserNotification({
    title: `VibeForge checkpoint: ${participantName}`,
    body: `Register No. ${registerNumber}, Challenge ${challengeNumber}. Assign the surprise task now.`,
    tag: `admin-30-${registerNumber}`,
    requireInteraction: true,
  })
}

export function notifyAdminSessionEnded(
  participantName: string,
  challengeNumber: number
): boolean {
  return showBrowserNotification({
    title: `VibeForge session ended: ${participantName}`,
    body: `Challenge ${challengeNumber}. Review the participant's outcome.`,
    tag: `admin-45-${participantName}`,
  })
}

export function notifyAdminRecoveryRequest(
  participantName: string,
  registerNumber: string
): boolean {
  return showBrowserNotification({
    title: 'VibeForge: Recovery Request',
    body: `${participantName} (${registerNumber}) has submitted a session recovery request.`,
    tag: `recovery-${registerNumber}`,
    requireInteraction: true,
  })
}
