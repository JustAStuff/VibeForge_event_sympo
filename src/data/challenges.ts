import type { ChallengeBrief } from '@/types'

/**
 * Official VibeForge challenge briefs.
 *
 * `surprise_task` is coordinator-only. It is NOT rendered anywhere in the
 * participant UI; the admin dashboard uses it to pre-fill the draft task.
 */
export const CHALLENGES: ChallengeBrief[] = [
  {
    number: 1,
    emoji: '⚖️',
    title: 'The Court of Bad Decisions',
    tagline: 'Every questionable life decision deserves its day in court.',
    intro: [
      'You watched an entire series the night before an exam. You promised to start studying on Monday, and somehow it is Friday again. You bought snacks with money you were supposed to save. The evidence is undeniable, but you still deserve a trial.',
      'Imagine a courtroom where users confess their questionable decisions and face a ridiculously dramatic judge. Every confession becomes a case, every bad habit becomes a charge, and every verdict comes with an absurd sentence.',
      'The judge should not simply display "Guilty." They should react to the confession, question the defendant\'s logic, tease their excuses and deliver a verdict with theatrical energy. One confession might trigger an angry lecture, while another earns a suspiciously sympathetic judge.',
    ],
    build_heading: 'What your courtroom should include',
    core_requirements: [
      'A confession box where users submit their questionable decisions.',
      'A list of charges, such as Procrastination, Financial Irresponsibility and Academic Negligence.',
      'A dramatic judge who delivers reactions and verdicts.',
      'Multiple possible outcomes, each with a ridiculous sentence.',
      'A case history where users can revisit previous trials.',
    ],
    example:
      'A user confesses, "I opened my laptop to study but watched memes for three hours." The judge slams the gavel: "THE COURT HAS REASON TO BELIEVE THIS LAPTOP IS BEING USED FOR ENTERTAINMENT UNDER FALSE EDUCATIONAL PRETENCES!" The verdict? Guilty. The sentence? One full hour of studying without opening a single unnecessary tab.'
  },
  {
    number: 2,
    emoji: '🪑',
    title: 'Inanimate Objects Have Opinions',
    tagline: 'Your belongings have been tolerating you for years. They finally have something to say.',
    intro: [
      'Your laptop has witnessed 37 open tabs, questionable searches and last-minute assignment submissions. Your water bottle has been ignored all day. Your chair has silently judged your posture for months.',
      'What if these objects could talk? Create an interactive world where everyday objects have personalities, moods and opinions about how humans treat them. Users should be able to select an object, interact with it and discover its reactions.',
      'A laptop might be sarcastic, a water bottle might be emotionally needy, and an alarm clock might be furious about being snoozed every morning. The personalities are yours to invent.',
    ],
    build_heading: 'What your world should include',
    core_requirements: [
      'A collection of everyday objects users can interact with.',
      'A unique personality and dialogue style for each object.',
      'Different reactions to different user actions.',
      'Interaction counters or mood changes that reflect how users behave.',
      'Hidden responses that unlock through repeated or unusual interactions.',
    ],
    example:
      'An object should react to what the user does. Complimenting a laptop might make it proud; opening another tab might make it panic. Ignoring a water bottle repeatedly could make it increasingly dramatic. You could introduce mood meters, unexpected confessions or interactions that unlock after several actions.'
  },
  {
    number: 3,
    emoji: '💬',
    title: 'SayLess: A Communication Companion',
    tagline: 'Sometimes one picture can communicate what a hundred words cannot.',
    intro: [
      'Not everyone finds speaking or typing easy in every situation. A person might need help, want a break, feel uncomfortable or need to communicate something urgently without explaining it verbally.',
      'Imagine a customizable communication board where people express their needs by tapping clear visual cards. This is more than an emoji keyboard: an emoji might show a feeling, but a communication card represents a complete message, request or action.',
      'A water-glass icon labelled "I need water" communicates a specific need. A raised-hand icon labelled "Please stop" communicates a clear boundary. Users should be able to select cards and combine them into messages that other people can understand immediately.',
    ],
    build_heading: 'What your communication board should include',
    core_requirements: [
      'Visual cards organized into categories such as Needs, Feelings, Actions and Urgent Messages.',
      'Each card should have a recognizable icon or emoji and a clear text label.',
      'A message composer that combines selected cards into a readable sentence.',
      'The ability to add custom cards and edit their labels.',
      'Large, easy-to-select controls and a high-contrast mode.',
      'A way to remove selected cards, clear a message and start again.',
    ],
    example:
      'A user selects 💧 "I need water" and 🆘 "I need help". The composer combines them into: "I need water. Please help me." The application could also adapt its suggested cards to different environments, such as home, classroom or public places. Optional speech output is welcome, but the core experience must work without it.'
  },
  {
    number: 4,
    emoji: '⌨️',
    title: 'Typing Racer with Personality',
    tagline: 'Improve your typing speed while a website questions your life choices.',
    intro: [
      'Imagine a typing trainer inspired by keybr, except the experience has a personality. You type passages on screen, race against your personal best and track your speed and accuracy. Meanwhile, the application watches your performance and responds with increasingly ridiculous commentary.',
      'Make a mistake, and your keyboard might receive an apology. Stop typing for too long, and the application might question whether you are still alive. Achieve a new personal best, and even the sarcastic commentary might turn into reluctant respect.',
      'The humour should respond to the user\'s actual performance rather than appearing as unrelated random messages.',
    ],
    build_heading: 'What your typing challenge should include',
    core_requirements: [
      'Text passages that users type directly into the application.',
      'Live highlighting of correct and incorrect characters.',
      'Words-per-minute and accuracy calculations.',
      'Elapsed time, mistake count and a final score.',
      'Personal-best tracking and a way to replay a challenge.',
      'Funny reactions to mistakes, pauses, streaks and improvements.',
    ],
    example:
      'After repeated mistakes: "Your keyboard has filed a formal complaint." After a long pause: "Are you typing or negotiating with every letter?" After a perfect streak: "Suspiciously competent. We\'re keeping an eye on you." After beating a personal best: "Character development detected." The typing trainer must still be useful: accurate calculations and responsive feedback matter as much as the jokes.'
  },
  {
    number: 5,
    emoji: '🧨',
    title: 'Rage-Quit Obstacle Course',
    tagline: 'The game is broken. The level is collapsing. Somehow, you still want to win.',
    intro: [
      'You see a simple path to the exit. You move forward, expecting an ordinary platformer. Then the floor disappears. A safe-looking platform becomes a trap. The exit moves just as you reach it. The game announces that you have won, then reveals that you completed the wrong level.',
      'Welcome to an obstacle course designed to surprise, confuse and entertain. Build a playable maze or platformer where the environment refuses to behave as expected. The player should have a clear goal, but reaching it requires reacting to unexpected changes and surviving a world that seems personally offended by their existence.',
    ],
    build_heading: 'What your game should include',
    core_requirements: [
      'A playable character with working movement controls.',
      'A maze, platformer or obstacle course with a clear goal.',
      'Collisions, hazards and meaningful failure conditions.',
      'At least one unexpected environmental event.',
      'A win/loss outcome, score or attempt counter.',
      'A restart option that makes trying again quick and easy.',
    ],
    example:
      'The floor might collapse behind the player. The map could shrink over time. Gravity might reverse for a few seconds. A button labelled "Safe Route" could activate an entirely new obstacle. Platforms could disappear after being touched, forcing the player to keep moving. The surprises should create funny, memorable gameplay rather than making the game completely impossible.'
  },
  {
    number: 6,
    emoji: '🎒',
    title: 'College Chaos Simulator',
    tagline: 'One college day. Three resources. A suspicious number of disasters.',
    intro: [
      'Your day begins normally. Then there is a surprise test, your wallet is nearly empty, lunch disappears, and the class you travelled all the way to attend gets cancelled.',
      'Build a small interactive game about surviving a day in college. You make decisions, manage a few simple resources and face unexpected situations. Every choice has consequences, and the goal is to make it through the day without everything falling apart.',
      'This is meant to be a quick, funny decision-making game, not a complicated simulation with hundreds of rules.',
    ],
    build_heading: 'What your game should include',
    core_requirements: [
      'A starting screen that lets the player begin a new day.',
      'Three simple resources, such as Energy, Money and Happiness.',
      'A sequence of college-related events.',
      'Two or three choices for each event.',
      'Resource changes based on the player\'s decisions.',
      'A clear success or failure condition and an ending screen.',
      'A restart button for another attempt.',
    ],
    example:
      'The Empty Wallet: you have almost no money left, but you are hungry. Buy lunch (spend money, regain energy), skip lunch (save money, lose energy), or borrow from a friend (gain money now, risk a consequence later). Each choice should affect the player\'s situation: a decision that helps one resource might harm another.'
  },
]
