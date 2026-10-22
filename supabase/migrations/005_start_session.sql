-- ============================================================
-- VibeForge: server-authoritative session start + RLS hardening
-- Migration: 005_start_session.sql
-- ============================================================

-- ------------------------------------------------------------
-- Start a session for the calling participant.
-- The deadline is computed from server time, so clients cannot
-- backdate or extend their own timer.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_session(p_challenge_number integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pid        uuid := public.current_participant_id();
  v_session    public.sessions;
  v_challenge  uuid;
  v_now        timestamptz := now();
BEGIN
  IF v_pid IS NULL THEN
    RAISE EXCEPTION 'No participant is linked to this account';
  END IF;

  SELECT id INTO v_challenge
    FROM public.challenges
   WHERE challenge_number = p_challenge_number;

  IF v_challenge IS NULL THEN
    RAISE EXCEPTION 'Challenge % does not exist', p_challenge_number;
  END IF;

  SELECT * INTO v_session
    FROM public.sessions
   WHERE participant_id = v_pid
     AND session_status <> 'cancelled'
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No session found for this participant';
  END IF;

  IF v_session.session_status IN ('completed', 'expired') THEN
    RAISE EXCEPTION 'This session has already ended';
  END IF;

  IF v_session.session_status IN ('active', 'paused')
     AND v_session.deadline_at IS NOT NULL
     AND v_session.deadline_at > v_now THEN
    RAISE EXCEPTION 'This session is already running';
  END IF;

  UPDATE public.sessions
     SET challenge_id   = v_challenge,
         session_status = 'active',
         started_at     = v_now,
         deadline_at    = v_now + interval '45 minutes',
         ended_at       = NULL,
         paused_at      = NULL,
         resumed_at     = v_now
   WHERE id = v_session.id
   RETURNING * INTO v_session;

  -- Idempotent: the unique (session_id, milestone_type) constraint
  -- keeps this safe if the function is ever retried.
  INSERT INTO public.milestone_events (session_id, participant_id, milestone_type, due_at)
  VALUES
    (v_session.id, v_pid, 'elapsed_15min', v_now + interval '15 minutes'),
    (v_session.id, v_pid, 'elapsed_30min', v_now + interval '30 minutes'),
    (v_session.id, v_pid, 'elapsed_45min', v_now + interval '45 minutes')
  ON CONFLICT DO NOTHING;

  RETURN to_jsonb(v_session);
END;
$$;

REVOKE ALL ON FUNCTION public.start_session(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_session(integer) TO authenticated;

-- ------------------------------------------------------------
-- Enable RLS everywhere (defence in depth)
-- ------------------------------------------------------------
ALTER TABLE public.challenges             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surprise_tasks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone_events       ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- Public challenge catalogue (titles are public; briefs are
-- mirrored client-side and only shown after a session starts).
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "challenges_read_anon" ON public.challenges;
CREATE POLICY "challenges_read_anon" ON public.challenges
  FOR SELECT TO anon
  USING (true);

-- ------------------------------------------------------------
-- Participants may read the milestone schedule of their own
-- session so the client can fire local checkpoint notifications.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "milestones_read_own" ON public.milestone_events;
CREATE POLICY "milestones_read_own" ON public.milestone_events
  FOR SELECT TO authenticated
  USING (participant_id = public.current_participant_id());
