import {
  ShieldCheck,
  ListChecks,
  Timer,
  Bell,
  Trophy,
  Sparkles,
  AlertTriangle,
} from 'lucide-react'

const RULES = [
  {
    title: 'One challenge, one mission.',
    body: 'Work only on the challenge assigned to you. Read the complete brief and understand its core requirements before you begin.',
  },
  {
    title: 'Build with AI.',
    body: 'You may use AI coding assistants and the development tools available to you. Use AI to generate, improve, debug and refine your solution.',
  },
  {
    title: 'Your tech stack, your choice.',
    body: 'Choose the programming language, framework and tools that best suit your idea and skills.',
  },
  {
    title: 'Make it functional.',
    body: 'A working application with meaningful features is better than a beautiful interface that does nothing. Test your solution before submitting it.',
  },
  {
    title: 'Expect a surprise!',
    body: 'The coordinator may reveal an additional subtask during your session. Check this page once it is officially released, and incorporate it into your solution.',
  },
  {
    title: 'No switching challenges.',
    body: 'Once your session begins, your assigned challenge remains fixed unless the coordinator authorizes a change.',
  },
  {
    title: 'Use your time wisely.',
    body: 'You have exactly 45 minutes. Plan your work, build the essential features first, and leave time to test and fix bugs.',
  },
  {
    title: 'Be original and responsible.',
    body: 'Do not copy another participant\'s complete solution. Be prepared to explain your implementation and demonstrate how it works.',
  },
]

const TIMELINE = [
  { time: '0–15 min', body: 'Understand the problem, plan your approach and build the core functionality.' },
  { time: '15–30 min', body: 'Improve your solution, test its behaviour and refine the user experience.' },
  { time: 'At 30 min', body: 'Watch for a browser notification and check this page for a surprise subtask from the coordinator.' },
  { time: '30–45 min', body: 'Implement the surprise subtask, fix remaining issues and prepare your final demonstration.' },
  { time: 'At 45 min', body: 'Stop development and present your final outcome to the coordinator.' },
]

const REMINDERS = [
  'Enable browser notifications in Google Chrome so you receive session reminders and surprise-task alerts.',
  'A surprise task is official only when it is displayed on your session page by the coordinator.',
  'Refreshing the page will not reset or extend your timer.',
  'If the page disconnects or reloads, return to your session. Your remaining time comes from the recorded session deadline.',
  'If you experience a technical issue, inform the coordinator immediately.',
  'When the timer reaches zero, stop coding and show the application in its current state.',
]

const VALUES = ['Creativity', 'Functionality', 'Smart use of AI', 'Adaptability']

export function SessionInstructions() {
  return (
    <section
      aria-labelledby="instructions-heading"
      className="relative mt-6 overflow-hidden rounded-2xl border border-vf-violet/25 bg-vf-surface/60 backdrop-blur"
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-vf-violet/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-vf-cyan/10 blur-3xl" />

      {/* Header */}
      <div className="relative border-b border-vf-border px-5 py-5 sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            id="instructions-heading"
            className="flex items-center gap-2.5 text-base font-black tracking-tight text-vf-text"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-vf-violet/30 bg-vf-violet/10 text-vf-violet-light">
              <ShieldCheck className="h-4 w-4" />
            </span>
            VibeForge — Session instructions
          </h2>
          <span className="rounded-full border border-vf-orange/30 bg-vf-orange/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-vf-orange">
            Read before you choose
          </span>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-vf-text-2">
          Welcome to <span className="font-semibold text-vf-text">VibeForge: Build with AI!</span> Your
          mission is to turn an idea into a working application using AI-assisted development. Be
          creative, experiment boldly, and make something that actually works.
        </p>
      </div>

      <div className="relative space-y-8 p-5 sm:p-7">
        {/* Rules */}
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-vf-cyan">
            <ListChecks className="h-3.5 w-3.5" />
            Rules of the challenge
          </h3>
          <ol className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {RULES.map((rule, i) => (
              <li key={rule.title} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-vf-border bg-vf-bg/70 font-mono text-[11px] font-bold text-vf-violet-light">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <p className="text-[13px] font-semibold leading-snug text-vf-text">{rule.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-vf-text-muted">{rule.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Timeline */}
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-vf-cyan">
            <Timer className="h-3.5 w-3.5" />
            Your 45-minute timeline
          </h3>
          <div className="overflow-hidden rounded-xl border border-vf-border bg-vf-bg/40">
            {TIMELINE.map((step) => (
              <div
                key={step.time}
                className="flex flex-col gap-1 border-b border-vf-border/60 px-4 py-2.5 last:border-0 sm:flex-row sm:items-baseline sm:gap-5"
              >
                <span className="w-24 shrink-0 font-mono text-[11px] font-bold uppercase tracking-wide text-vf-violet-light">
                  {step.time}
                </span>
                <span className="text-xs leading-relaxed text-vf-text-2">{step.body}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-vf-text-muted">
            The timeline is a guide, not a restriction on how you organize your work. Your session
            deadline is enforced by the system.
          </p>
        </div>

        {/* Reminders */}
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-vf-cyan">
            <Bell className="h-3.5 w-3.5" />
            Important reminders
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {REMINDERS.map((item) => (
              <li key={item} className="flex gap-2 text-xs leading-relaxed text-vf-text-muted">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-vf-cyan/70" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* What matters */}
        <div className="rounded-xl border border-vf-border bg-vf-bg/40 p-4 sm:p-5">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-vf-cyan">
            <Trophy className="h-3.5 w-3.5" />
            What matters
          </h3>
          <div className="mb-3 flex flex-wrap gap-2">
            {VALUES.map((value) => (
              <span
                key={value}
                className="rounded-full border border-vf-violet/25 bg-vf-violet/[0.08] px-3 py-1 text-[11px] font-semibold text-vf-violet-light"
              >
                {value}
              </span>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-vf-text-2">
            You do not need to build the biggest application in the room. Build something interesting,
            make it work, and show us how well you can adapt when the unexpected happens.
          </p>
          <p className="mt-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-vf-text-muted">
            <Sparkles className="h-3.5 w-3.5 text-vf-orange" />
            Think. Prompt. Build. Debug. VibeForge.
          </p>
        </div>
      </div>

      <div className="relative border-t border-vf-border bg-vf-orange/[0.06] px-5 py-3 sm:px-7">
        <p className="flex items-start gap-2 text-xs leading-relaxed text-vf-orange">
          <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
          No restarts. No extensions. Once your session starts, the clock cannot be paused or reset.
        </p>
      </div>
    </section>
  )
}
