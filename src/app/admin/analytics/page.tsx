import type { Metadata } from "next";
import Link from "next/link";
import { normaliseAnalytics, requireAdmin, type Analytics } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { courseLabel, courseOptions, unitLabel } from "@/app/admin/data";

export const metadata: Metadata = { title: "Analytics" };

const accColour = (p: number) => (p < 50 ? "var(--red)" : p < 70 ? "var(--gold-d)" : "var(--green)");
const dayLabel = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

export default async function AdminAnalytics({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requireAdmin();
  const days = (await searchParams).days === "30" ? 30 : 7;
  const opts = courseOptions();
  let a: Analytics | null = null;
  try {
    const { data, error } = await createAdminClient().rpc("admin_analytics", { p_days: days });
    if (!error) a = normaliseAnalytics(data);
  } catch { /* shown below */ }

  const maxDay = Math.max(1, ...(a?.daily ?? []).map((d) => d.students ?? 0));
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <h1 className="text-3xl">Analytics</h1>
          <p className="text-muted">Anonymous totals from quiz answers. Any group with fewer than 5 students is hidden, so no one can be singled out.</p>
        </div>
        <nav aria-label="Time range" className="flex gap-2">
          <Link href="/admin/analytics" className="adm-tab" aria-current={days === 7 ? "page" : undefined}>Last 7 days</Link>
          <Link href="/admin/analytics?days=30" className="adm-tab" aria-current={days === 30 ? "page" : undefined}>Last 30 days</Link>
        </nav>
      </header>

      {!a ? <p className="err" role="alert">We couldn&apos;t load analytics. Check that the database is reachable and refresh.</p> : (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Totals">
            <Stat label="Active students" value={a.totals.students} />
            <Stat label="Quizzes started" value={a.totals.quizzes} />
            <Stat label="Units with data" value={a.units.length} />
            <Stat label="Reported questions" value={a.top_reported.length} />
          </section>

          <section className="card flex flex-col gap-3" aria-labelledby="weak-h">
            <h2 id="weak-h" className="text-xl">Weakest units first</h2>
            {a.units.length === 0 ? <p className="text-muted">Not enough students yet. A unit appears here once at least {a.k} students have answered its questions in this period.</p> : (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <caption className="sr-only">Accuracy by subject and unit, last {a.days} days, weakest first</caption>
                  <thead><tr><th scope="col">Subject</th><th scope="col">Unit</th><th scope="col" className="num">Accuracy</th><th scope="col" className="num">Answers</th><th scope="col" className="num">Students</th></tr></thead>
                  <tbody>
                    {a.units.map((u) => (
                      <tr key={`${u.course}:${u.unit}`}>
                        <td><b className="text-head">{courseLabel(opts, u.course)}</b> <span className="text-xs text-muted">{u.course}</span></td>
                        <td>Unit {u.unit}{unitLabel(opts, u.course, u.unit) ? <span className="block text-xs text-muted">{unitLabel(opts, u.course, u.unit)}</span> : null}</td>
                        <td className="num">
                          <span className="flex items-center justify-end gap-2">
                            <span className="adm-acc" aria-hidden><i style={{ width: `${u.accuracy}%`, background: accColour(u.accuracy) }} /></span>
                            <b className="text-head">{u.accuracy}%</b>
                          </span>
                        </td>
                        <td className="num">{u.attempts.toLocaleString("en-IN")}</td>
                        <td className="num">{u.students.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="card flex flex-col gap-3" aria-labelledby="daily-h">
            <h2 id="daily-h" className="text-xl">Active students per day</h2>
            <div className="adm-days" role="img" aria-label={`Active students per day: ${a.daily.map((d) => `${dayLabel(d.day)} ${d.students ?? "fewer than " + a.k}`).join(", ")}`}>
              {a.daily.map((d, i) => (
                <div key={d.day} title={`${dayLabel(d.day)}: ${d.students ?? `fewer than ${a.k}`}`}>
                  <i className={d.students === null ? "few" : undefined} style={{ height: `${d.students === null ? 6 : Math.max(4, (d.students / maxDay) * 100)}%`, animationDelay: `${i * 25}ms` }} />
                </div>
              ))}
            </div>
            <p className="flex justify-between text-xs text-muted"><span>{a.daily[0] ? dayLabel(a.daily[0].day) : ""}</span><span>Striped = fewer than {a.k} students</span><span>{a.daily.at(-1) ? dayLabel(a.daily.at(-1)!.day) : ""}</span></p>
          </section>

          <section className="card flex flex-col gap-3" aria-labelledby="rep-h">
            <h2 id="rep-h" className="text-xl">Most reported questions</h2>
            {a.top_reported.length === 0 ? <p className="text-muted">No reports in this period.</p> : (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead><tr><th scope="col">Where</th><th scope="col">Ref</th><th scope="col" className="num">Reports</th><th scope="col" className="num">Open</th></tr></thead>
                  <tbody>
                    {a.top_reported.map((r) => (
                      <tr key={`${r.source}:${r.ref}`}>
                        <td className="whitespace-nowrap">{r.source}{r.course ? ` · ${courseLabel(opts, r.course)}${r.unit ? ` U${r.unit}` : ""}` : ""}</td>
                        <td className="break-all"><code>{r.ref}</code></td>
                        <td className="num">{r.reports}</td>
                        <td className="num">{r.open}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Link href="/admin/reports" className="w-fit font-extrabold">Open the reports inbox</Link>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="card flex flex-col gap-1 !p-4">
      <span className="text-xs font-black uppercase tracking-wide text-muted">{label}</span>
      <b className="text-2xl tabular-nums text-head">{value === null ? "<5" : value.toLocaleString("en-IN")}</b>
    </div>
  );
}
