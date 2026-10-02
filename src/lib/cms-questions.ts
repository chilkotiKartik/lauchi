import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { gradeAnswer, describeAnswer, type Given, type Kind } from "@/lib/cms-questions-core";

export * from "@/lib/cms-questions-core";

/** A published question as students may see it: no answer, no explanation, no steps. */
export type PublicQuestion = {
  id: string; course: string; unit: number; kind: Kind; stem: string; options: string[]; difficulty: number; tags: string[];
};
export const PUBLIC_COLS = "id,course,unit,kind,stem,options,difficulty,tags";

type PublicRow = Omit<PublicQuestion, "options" | "tags"> & { options: unknown; tags: unknown };
export const toPublicQuestion = (r: PublicRow): PublicQuestion => ({
  id: r.id, course: r.course, unit: Number(r.unit), kind: r.kind, stem: r.stem,
  options: Array.isArray(r.options) ? r.options.map(String) : [], difficulty: Number(r.difficulty), tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
});

/** Published questions for one subject and unit, oldest first, WITHOUT their answers (those come back only from gradeCmsAnswer).
 * Server-only, service role, never cached: a question published (or unpublished) a moment ago shows up (or goes) at once. */
export async function fetchPublishedQuestions(course: string, unit: number, limit = 20): Promise<PublicQuestion[]> {
  if (!/^[A-Z]{2,3}-[0-9]{3}$/.test(course) || !Number.isInteger(unit) || unit < 1 || unit > 12) return [];
  try {
    const { data, error } = await createAdminClient().from("cms_questions").select(PUBLIC_COLS)
      .eq("status", "published").eq("course", course).eq("unit", unit).order("created_at", { ascending: true }).limit(Math.min(Math.max(1, limit), 200));
    return error || !data ? [] : (data as PublicRow[]).map(toPublicQuestion);
  } catch { return []; }
}

export type GradeOutcome =
  | { ok: true; correct: boolean; right: string; rightIdx: number[]; explanation: string; steps: string[]; course: string; unit: number }
  | { ok: false; error: string };

/** Grades one answer on the server and only now reveals the key. Does not record anything; see answerCmsQuestion in /bank/actions. */
export async function gradeCmsAnswer(id: string, given: Given): Promise<GradeOutcome> {
  try {
    const { data, error } = await createAdminClient().from("cms_questions")
      .select("id,course,unit,kind,options,answer,explanation,steps,status").eq("id", id).eq("status", "published").limit(1);
    const r = (data ?? [])[0] as { course: string; unit: number; kind: Kind; options: unknown; answer: unknown; explanation: string; steps: unknown } | undefined;
    if (error || !r) return { ok: false, error: "That question isn't available any more." };
    const options = Array.isArray(r.options) ? r.options.map(String) : [];
    return {
      ok: true, correct: gradeAnswer(r.kind, r.answer, given), right: describeAnswer(r.kind, options, r.answer),
      rightIdx: Array.isArray(r.answer) ? (r.answer as number[]) : typeof r.answer === "number" ? [r.answer] : [],
      explanation: r.explanation ?? "", steps: Array.isArray(r.steps) ? r.steps.map(String) : [], course: r.course, unit: Number(r.unit),
    };
  } catch { return { ok: false, error: "We couldn't check that right now. Try again." }; }
}
