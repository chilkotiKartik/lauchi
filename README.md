# lockin.

Study app for UTU B.Tech first-year students. Next.js 16 (App Router), TypeScript, Tailwind 4, Framer Motion, Supabase (auth + Postgres + RLS).

## Run it

1. Create a Supabase project. Apply `supabase/migrations/*.sql` in order (SQL editor or `supabase db push`).
2. Supabase → Authentication → URL Configuration: add your site URL and `<site>/auth/callback` to the redirect allow-list.
3. `cp .env.example .env.local` and fill the names listed there (never commit real values).
4. `npm install && npm run dev`

## Tests

| Command | What it checks |
| --- | --- |
| `npm test` | Unit tests (1,500+): lab maths, XP levels, quiz grading, every question template across hundreds of seeds, PYQ-style numericals, study-plan scheduler, insights, flash cards, speech helpers, video search parsing/caching, validation |
| `bash supabase/tests/run.sh` | Applies every migration to a scratch Postgres and runs the RLS / XP-integrity / planning / mock-test tests (needs local Postgres, see the script header for `PGHOST`/`PGPORT`) |
| `npm run build && PW_CHROMIUM=<chromium path> npx playwright test` | Browser tests on phone and desktop viewports against a local stand-in for Supabase (`e2e/supabase-pg.mjs`: a small GoTrue + PostgREST stand-in in front of a REAL Postgres with the real migrations applied) |

The browser tests do not talk to a real Supabase project. Real-project sign-in has to be verified after step 1 above.

## Security model

- Session cookies are HttpOnly, SameSite=Lax, Secure in production; the browser never holds a Supabase client.
- `src/proxy.ts` sets a per-request-nonce CSP and refreshes the session; signed-out users are redirected to `/login`.
- XP is written only by `award_xp()` (SECURITY DEFINER, not executable by clients): duplicate events are ignored and there is a daily cap.

## What is in the app

Dashboard (with a daily motivation boost), Learn (syllabus → unit → topic, read-aloud, in-page lectures), **PYQ bank** (400+ previous-year questions for Physics, Chemistry, Electrical, Electronics and Mechanical, ranked by how often they were asked, with predicted must-do topics, filters, practised ticks, read-aloud, lectures and Ask Lochi links), **Focus timer** (Pomodoro with calm sound), Practice quizzes, Mock tests (20 questions across a whole subject, 30 minutes, no answers until you submit), Syllabus (search across 1,000+ topics), Formula cards (3D flip cards), Study plan (built from your exam date and daily hours, reschedules itself), Video lectures (played inside the app from YouTube search when `YOUTUBE_API_KEY` is set, cached for a day; otherwise a YouTube search link), Mistakes notebook (each with read-aloud, an explainer video and Ask Lochi), wrong-answer coaching in quizzes (explainer video in place, re-read the unit, 3D lab, PYQs, Ask Lochi), combo streaks, sound effects and optional spoken feedback, voice answers for numericals, a level-up celebration, Daily quests, Progress (readiness score, weak units, badges), Settings (theme, sound, voice, reading speed and accent, calm mode, goals, exam date, export JSON, delete account), Assignments (10 questions per unit, resumable, graded on submit, XP once per unit), Papers & PYQs (links to the university's own paper portal), Marks & SGPA (what you need in the end sem), Ask Lochi (Gemini, needs `GEMINI_API_KEY`), an opt-in weekly League (first name and weekly XP only), and Live 3D labs. Everything shown is computed from real activity in the database; nothing is placeholder data.

Also built: friends and study groups, teacher classes, a doubt box, an exam planner, a 3-hour paper simulator and an admin panel (content, doubts, reports, stats). Not built yet (needs data or accounts that are not in the repo): Hinglish lesson text and Google sign-in (the env flag exists).

## Live 3D labs

`/labs` lists 282 real-time react-three-fiber labs (including labs that cover every lab blueprint in the five core subjects' PYQ notes: grating resolution, He–Ne laser, polarimeter, solar cell/LED, crystal field, Ellingham, water softening, corrosion, bomb calorimeter, lubrication, NMR, S_N1/S_N2, RC/RL transients, two-wattmeter, transformer tests, PMMC/MI meters, DC machine, torque–slip, transmission, earthing/battery, semiconductor carriers, clipper/clamper, Zener regulator, bias stability, JFET, K-map, truss, ladder, beam SFD/BMD, Pelton wheel, P–V work, four-stroke engine, Otto/Diesel/Dual), one or more for most units of Engineering Maths, Physics, Chemistry, Electrical, Electronics, Mechanical, Programming, Biology, Environment, Engineering Graphics, the Web Development minor (WD-101 to WD-401) and the BCA subjects. Every lab has typed exact values, ready-made experiments, saved setups and share links.

The full list, unit by unit, with controls, experiments and question banks, is in the separate `lockin-content-catalogue.pdf`. The Web Development container-layers lab is a concept lab; nothing in this project needs Docker.

Scene code lives in `src/labs/scenes/*` and is loaded on demand (`next/dynamic`, `ssr: false`). Each canvas pauses when off-screen or when the tab is hidden, caps DPR at 1.25 (1 on weak devices), starts paused under `prefers-reduced-motion`, and shows a text fallback without WebGL. The maths is in `src/labs/math.ts` and `src/labs/sim/*` with unit tests. Every canvas shares one studio: image-based lighting from a procedurally built room (no files or network), soft contact shadows on a bench, and a key light; weak devices get plain lights and no shadows. The landing page hero and dashboard mascot are a live 3D Lochi that falls back to the flat SVG on weak devices, with reduced motion, or without WebGL.

## Content pipelines

- `python3 scripts/build-pyq.py` turns the subject notes in `content/pyq/*.md` (Markdown + LaTeX) into `src/content/pyq/*.json` (plain text with `<sub>`/`<sup>` only). Re-run it after editing the notes.
- `node scripts/build-content.cjs` regenerates the question bank (`content/src/gen_*.js` → `src/content/gen.generated.cjs`). The PYQ-style templates live in `content/src/gen_f.js`.

## Optional keys

| Key | What it switches on |
| --- | --- |
| `GEMINI_API_KEY` | Ask Lochi (AI tutor) |
| `YOUTUBE_API_KEY` | In-app lecture videos (YouTube Data API v3, free quota ≈ 100 searches/day; results are cached 24 h and each student is limited to 40 new searches a day) |

See `ROADMAP.md` for what to build next.

## Database setup (your own Supabase project)

`npm run db:bundle` writes `supabase/all.sql` and `deploy/supabase-all-migrations.sql` (every migration in order). Paste it into Supabase → SQL Editor → Run, then set `SUPABASE_SERVICE_ROLE_KEY` (server-side only) next to the URL and anon key from `.env.example`.
