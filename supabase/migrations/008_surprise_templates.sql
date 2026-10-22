-- ============================================================
-- VibeForge: default surprise-task templates
-- Migration: 008_surprise_templates.sql
-- One coordinator-only template per challenge. Participants can
-- never read this table (RLS is admin-only), so the default tasks
-- stay confidential until an admin publishes one.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.challenge_surprise_templates (
  challenge_number INTEGER PRIMARY KEY CHECK (challenge_number BETWEEN 1 AND 10),
  title TEXT NOT NULL,
  instructions TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.challenge_surprise_templates ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.challenge_surprise_templates FROM anon;
GRANT SELECT ON public.challenge_surprise_templates TO authenticated;

DROP POLICY IF EXISTS "surprise_templates_admin_read" ON public.challenge_surprise_templates;
CREATE POLICY "surprise_templates_admin_read" ON public.challenge_surprise_templates
  FOR SELECT TO authenticated
  USING (public.is_admin());

INSERT INTO public.challenge_surprise_templates (challenge_number, title, instructions)
VALUES
  (
    1,
    'The Counterargument',
    'The judge must challenge the user''s confession with a counterargument, forcing the defendant to defend their decision before receiving a revised verdict.'
  ),
  (
    2,
    'Objects At War',
    'Two objects must have a conversation or argument. Their dialogue should reflect their individual personalities, with at least one reaction influenced by the user''s interaction.'
  ),
  (
    3,
    'Context Switch',
    'Add a context switch for Home, Classroom and Public Places. Switching contexts should change the suggested communication cards while preserving the user''s custom cards.'
  ),
  (
    4,
    'Adaptive Commentary',
    'Introduce an adaptive commentary system that changes its reactions according to the user''s typing performance, including repeated mistakes, long pauses and a new personal best.'
  ),
  (
    5,
    'Timed Collapse',
    'Introduce a timed collapse event. After a warning, part of the level becomes unsafe or disappears, forcing the player to reach a safe location or the goal before time runs out.'
  ),
  (
    6,
    'The Extra Disaster',
    'Introduce a surprise college event that forces the player to make one additional decision. The decision must change at least one resource and influence whether the player survives the day.'
  )
ON CONFLICT (challenge_number) DO UPDATE
  SET title = EXCLUDED.title,
      instructions = EXCLUDED.instructions,
      updated_at = NOW();
