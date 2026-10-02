import "server-only";
import { requireOnboarded } from "@/lib/auth";
import { getPyq, SHORT, type Pyq } from "@/lib/pyq";
import { PAPER, PAPER_COURSES, genericRubric, partKey, scaleRubric, type PartView, type QuestionView, type RubricPoint } from "@/lib/paper";
import type { AnswerBook, ModelAnswer } from "@/content/answers/types";
import phyAns from "@/content/answers/AHT-001.json";
import chemAns from "@/content/answers/AHT-002.json";
import elexAns from "@/content/answers/ECT-001.json";
import elecAns from "@/content/answers/EET-001.json";
import mechAns from "@/content/answers/MET-001.json";

const BOOKS = { "AHT-001": phyAns, "AHT-002": chemAns, "ECT-001": elexAns, "EET-001": elecAns, "MET-001": mechAns } as unknown as Record<string, AnswerBook>;

export const isPaperCourse = (c: string): c is (typeof PAPER_COURSES)[number] => (PAPER_COURSES as readonly string[]).includes(c);
export const subjectName = (code: string) => getPyq(code)?.name ?? code;
export const shortName = (code: string) => SHORT[code] ?? code;

/** Model answers are being written subject by subject; a missing or malformed entry just means "no model answer yet". */
export function modelAnswer(code: string, id: string): ModelAnswer | null {
  const a = BOOKS[code]?.[id] as Partial<ModelAnswer> | undefined;
  if (!a || !Array.isArray(a.answer) || !a.answer.length || !a.answer.every((x) => typeof x === "string")) return null;
  if (!Array.isArray(a.rubric) || !a.rubric.every((r) => r && typeof r.point === "string" && typeof r.marks === "number")) return null;
  return {
    marks: typeof a.marks === "number" ? a.marks : a.rubric.reduce((s, r) => s + r.marks, 0),
    rubric: a.rubric, answer: a.answer,
    formulas: Array.isArray(a.formulas) ? a.formulas.filter((f) => typeof f === "string") : undefined,
    diagram: typeof a.diagram === "string" ? a.diagram : undefined,
    result: typeof a.result === "string" ? a.result : undefined,
  };
}

export function findPyq(code: string, id: string): { pyq: Pyq; unit: number; unitTitle: string } | null {
  const s = getPyq(code);
  for (const u of s?.units ?? []) { const p = u.pyqs.find((x) => x.id === id); if (p) return { pyq: p, unit: u.n, unitTitle: u.title }; }
  return null;
}

/** The rubric a part is marked against, always out of 10: the model answer's (rescaled) or the general examiner's guide. */
export function rubricFor(code: string, id: string): { rubric: RubricPoint[]; model: ModelAnswer | null } {
  const model = modelAnswer(code, id);
  const scaled = model ? scaleRubric(model.rubric, model.marks, PAPER.partMarks) : [];
  if (scaled.length >= 2) return { rubric: scaled, model };
  return { rubric: genericRubric(findPyq(code, id)?.pyq.kind ?? "theory"), model };
}

/** The question text of a PYQ as it appears in the paper (its sub-parts become (i), (ii)…). */
export function questionLines(p: Pyq): string[] {
  const parts = p.parts.map((x) => x.text.trim()).filter(Boolean);
  if (!parts.length) return [p.title];
  if (parts.length === 1) return parts;
  return parts.map((t, i) => `(${["i", "ii", "iii", "iv", "v", "vi", "vii", "viii"][i] ?? i + 1}) ${t}`);
}

export function paperView(code: string, paper: string[][], withReview: boolean): QuestionView[] {
  const s = getPyq(code);
  return paper.map((ids, q) => {
    const unit = s?.units.find((u) => u.n === q + 1);
    const parts = ids.map((id, p): PartView | null => {
      const f = findPyq(code, id);
      if (!f) return null;
      return {
        key: partKey(q, p), id, kind: f.pyq.kind, title: f.pyq.title, lines: questionLines(f.pyq), repeated: f.pyq.repeated,
        ...(withReview ? { review: rubricFor(code, id) } : {}),
      };
    }).filter((x): x is PartView => x !== null);
    return { n: q + 1, unitTitle: unit?.title ?? `Unit ${q + 1}`, parts };
  });
}

/** The server's clock, so the exam screen can correct for a phone whose clock is wrong. */
export const serverNow = () => Date.now();

export type HistoryRow = { id: string; course: string; mode: "practice" | "exam"; started_at: string; submitted_at: string | null; total: number | null; marked: boolean };
type HistoryDb = { id: string; course: string; mode: "practice" | "exam"; started_at: string; submitted_at: string | null; total: number | string | null; self_marks: Record<string, unknown> | null };

/** The student's last attempts (newest first), optionally for one subject. */
export async function loadHistory(supabase: Awaited<ReturnType<typeof requireOnboarded>>["supabase"], course?: string): Promise<HistoryRow[]> {
  const base = supabase.from("papers").select("id,course,mode,started_at,submitted_at,total,self_marks");
  const { data } = await (course ? base.eq("course", course) : base).order("created_at", { ascending: false }).limit(30);
  return ((data ?? []) as HistoryDb[]).map((r) => {
    const marked = !!r.submitted_at && !!r.self_marks && Object.keys(r.self_marks).length > 0;
    return { id: r.id, course: r.course, mode: r.mode, started_at: r.started_at, submitted_at: r.submitted_at, total: marked && r.total !== null ? Number(r.total) : null, marked };
  });
}
