# lockin. - deployment guide (CSE, AI&ML, BCA)

## 1. Supabase (database + auth + storage)
**New empty project:** SQL Editor -> paste `deploy/supabase-all-migrations.sql` -> Run (once).
**Your existing "lockin" project** (already has migrations 0001-0007 + resources 0014): paste `deploy/supabase-upgrade-existing-lockin.sql` -> Run. It adds push, social, admin, papers, branch rule (CSE/AIML/BCA), daily challenge + streak freezes + goals, classes, doubts + exam planner, CMS questions and lessons.
Then: Authentication -> URL Configuration: Site URL = your deployed URL, Redirect URLs += `https://YOUR-DOMAIN/**`. Authentication -> Providers: Email ON (SMTP: configure your own for production volume, the built-in sender is rate limited). Storage: bucket `resources` is created by the SQL (private).
Project Settings -> API: copy the project URL, anon key, service_role key.

## 2. Environment variables (Vercel -> Settings -> Environment Variables) - see `.env.example`
Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only, never `NEXT_PUBLIC_`), `NEXT_PUBLIC_SITE_URL`.
Recommended: `GEMINI_API_KEY` (AI tutor, photo check, AI first answer in Doubt box), `YOUTUBE_API_KEY` (in-app videos), `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` + `VAPID_SUBJECT` (`npx web-push generate-vapid-keys`), `CRON_SECRET`, `NEXT_PUBLIC_OPERATOR_NAME`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_GRIEVANCE_EMAIL`.

## 3. Deploy on Vercel
Import the repo (framework Next.js, defaults). Build command `npm run build`. Node 20+. Add the env vars, deploy.
Local check before pushing: `npm ci && npm run typecheck && npm run lint && npm test && npm run build`.

## 4. Reminders (daily challenge, streak, exam, study-time pushes)
Call `GET https://YOUR-DOMAIN/api/cron/reminders` every 30 minutes with header `Authorization: Bearer $CRON_SECRET` (Vercel Cron, cron-job.org or GitHub Actions).

## 5. Admin and teachers
Admin login = normal sign-in (email link) with an account that is in `public.admins`; the server re-checks on every page and action (non-admins get 404). Make yourself admin once:
```sql
insert into public.admins (user_id) select id from auth.users where email = 'you@example.com';
```
Then open `/admin`: Questions, Lessons, Lab content, Notes & files, Subjects, Doubts, Teachers (grant teacher access by email so they can create classes), Stats, Reports. Publish/unpublish is live for students immediately.

## 6. Load (about 10k users)
Quiz/XP logic is in SQL functions; pages are server-rendered per user. Use the Supabase Pro plan if you expect >500 concurrent users (connection limits), keep Vercel region near your Supabase region (ap-south-1 / Mumbai), set up your own SMTP for sign-in emails.

## 7. Notes
- Large PDFs (>4.5 MB) cannot go through a Vercel function body; upload them to the `resources` bucket in the Supabase dashboard or keep files small.
- `CSP` allows YouTube (nocookie) and your Supabase origin only.
