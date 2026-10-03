import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PathUnit } from "@/components/learn/SubjectPath";
import type { Course } from "@/lib/syllabus";
import { doneTopics } from "@/lib/progress";
import { loadActivity } from "@/lib/activity";
import { allUnitStats } from "@/lib/mock-units";
import { canSeeLab } from "@/lib/stream";
import { labsFor } from "@/labs/registry";
import { GEN } from "@/content/gen.generated.cjs";
import { chestReady, starsFor } from "@/lib/subject-progress";

// dark enough for white text (all ≥ 4.8:1)
const UNIT_COLORS = ["#157a37", "#1476b8", "#8a4fd6", "#b33c0b", "#8a6508", "#0b7069", "#c2303a", "#4a5a63"];

/** A subject's level path from the student's real data: topics read, practice stars, finished labs, opened chests. */
export async function loadSubjectPath(supabase: SupabaseClient, user: { id: string; branch: string | null; semester: number | null }, c: Course): Promise<{ units: PathUnit[]; done: Map<string, number>; hasQuiz: boolean }> {
  const [done, { sessions }, labRows, chestRows] = await Promise.all([
    doneTopics(supabase), loadActivity(supabase),
    supabase.from("lab_progress").select("lab").then((r) => new Set(((r.data ?? []) as { lab: string }[]).map((x) => x.lab))),
    supabase.from("xp_events").select("ref").like("ref", `chest:${c.code}:%`).then((r) => new Set(((r.data ?? []) as { ref: string }[]).map((x) => x.ref))),
  ]);
  const stats = await allUnitStats(user.id, sessions);
  const units: PathUnit[] = c.units.map((u, i) => {
    const st = stats.find((x) => x.course === c.code && x.unit === u.n && x.attempts > 0);
    const lab = labsFor(c.code, u.n).find((l) => canSeeLab(user, l));
    const pct = st ? st.pct : null;
    return {
      n: u.n, title: u.title, color: UNIT_COLORS[i % UNIT_COLORS.length],
      read: { done: u.topics.filter((_, k) => done.has(`${c.code}:${u.n}:${k + 1}`)).length, total: u.topics.length },
      practice: { available: (GEN[c.code]?.[u.n]?.length ?? 0) > 0, pct, stars: starsFor(pct), attempts: st?.attempts ?? 0 },
      lab: lab ? { id: lab.id, title: lab.title, done: labRows.has(lab.id) } : null,
      chest: { ready: chestReady(pct), opened: chestRows.has(`chest:${c.code}:${u.n}`) },
    };
  });
  return { units, done, hasQuiz: units.some((u) => u.practice.available) };
}
