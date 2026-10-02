import "server-only";
import { visibleCourses } from "@/lib/stream";
import { listCourses, getCourse } from "@/lib/syllabus";
import { doneTopics } from "@/lib/progress";
import { loadActivity } from "@/lib/activity";
import { allUnitStats } from "@/lib/mock-units";
import type { PlanUnit } from "@/lib/plan";
import type { getSession } from "@/lib/auth";

type Sess = NonNullable<Awaited<ReturnType<typeof getSession>>>;
const semOk = (sem: string, n: number) => /^I or II/.test(sem) || (n === 1 ? /^I\b(?! or)/.test(sem) : /^II\b/.test(sem));

/** Every theory unit of the student's stream and semester with their progress and quiz accuracy (same inputs as the /plan page). */
export async function loadAllUnits(s: Sess): Promise<PlanUnit[]> {
  const [done, { sessions }] = await Promise.all([doneTopics(s.supabase), loadActivity(s.supabase)]);
  const stats = await allUnitStats(s.profile.id, sessions);
  const units: PlanUnit[] = [];
  for (const sub of visibleCourses(s.profile.branch, listCourses())) {
    if (sub.type !== "theory" || !semOk(sub.sem, s.profile.semester ?? 1)) continue;
    const c = getCourse(sub.code); if (!c) continue;
    for (const u of c.units) {
      const st = stats.find((x) => x.course === c.code && x.unit === u.n);
      units.push({ course: c.code, short: c.short, unit: u.n, title: u.title, topics: u.topics.length,
        done: u.topics.filter((_, i) => done.has(`${c.code}:${u.n}:${i + 1}`)).length, accuracy: st ? st.pct / 100 : null });
    }
  }
  return units;
}

/** The units in scope: the student's saved choice, or everything until they choose. */
export async function loadScope(s: Sess, all: PlanUnit[]): Promise<{ units: PlanUnit[]; chosen: Set<string> | null }> {
  const { data } = await s.supabase.from("exam_plan_items").select("course,unit").limit(500);
  const rows = (data ?? []) as { course: string; unit: number }[];
  if (!rows.length) return { units: all, chosen: null };
  const chosen = new Set(rows.map((r) => `${r.course}:${r.unit}`));
  const units = all.filter((u) => chosen.has(`${u.course}:${u.unit}`));
  return { units: units.length ? units : all, chosen: units.length ? chosen : null };
}
