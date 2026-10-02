import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOnboarded } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ownedClass } from "@/lib/classes-server";
import { normaliseOverview, normaliseRoster } from "@/lib/classes";
import { courseOptions, unitLabel, courseLabel } from "@/app/admin/data";
import { InviteCode } from "@/components/classes/InviteCode";
import { RosterTable } from "@/components/classes/RosterTable";
import { WeakAreas } from "@/components/classes/WeakAreas";
import { ArchiveButton } from "@/components/classes/ArchiveButton";
import "@/components/classes/classes.css";

export const metadata: Metadata = { title: "Class dashboard" };

/** Teacher dashboard. Only the owner gets this page: anyone else (including students in the class) gets a 404. */
export default async function ClassDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await requireOnboarded();
  const { id } = await params;
  const cls = await ownedClass(supabase, user.id, id);
  if (!cls) notFound();

  const db = createAdminClient();
  const [roster, overview] = await Promise.all([
    db.rpc("class_roster_stats", { p_owner: user.id, p_class: cls.id }),
    db.rpc("class_overview", { p_owner: user.id, p_class: cls.id }),
  ]);
  const failed = !!roster.error || !!overview.error;
  const rows = normaliseRoster(roster.data);
  const ov = normaliseOverview(overview.data);

  const opts = courseOptions();
  const labels: Record<string, string> = {};
  for (const w of [...ov.weak, ...rows.flatMap((r) => r.weakest)]) {
    const t = unitLabel(opts, w.course, w.unit);
    labels[`${w.course}:${w.unit}`] = `${courseLabel(opts, w.course)} · U${w.unit}${t ? ` ${t}` : ""}`;
  }

  const stats: [string, string][] = [
    ["Students", String(ov.members)], ["Active this week", `${ov.active7}/${ov.members}`], ["Avg XP, 7 days", String(ov.avg_xp7)],
    ["Quizzes, 7 days", String(ov.quizzes7)], ["Class accuracy", ov.accuracy === null ? "–" : `${ov.accuracy}%`],
  ];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <Link href="/classes" className="text-sm font-extrabold">← All classes</Link>
        <h1 className="text-3xl">{cls.name}</h1>
        <p className="text-muted">{cls.course ? `${cls.course} · ` : ""}{cls.archived ? "Archived" : "Active"}</p>
      </header>
      {failed && <p className="err" role="alert">We couldn&apos;t load all the numbers. Refresh to try again.</p>}

      <section className="card" aria-labelledby="invite"><h2 id="invite" className="mb-3 text-xl">Invite students</h2><InviteCode classId={cls.id} code={cls.invite_code} archived={cls.archived} /></section>

      <section className="card flex flex-col gap-3" aria-labelledby="perf">
        <h2 id="perf" className="text-xl">How the class is doing</h2>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-5" data-testid="summary">
          {stats.map(([k, v]) => <div key={k} className="cls-stat"><b>{v}</b><span>{k}</span></div>)}
        </dl>
      </section>

      <section className="card flex flex-col gap-3" aria-labelledby="weak">
        <h2 id="weak" className="text-xl">Weak areas</h2>
        <p className="text-sm text-muted">Units where the class gets the fewest questions right. Good topics to revise together.</p>
        <WeakAreas units={ov.weak} labels={labels} />
      </section>

      <section className="card flex flex-col gap-3" aria-labelledby="roster">
        <h2 id="roster" className="text-xl">Students</h2>
        <RosterTable classId={cls.id} rows={rows} weakLabels={labels} />
      </section>

      <section className="card flex flex-col gap-2" aria-labelledby="manage">
        <h2 id="manage" className="text-xl">Manage class</h2>
        <ArchiveButton classId={cls.id} archived={cls.archived} />
      </section>
    </div>
  );
}
