-- ============================================================
-- VibeForge: atomic registration / resume
-- Migration: 006_register_participant.sql
-- Doing this server-side avoids the RLS chicken-and-egg problem
-- (a freshly inserted participant is not yet linked to the auth
-- user, so it cannot be SELECTed back by the client) and keeps
-- duplicate detection authoritative.
-- ============================================================

CREATE OR REPLACE FUNCTION public.register_participant(
  p_full_name        text,
  p_academic_year    text,
  p_register_number  text,
  p_normalized       text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid       uuid := auth.uid();
  v_pid       uuid;
  v_session   public.sessions;
  v_live      boolean;
  v_route     text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_academic_year NOT IN ('Second Year', 'Third Year') THEN
    RAISE EXCEPTION 'Only Second Year and Third Year students can register';
  END IF;

  IF length(trim(p_full_name)) < 2 THEN
    RAISE EXCEPTION 'Please enter your full name';
  END IF;

  IF length(trim(p_normalized)) = 0 THEN
    RAISE EXCEPTION 'Please enter your register number';
  END IF;

  SELECT id INTO v_pid
    FROM public.participants
   WHERE normalized_register_number = p_normalized;

  IF v_pid IS NOT NULL THEN
    SELECT * INTO v_session
      FROM public.sessions
     WHERE participant_id = v_pid
       AND session_status <> 'cancelled'
     FOR UPDATE;

    v_live := COALESCE(
      v_session.session_status IN ('pending_challenge', 'challenge_selected')
      OR (
        v_session.session_status IN ('active', 'paused')
        AND (v_session.deadline_at IS NULL OR v_session.deadline_at > now())
      ),
      false
    );

    IF NOT v_live THEN
      RETURN jsonb_build_object('status', 'ended');
    END IF;

    -- Supersede any identity from a previous browser, then link this one.
    UPDATE public.participant_identities
       SET is_active = false
     WHERE participant_id = v_pid
       AND is_active = true
       AND auth_user_id <> v_uid;

    INSERT INTO public.participant_identities (participant_id, auth_user_id, is_active)
    VALUES (v_pid, v_uid, true)
    ON CONFLICT (participant_id, auth_user_id)
    DO UPDATE SET is_active = true;

    v_route := CASE
      WHEN v_session.session_status = 'pending_challenge' THEN '/challenges'
      ELSE '/session'
    END;

    RETURN jsonb_build_object('status', 'resumed', 'route', v_route, 'participant_id', v_pid);
  END IF;

  INSERT INTO public.participants (
    full_name, academic_year, register_number, normalized_register_number
  )
  VALUES (
    trim(p_full_name), p_academic_year, trim(p_register_number), p_normalized
  )
  RETURNING id INTO v_pid;

  INSERT INTO public.participant_identities (participant_id, auth_user_id, is_active)
  VALUES (v_pid, v_uid, true);

  INSERT INTO public.sessions (participant_id, session_status)
  VALUES (v_pid, 'pending_challenge');

  RETURN jsonb_build_object('status', 'registered', 'route', '/challenges', 'participant_id', v_pid);

EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'This register number is already registered. Please contact the coordinator for recovery.';
END;
$$;

REVOKE ALL ON FUNCTION public.register_participant(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_participant(text, text, text, text) TO authenticated;
