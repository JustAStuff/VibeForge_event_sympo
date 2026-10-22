import type { ChallengeBrief } from '@/types'

export const CHALLENGES: ChallengeBrief[] = [
  {
    number: 1,
    title: 'The Court of Bad Decisions',
    brief:
      'Build a fake courtroom where users put their questionable life decisions on trial. Examples include watching five episodes before studying or repeatedly promising to start on Monday. Users submit a confession, select a charge and receive a dramatic verdict with a ridiculous sentence.',
    core_requirements: [
      'Confession submission form.',
      'Charge selection.',
      'Multiple verdict outcomes.',
      'Case history.',
    ],
    possible_additions: [
      'A defense lawyer who argues the opposite side.',
      'An appeal system that can overturn the original verdict.',
    ],
  },
  {
    number: 2,
    title: 'Inanimate Objects Have Opinions',
    brief:
      'Build an application where everyday objects have personalities and complain about how humans treat them. For example, a laptop complains about too many open tabs, a water bottle guilt-trips its owner, or a chair judges their posture.',
    core_requirements: [
      'Selectable objects.',
      'Object-specific dialogue and reactions.',
      'Interaction counters.',
      'Hidden responses unlocked through interaction.',
    ],
    possible_additions: [
      'Allow two objects to argue with each other.',
      'Introduce a secret relationship between two objects.',
    ],
  },
  {
    number: 3,
    title: 'SayLess: A Communication Companion',
    brief:
      'Build a customizable communication board for people who prefer visual choices over typing long messages. Users tap cards such as "I need help", "I\'m uncomfortable" or "I need a break" to compose a message.',
    core_requirements: [
      'Categorized communication cards with icons and editable labels.',
      'A message composer that combines selected cards into a sentence.',
      'Custom card creation.',
      'Large controls and a high-contrast mode.',
    ],
    possible_additions: [
      'A context switch for classroom, home and public spaces.',
      'A quick-access urgent-needs panel with editable messages and a confirmation step.',
    ],
  },
  {
    number: 4,
    title: 'Typing Racer with Personality',
    brief:
      'Build a typing speed game featuring humorous or personalized text, a live typing challenge and a ghost racer representing the player\'s personal best.',
    core_requirements: [
      'Display text to type.',
      'Track typing accuracy and words per minute.',
      'Show elapsed time and score.',
      'Save the personal best locally or persistently.',
    ],
    possible_additions: [
      'Add difficulty levels.',
      'Add combo streaks and optional sound effects.',
    ],
  },
  {
    number: 5,
    title: 'Rage-Quit Obstacle Course',
    brief:
      'Build a deliberately unfair and hilarious platformer or maze where the rules keep changing. Examples include the floor becoming lava, controls changing unexpectedly, or the exit moving.',
    core_requirements: [
      'A playable maze or obstacle course.',
      'Movement controls.',
      'Collision or obstacle detection.',
      'Survival time or score tracking.',
      'Win and loss conditions.',
    ],
    possible_additions: [
      'Funny troll messages each time the player fails.',
      'An apparently impossible level with a secret skip.',
    ],
  },
  {
    number: 6,
    title: 'College Chaos Simulator',
    brief:
      'Build a mini-game or interactive simulation about surviving a day in college while juggling attendance, assignments, energy, money and unexpected events. Examples include a surprise test, a cancelled class or the mysterious disappearance of lunch.',
    core_requirements: [
      'Resource counters.',
      'Interactive decisions.',
      'Random events.',
      'Win and loss conditions.',
    ],
    possible_additions: [
      'A random event that changes the rules during play.',
      'A secret ending unlocked by an unusual combination of decisions.',
    ],
  },
]
