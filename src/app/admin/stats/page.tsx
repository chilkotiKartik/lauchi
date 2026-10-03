import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Stats" };

type Raw = { students?: number; by_branch?: Record<string, number>; dau?: number; wau?: number; quizzes_per_day?: Record<string, number>; open_reports?: number; resources?: number; lessons_published?: number; lab_questions_published?: number; today?: string };
type Stats = { raw: Raw; daily: { table: string; total: number; week: number | null } | null; at: number };

let cache: Stats | null = null;
const TTL = 60_000;

/** Counts via the service role, cached in memory for 60 seconds so refreshing the page never hammers the database. */
async function load(): Promise<Stats | null> {
  if (cache && Date.now() - cache.at < TTL) return cache;
  const db = createAdminClient();
  const { data, error } = await db.rpc("admin_stats");
  if (error || !data) return cache; // stale numbers beat an empty page
  // finished daily 5-question challenges (migration 0015): all time and in the last 7 days
  let daily: Stats["daily"] = null;
  const head = { count: "exact" as const, head: true };
  const [all, wk] = await Promise.all([
    db.from("daily_challenges").select("user_id", head).not("completed_at", "is", null),
    db.from("daily_challenges").select("user_id", head).gte("completed_at", new Date(Date.now() - 7 * 864e5).toISOString()),
  ]);
  if (!all.error && all.count !== null) daily = { table: "daily_challenges", total: all.count, week: wk.error ? null : wk.count };
  cache = { raw: data as Raw, daily, at: Date.now() };
  return cache;
}

const n = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const fmt = (v: number) => v.toLocaleString("en-IN");

function Tile({ label, value, note }: { label: string; value: number | string; note?: string }) {
  return <div className="card flex flex-col gap-0.5"><span className="text-xs font-black uppercase tracking-wide text-muted">{label}</span><b className="text-3xl text-head">{typeof value === "number" ? fmt(value) : value}</b>{note && <span className="text-sm text-muted">{note}</span>}</div>;
}

export default async function AdminStats() {
  await requireAdmin();
  let s: Stats | null = null;
  try { s = await load(); } catch { s = null; }
  if (!s) return (<div className="flex flex-col gap-5"><h1 className="text-3xl">Stats</h1><p className="err" role="alert">We couldn&apos;t load the numbers. Check that the database is reachable and migration 0019 has run, then refresh.</p></div>);
  const r = s.raw;
  const branches = Object.entries(r.by_branch ?? {}).map(([k, v]) => [k, n(v)] as const).sort((a, b) => b[1] - a[1]);
  const maxB = Math.max(1, ...branches.map((b) => b[1]));
  const today = r.today ? new Date(r.today + "T00:00:00Z") : new Date();
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(today.getTime() - (13 - i) * 864e5); const k = d.toISOString().slice(0, 10); return { k, label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }), v: n(r.quizzes_per_day?.[k]) }; });
  const maxD = Math.max(1, ...days.map((d) => d.v));
  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl">Stats</h1>
        <p className="text-muted">Live counts from the database. Updated at most once a minute (last refreshed {new Date(s.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })} IST).</p>
      </header>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Totals">
        <Tile label="Students" value={n(r.students)} note="finished sign-up" />
        <Tile label="Active today" value={n(r.dau)} note="DAU" />
        <Tile label="Active this week" value={n(r.wau)} note="WAU, last 7 days" />
        <Tile label="Open reports" value={n(r.open_reports)} />
        <Tile label="Notes & files" value={n(r.resources)} note="visible to students" />
        <Tile label="Published lessons" value={n(r.lessons_published)} />
        <Tile label="Published lab questions" value={n(r.lab_questions_published)} />
        {s.daily && <Tile label="Daily challenges done" value={s.daily.total} note={s.daily.week !== null ? `${fmt(s.daily.week)} in the last 7 days` : undefined} />}
      </section>
      <section className="card flex flex-col gap-3" aria-labelledby="st-b">
        <h2 id="st-b" className="text-xl">Students by branch</h2>
        {branches.length === 0 ? <p className="text-muted">No students yet.</p> : (
          <ul className="flex flex-col gap-2">{branches.map(([b, v]) => (
            <li key={b} className="grid grid-cols-[5rem_1fr_3rem] items-center gap-3 text-sm">
              <span className="font-extrabold text-head">{b}</span>
              <span className="adm-acc" aria-hidden><i style={{ width: `${(v / maxB) * 100}%`, background: "var(--blue)" }} /></span>
              <b className="text-right tabular-nums">{fmt(v)}</b>
            </li>))}</ul>)}
      </section>
      <section className="card flex flex-col gap-3" aria-labelledby="st-q">
        <h2 id="st-q" className="text-xl">Quizzes per day, last 14 days</h2>
        <div className="adm-days" role="img" aria-label={`Quizzes per day: ${days.map((d) => `${d.label} ${d.v}`).join(", ")}`}>
          {days.map((d) => <div key={d.k} title={`${d.label}: ${d.v}`}><i style={{ height: `${Math.max(3, (d.v / maxD) * 100)}%` }} /></div>)}
        </div>
        <div className="flex justify-between text-xs text-muted"><span>{days[0].label}</span><span>Peak {fmt(maxD === 1 && days.every((d) => d.v === 0) ? 0 : maxD)}</span><span>{days[13].label}</span></div>
        <table className="sr-only"><caption>Quizzes per day</caption><tbody>{days.map((d) => <tr key={d.k}><th scope="row">{d.label}</th><td>{d.v}</td></tr>)}</tbody></table>
      </section>
    </div>
  );
}
