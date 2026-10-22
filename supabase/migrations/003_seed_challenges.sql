-- ============================================================
-- VibeForge Challenge Seed Data
-- Migration: 003_seed_challenges.sql
-- All 6 official challenges from project specification
-- ============================================================

INSERT INTO public.challenges (challenge_number, title, brief, core_requirements, possible_additions, is_active)
VALUES
  (
    1,
    'The Court of Bad Decisions',
    'Build a fake courtroom where users put their questionable life decisions on trial. Examples include watching five episodes before studying or repeatedly promising to start on Monday. Users submit a confession, select a charge and receive a dramatic verdict with a ridiculous sentence.',
    ARRAY[
      'Confession submission form.',
      'Charge selection.',
      'Multiple verdict outcomes.',
      'Case history.'
    ],
    ARRAY[
      'A defense lawyer who argues the opposite side.',
      'An appeal system that can overturn the original verdict.'
    ],
    true
  ),
  (
    2,
    'Inanimate Objects Have Opinions',
    'Build an application where everyday objects have personalities and complain about how humans treat them. For example, a laptop complains about too many open tabs, a water bottle guilt-trips its owner, or a chair judges their posture.',
    ARRAY[
      'Selectable objects.',
      'Object-specific dialogue and reactions.',
      'Interaction counters.',
      'Hidden responses unlocked through interaction.'
    ],
    ARRAY[
      'Allow two objects to argue with each other.',
      'Introduce a secret relationship between two objects.'
    ],
    true
  ),
  (
    3,
    'SayLess: A Communication Companion',
    'Build a customizable communication board for people who prefer visual choices over typing long messages. Users tap cards such as "I need help", "I''m uncomfortable" or "I need a break" to compose a message.',
    ARRAY[
      'Categorized communication cards with icons and editable labels.',
      'A message composer that combines selected cards into a sentence.',
      'Custom card creation.',
      'Large controls and a high-contrast mode.'
    ],
    ARRAY[
      'A context switch for classroom, home and public spaces.',
      'A quick-access urgent-needs panel with editable messages and a confirmation step.'
    ],
    true
  ),
  (
    4,
    'Typing Racer with Personality',
    'Build a typing speed game featuring humorous or personalized text, a live typing challenge and a ghost racer representing the player''s personal best.',
    ARRAY[
      'Display text to type.',
      'Track typing accuracy and words per minute.',
      'Show elapsed time and score.',
      'Save the personal best locally or persistently.'
    ],
    ARRAY[
      'Add difficulty levels.',
      'Add combo streaks and optional sound effects.'
    ],
    true
  ),
  (
    5,
    'Rage-Quit Obstacle Course',
    'Build a deliberately unfair and hilarious platformer or maze where the rules keep changing. Examples include the floor becoming lava, controls changing unexpectedly, or the exit moving.',
    ARRAY[
      'A playable maze or obstacle course.',
      'Movement controls.',
      'Collision or obstacle detection.',
      'Survival time or score tracking.',
      'Win and loss conditions.'
    ],
    ARRAY[
      'Funny troll messages each time the player fails.',
      'An apparently impossible level with a secret skip.'
    ],
    true
  ),
  (
    6,
    'College Chaos Simulator',
    'Build a mini-game or interactive simulation about surviving a day in college while juggling attendance, assignments, energy, money and unexpected events. Examples include a surprise test, a cancelled class or the mysterious disappearance of lunch.',
    ARRAY[
      'Resource counters.',
      'Interactive decisions.',
      'Random events.',
      'Win and loss conditions.'
    ],
    ARRAY[
      'A random event that changes the rules during play.',
      'A secret ending unlocked by an unusual combination of decisions.'
    ],
    true
  )
ON CONFLICT (challenge_number) DO UPDATE SET
  title = EXCLUDED.title,
  brief = EXCLUDED.brief,
  core_requirements = EXCLUDED.core_requirements,
  possible_additions = EXCLUDED.possible_additions,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
