# Running lockin. for ~10,000 students at once

This describes how the app is built to serve many students at the same time, what is already in place, and the
settings you must switch on in Vercel and Supabase. The last section lists what has **not** been measured yet.

## How a request flows

```
Student's browser
  │  static files (JS, CSS, icons): content-hashed, cached for a year at the CDN edge and in the browser
  ▼
Vercel edge CDN ──► Next.js server functions (autoscale per request; no server to run out of)
                         │  HTTPS (PostgREST / Auth / Storage), never a raw Postgres connection
                         ▼
                   Supabase: PostgREST (pooled) ─► Postgres (RLS on every table)
                             Storage (notes PDFs, streamed through /api/resources with an auth check)
```

* **3D labs cost no extra downloads.** Every lab is drawn from code (procedural geometry), not from model or texture
  files: there are no GLB/GLTF, Draco, Meshopt or KTX2 assets to compress or stream, and the content security policy
  forbids loaders. three.js is one shared chunk (≈255 KB gzipped) cached by the CDN and the browser after the first
  lab; each lab's scene is its own small chunk loaded only when that lab opens.
* **Labs adapt to the device.** `Stage` picks a quality level from the device (cores, memory), caps the pixel ratio
  at 1–1.25, drops detail when the frame rate falls (`PerformanceMonitor`), stops drawing when the lab is off screen
  or paused (`frameloop="never"` / `"demand"`), and disposes GPU resources on unmount. Lab authors follow the
  per-frame budget in `src/labs/AUTHORING.md` (instancing above 40 objects, no allocation per frame).
* **The question generator never reaches the browser.** A unit test (`src/lib/client-imports.test.ts`) fails the
  build if client code imports it, which also keeps answers on the server.
* **No database connection storm.** The app talks to Supabase over HTTP through supabase-js, so serverless
  functions never open Postgres connections themselves; PostgREST keeps its own pool. Hot queries are indexed
  (`xp_events (user_id, created_at)`, `quiz_sessions (user_id, created_at)`, `revise_items (user_id, due)`, …).

## What to switch on before a big launch

1. **Supabase compute.** For ~10k concurrent students start at least on a *Medium* compute add-on and watch
   *Reports → Database* (CPU, connections). Enable *Point-in-time recovery* for backups.
2. **Supabase Auth rate limits.** *Authentication → Rate limits*: keep sign-in and OTP limits on; turn on CAPTCHA
   (hCaptcha/Turnstile) for sign-up if bots appear.
3. **Vercel Firewall.** Add a rate-limit rule (for example 300 requests/min per IP on `/*`, 30/min on `/api/*`)
   and enable *Attack Challenge Mode* during an attack. This is the edge layer in front of the per-user limits below.
4. **Monitoring.** Turn on Vercel Observability (function errors, p95 latency) and Supabase log drains or alerts.
5. **Secrets.** `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, AI and YouTube keys live only in Vercel environment
   variables (never `NEXT_PUBLIC_*`). Rotate them if they ever appear in a log or a screenshot.

## Security controls in the code

| Threat | Control |
| --- | --- |
| XSS | Strict CSP with per-request nonce (`src/proxy.ts`); rich text renders only `<sub><sup><b><i>`; no `dangerouslySetInnerHTML` on user content |
| Clickjacking, sniffing | `X-Frame-Options: DENY`, `nosniff`, COOP/CORP, HSTS (`next.config.ts`) |
| CSRF | Server actions are POST-only with Next's origin check; cookies are `SameSite=Lax`, `HttpOnly`, `Secure` |
| Injection | All database access goes through PostgREST/RPC with parameters; inputs validated with zod |
| IDOR / privilege escalation | Row-level security on every table; XP, grading, lab progress and admin writes only through `security definer` functions callable by the service role after a server-side check; admins checked on the server (`admins` table / `ADMIN_EMAILS`) |
| Token theft | Supabase session in HttpOnly cookies; JWTs verified with `getClaims` (JWKS) |
| API abuse | Per-user daily caps in Postgres (Ask Lochi, answer checks, CMS answers, reviews, 1,500 XP/day), report limits, 10 push subscriptions per student |
| SSRF | Push reminders are only sent to the real browser push services (`isPushEndpoint`) |
| Malicious uploads | Admin-only uploads; type and size checks; files streamed from storage through an authorised route; PDFs rendered with a patched pdf.js (≥ 6.2.108, XFA off) in the student's browser, never executed on the server |
| Dependencies | `npm audit --omit=dev` reports 0 known vulnerabilities (October 2026) |

## Not yet measured

* No load test at 10,000 concurrent users has been run. Before launch, run one against a staging copy (for example
  k6 with 500 → 10,000 virtual users replaying sign-in, dashboard, a quiz and a lab page) and size Supabase compute
  from the result.
* Frame-rate numbers on real low-end phones have not been recorded; the adaptive quality code is in place but
  should be checked on a ₹10k Android phone.
