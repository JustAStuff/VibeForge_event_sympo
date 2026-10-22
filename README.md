# VibeForge ⚡

**A 45-minute, AI-assisted build challenge for college symposiums.**

Participants register with their college register number, read the rules, pick one of six creative build challenges, and race a strictly server-enforced 45-minute clock. Coordinators get a live dashboard to watch sessions, pause/resume time, and release one surprise task per participant.

> Repository: <https://github.com/JustAStuff/VibeForge_event_sympo>
> Production branch: `main`

---

## Table of contents

- [What it does](#what-it-does)
- [Screens & routes](#screens--routes)
- [The six challenges](#the-six-challenges)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Session lifecycle](#session-lifecycle)
- [Server-authoritative timing](#server-authoritative-timing)
- [Data model](#data-model)
- [Security model](#security-model)
- [Local setup](#local-setup)
- [Database migrations](#database-migrations)
- [Admin account](#admin-account)
- [Coordinator workflow](#coordinator-workflow)
- [Deployment on Vercel](#deployment-on-vercel)
- [Capacity: 200 participants](#capacity-200-participants)
- [Project structure](#project-structure)
- [Known limitations](#known-limitations)

---

## What it does

### For participants
- **Passwordless registration** with name, academic year (Second/Third Year), and register number. Register numbers are normalized so `21CS043` and `21cs43` resolve to the same identity.
- **Mandatory instructions** and an acknowledgement checkbox before the challenge list unlocks.
- **Challenge selection** — full briefs stay hidden until the session starts.
- **Live 45-minute session** with a circular countdown, the complete brief, and a surprise-task panel.
- **Automatic completion** when the server deadline passes — even if the tab was closed.
- **Resume support** — re-entering the same register number re-links a live session (new browser included).
- **Browser notifications** at the 15, 30 and 45 minute checkpoints (tab must stay open; see [limitations](#known-limitations)).

### For coordinators
- **Admin login** restricted to accounts with the `admin` role in `app_metadata`.
- **Live dashboard** auto-refreshing every 10 seconds with registered/running/paused/completed counts.
- **Participants table** with challenge, status, remaining time, and **start/end times in IST**.
- **Pause / resume** any running session; resumed sessions get their deadline shifted by the paused duration.
- **Surprise tasks** — one default per challenge, editable before saving as a draft, then published to the participant instantly.
- **Search** by name or register number.

---

## Screens & routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Landing page, challenge preview, entry points |
| `/register` | Public | Anonymous sign-in + registration/resume |
| `/challenges` | Participant | Instructions, acknowledgement, challenge picker |
| `/session` | Participant | Countdown, brief, surprise task |
| `/recovery/awaiting` | Participant | Static waiting screen for manual recovery |
| `/admin/login` | Public | Coordinator sign-in |
| `/admin` | Admin only | Live dashboard |
| `*` | Public | 404 |

---

## The six challenges

1. **The Court of Bad Decisions** ⚖️ — questionable life choices, put on trial.
2. **Inanimate Objects Have Opinions** 🪑 — your belongings finally speak up.
3. **SayLess: A Communication Companion** 💬 — visual cards that become complete messages.
4. **Typing Racer with Personality** ⌨️ — a typing trainer that roasts your performance.
5. **Rage-Quit Obstacle Course** 🧨 — a platformer that refuses to behave.
6. **College Chaos Simulator** 🎒 — survive one day of college with three resources.

Full briefs (scenario, requirements, worked example) live in [`src/data/challenges.ts`](src/data/challenges.ts) and render only after a session starts.

> **Surprise tasks are intentionally not in the client bundle.** One default task per challenge lives in the admin-only `challenge_surprise_templates` table.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| UI | React 18 + TypeScript |
| Build | Vite 6 |
| Styling | Tailwind CSS 3 (custom `vf-*` design tokens) |
| Routing | React Router 7 |
| State | Zustand |
| Icons | lucide-react |
| Dates | date-fns / date-fns-tz (`Asia/Kolkata`) |
| Backend | Supabase (Postgres, Auth, PostgREST, Realtime) |
| Hosting | Vercel (static SPA) |

---

## Architecture

```
┌──────────────────────────────┐
│  Browser (React + Vite SPA)  │
│  · anonymous Supabase auth   │
│  · countdown display only    │
└──────────────┬───────────────┘
               │ HTTPS (anon key + JWT)
┌──────────────▼───────────────┐
│  Supabase                    │
│  · PostgREST (RLS enforced)  │
│  · Auth (anonymous role)     │
│  · Realtime (surprise tasks) │
│  · Postgres functions:       │
│    register_participant()    │
│    start_session()           │
│    pause_session()           │
│    resume_session()          │
│    finalize_expired_sessions()│
│    server_now()              │
└──────────────────────────────┘
```

All privileged state transitions run in Postgres (`SECURITY DEFINER` functions). The client never sets a deadline, status, or timestamp.

---

## Session lifecycle

```
pending_challenge
      │  start_session(challenge_number)
      ▼
    active ──pause_session()──▶ paused
      │                          │
      │◀──── resume_session() ───┘
      │
      │ deadline reached (any client/admin refresh, or participant page)
      ▼
  completed
```

- `finalize_expired_sessions()` moves every overdue `active` session to `completed` and stamps `ended_at`.
- It runs when the participant page hits zero and on every admin dashboard refresh — so status is correct even if the participant closed their browser.
- Paused sessions are not finalized while paused.

---

## Server-authoritative timing

The timer **cannot** be influenced by the participant's device clock.

| Concern | Where it is enforced |
| --- | --- |
| Start time & deadline | `start_session()` sets `started_at = now()` and `deadline_at = now() + 45 minutes` |
| Pause | `pause_session()` sets `paused_at = now()` |
| Resume | `resume_session()` adds `now() - paused_at` to `deadline_at` and records `total_paused_seconds` |
| Completion | `finalize_expired_sessions()` compares `deadline_at <= now()` in Postgres |
| Countdown display | `server_now()` RPC → client applies a clock offset so a wrong device clock doesn't skew the display |
| Direct writes | RLS denies participants any `UPDATE` on `sessions` |

Even if a participant edits the deadline in DevTools, the server keeps and enforces the real one.

---

## Data model

| Table | Purpose |
| --- | --- |
| `participants` | Name, year, register number, normalized register number |
| `participant_identities` | Links anonymous auth users to participants (one active identity per participant) |
| `sessions` | Status, `started_at`, `deadline_at`, `ended_at`, `paused_at`, `total_paused_seconds` |
| `challenges` | Six official challenges (catalogue) |
| `challenge_surprise_templates` | **Admin-only** default surprise task per challenge |
| `surprise_tasks` | Draft → published → acknowledged → completed (one per session) |
| `milestone_events` | 15/30/45-minute checkpoints for local notifications |
| `recovery_requests` | Schema exists; admin UI intentionally removed |
| `session_events`, `audit_logs` | Audit trail tables |
| `evaluations`, `notification_deliveries`, `push_subscriptions`, `surprise_task_versions` | Reserved for future scoring/push work |

### RPCs

| Function | Caller | Returns |
| --- | --- | --- |
| `register_participant(name, year, reg_no, normalized)` | authenticated | `{ status, route, participant_id }` |
| `start_session(challenge_number)` | authenticated | session row as JSON |
| `pause_session(session_id)` | admin | boolean |
| `resume_session(session_id)` | admin | boolean |
| `finalize_expired_sessions()` | anon/authenticated | number of sessions closed |
| `server_now()` | anon/authenticated | current server timestamp |

---

## Security model

- **RLS is enabled on every table.**
- Participants can only read their own participant row, identity, session, surprise tasks, and milestone schedule.
- Participants **cannot** update sessions or read draft surprise tasks.
- Admin authorization trusts **only** `app_metadata.role` / `app_metadata.claims_admin` — never `user_metadata`, which users can edit themselves.
- The anon/publishable key is safe to ship **because RLS is enabled**. The service-role key is server-only and must never be prefixed with `VITE_`.
- `.env` is gitignored and was never committed. `.env.example` contains placeholders only.
- Surprise-task templates are readable only by admins; participants receive `[]` if they query the table directly.

---

## Local setup

### Prerequisites
- Node.js 20+
- A Supabase project
- `psql` (for migrations)

### 1. Clone and install

```bash
git clone https://github.com/JustAStuff/VibeForge_event_sympo.git
cd VibeForge_event_sympo
npm install
```

### 2. Environment

```bash
cp .env.example .env
```

Fill in:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

Add `DATABASE_URL` if you plan to run migrations from the CLI.

### 3. Supabase project setup

1. Create a project at <https://supabase.com>.
2. **Authentication → Providers → Anonymous** → enable.
3. Apply the migrations (order matters):

```bash
export DATABASE_URL="postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres"

for f in supabase/migrations/*.sql; do
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done
```

4. Promote your coordinator account (see [Admin account](#admin-account)).

### 4. Run

```bash
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build → dist/
npm run preview    # serve the production build
```

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | `tsc -b` + Vite production build |
| `npm run preview` | Preview `dist/` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (no test suite is included yet) |

---

## Database migrations

| File | What it does |
| --- | --- |
| `001_initial_schema.sql` | Tables, enums, indexes, constraints |
| `002_rls.sql` | Enables RLS, policies, `is_admin()` / `current_participant_id()` |
| `003_seed_challenges.sql` | Seeds the six challenges |
| `004_finalize_expired_sessions.sql` | Overdue-session finalizer |
| `005_start_session.sql` | Server-computed start/deadline + milestone inserts |
| `006_register_participant.sql` | Atomic registration/resume under RLS |
| `007_pause_resume.sql` | Admin pause/resume with deadline compensation |
| `008_surprise_templates.sql` | Admin-only default surprise tasks |
| `009_server_now.sql` | Server clock RPC for accurate display |

> Migrations `001` and `003` are written for a fresh database. Do not re-run them on a populated project.

### Wiping participant data between events

```sql
TRUNCATE TABLE
  public.audit_logs, public.session_events, public.notification_deliveries,
  public.push_subscriptions, public.milestone_events, public.surprise_task_versions,
  public.surprise_tasks, public.evaluations, public.recovery_requests,
  public.participant_identities, public.sessions, public.participants
RESTART IDENTITY CASCADE;

DELETE FROM auth.users WHERE is_anonymous = true;
```

Challenges and the six surprise templates are preserved.

---

## Admin account

1. Create the user in **Supabase → Authentication → Users** (email + password).
2. Grant the coordinator role:

```sql
UPDATE auth.users
SET raw_app_meta_data =
  COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
WHERE email = 'coordinator@college.edu';
```

3. Sign in at `/admin/login`.

Removing the role takes effect on the next sign-in (the JWT carries `app_metadata`).

---

## Coordinator workflow

1. **Monitor** the Participants tab — it refreshes every 10 s.
2. **Pause/Resume** any running session from the row actions. The clock freezes and the deadline is shifted on resume.
3. **Surprise task**:
   - Click **Surprise** on a participant row.
   - The modal is pre-filled with that challenge's default task (from the admin-only table).
   - Edit if needed → **Save draft**.
   - In the **Surprise tasks** tab → **Publish to participant**.
   - The participant sees it immediately (Realtime, with a 15 s polling fallback).
   - Once published, the row shows **Task sent** and cannot be re-sent.
4. **After the event**, wipe participant data if the app will be reused.

---

## Deployment on Vercel

1. Import `JustAStuff/VibeForge_event_sympo` into Vercel.
2. Framework preset: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
3. Environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. `vercel.json` already rewrites all routes to `index.html`, so `/admin`, `/session`, etc. work on refresh.
5. In Supabase → **Authentication → URL Configuration**, add your Vercel domain as the Site URL.

Do **not** add the service-role key to Vercel as a `VITE_` variable. This app does not need it at runtime.

---

## Capacity: 200 participants

Both free tiers are sufficient for a one-day event.

**Supabase Free**
- DB size stays well under 30 MB; the limit is 500 MB.
- Egress: roughly 1,000 small requests per participant over 45 minutes → on the order of **< 1 GB** for 200 people (limit 5 GB/month).
- ⚠️ Realtime allows **200 concurrent connections**. The session page opens one channel per participant; the 15 s polling fallback keeps surprise tasks working even if Realtime is saturated.
- ⚠️ Free projects pause after 7 days of inactivity — open the project before the event.
- No point-in-time backups on free; export a dump afterwards if records are needed.

**Vercel Hobby**
- Static SPA, ~140 KB gzipped. Even 20 reloads × 200 participants is under 1 GB (limit 100 GB/month).
- No serverless functions are used.
- ⚠️ Hobby is for non-commercial use.

---

## Project structure

```
├── public/                     # manifest + icon
├── src/
│   ├── components/
│   │   ├── shared/             # Page shell, challenge icons, instructions, milestone watcher
│   │   └── ui/                 # Button, Input, Dialog, StatusBadge, Loading, Card
│   ├── data/challenges.ts      # Six participant-facing briefs (no surprise tasks)
│   ├── lib/
│   │   ├── notifications.ts    # Web Notifications + milestone templates
│   │   ├── supabase.ts         # Supabase client
│   │   └── utils.ts            # IST formatting, countdown, status helpers
│   ├── pages/
│   │   ├── admin/              # Login + live dashboard
│   │   ├── HomePage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ChallengeSelectPage.tsx
│   │   ├── SessionPage.tsx
│   │   ├── RecoveryAwaitingPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── stores/                 # Zustand auth + participant stores
│   ├── types/
│   ├── App.tsx                 # Routes + guards
│   └── index.css
├── supabase/migrations/        # 001–009
├── vercel.json                 # SPA rewrites
├── tailwind.config.js          # vf-* design tokens
└── .env.example
```

---

## Known limitations

- **Notifications require the tab to stay open.** There is no service worker/Web Push implementation, so nothing fires after the tab or browser is closed.
- **Realtime is best-effort on free tier.** Surprise tasks also poll every 15 s.
- **Recovery is manual.** The admin recovery UI was removed and there is no participant request form; extend a live session by re-entering the same register number.
- **No automated judging.** The evaluation rubric tables exist but no scoring UI is shipped.
- **No multi-event isolation.** The app assumes one event per Supabase project; wipe data between events.

---

Built for a college symposium. **Think. Prompt. Build. Debug. VibeForge.**
