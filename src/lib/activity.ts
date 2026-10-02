import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { visibleCourses } from "@/lib/stream";
import { listCourses, getCourse } from "@/lib/syllabus";
import { courseUnits } from "@/lib/quiz";
import type { EventRow, SessionRow } from "@/lib/insights";

/** The student's own recent quiz sessions and XP events. RLS limits both to their rows; the seed and answers are never selected. */
export async function loadActivity(supabase: SupabaseClient) {
  const [s, e] = await Promise.all([
    supabase.from("quiz_sessions").select("course,unit,kind,total,correct,submitted_at").order("created_at", { ascending: false }).limit(500),
    supabase.from("xp_events").select("kind,xp,created_at").order("created_at", { ascending: false }).limit(500),
  ]);
  return { sessions: (s.data ?? []) as SessionRow[], events: (e.data ?? []) as EventRow[] };
}

/** Topics in the subjects that have quizzes: the pool "syllabus covered" is measured against. */
export function quizzedTopics(branch?: string | null): { total: number; courses: number } {
  let total = 0, courses = 0;
  for (const c of visibleCourses(branch, listCourses())) {
    const units = courseUnits(c.code);
    if (!units.length) continue;
    courses++;
    const full = getCourse(c.code);
    for (const n of units) total += full?.units[n - 1]?.topics.length ?? 0;
  }
  return { total, courses };
}
