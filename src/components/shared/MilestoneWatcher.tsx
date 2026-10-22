import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { notifyMilestone15, notifyMilestone30, notifyMilestone45 } from '@/lib/notifications'

interface Props {
  sessionId: string
  participantName?: string
}

export function MilestoneWatcher({ sessionId, participantName }: Props) {
  const fired = useRef<Set<string>>(new Set())
  const [enabled, setEnabled] = useState(typeof Notification !== 'undefined' && Notification.permission === 'granted')

  useEffect(() => {
    async function check() {
      if (!enabled) return
      const { data } = await supabase
        .from('milestone_events')
        .select('milestone_type, due_at')
        .eq('session_id', sessionId)
      if (!data) return

      const now = Date.now()
      for (const m of data) {
        if (fired.current.has(m.milestone_type)) continue
        if (new Date(m.due_at).getTime() <= now) {
          fired.current.add(m.milestone_type)
          if (m.milestone_type === 'elapsed_15min') notifyMilestone15(participantName)
          else if (m.milestone_type === 'elapsed_30min') notifyMilestone30(participantName)
          else if (m.milestone_type === 'elapsed_45min') notifyMilestone45(participantName)
        }
      }
    }
    const iv = setInterval(check, 5000)
    check()
    return () => clearInterval(iv)
  }, [sessionId, enabled, participantName])

  return null
}
