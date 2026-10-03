/** Doubt box: validation, limits and pure helpers. Nothing here talks to the database. */
import { z } from "zod";
import { isAdmin } from "@/lib/admin";
import { canSeeCourse, type Viewer } from "@/lib/stream";

export const DOUBT_DAILY_LIMIT = 10;
import { TITLE_MAX, BODY_MAX, ANSWER_MAX } from "./doubts-consts";
export { TITLE_MAX, BODY_MAX, ANSWER_MAX };
const noCtl = (s: string) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(s);

export const askSchema = z.object({
  course: z.string().regex(/^[A-Z]{2,3}-[0-9]{3}$/, "Pick a subject"),
  unit: z.preprocess((v) => (v === "" || v === null || v === undefined ? null : Number(v)), z.number().int("Pick a unit").min(1, "Pick a unit").max(12, "Pick a unit").nullable()),
  title: z.string().trim().min(5, "Give your doubt a short title (at least 5 characters)").max(TITLE_MAX, `Keep the title under ${TITLE_MAX} characters`).refine(noCtl, "That has characters we can't accept"),
  body: z.string().trim().min(10, "Explain your doubt in a little more detail (at least 10 characters)").max(BODY_MAX, `Keep it under ${BODY_MAX} characters`).refine((s) => noCtl(s.replace(/[\n\r\t]/g, "")), "That has characters we can't accept"),
  makePublic: z.boolean(),
});
export const answerSchema = z.string().trim().min(2, "Write an answer").max(ANSWER_MAX, `Keep the answer under ${ANSWER_MAX} characters`);
export const idSchema = z.string().uuid();
export const searchSchema = z.string().trim().max(80).catch("");

/** Who may answer doubts. One place, so it can later include teachers of a class. */
export async function canAnswerDoubts(): Promise<boolean> {
  return isAdmin();
}

/** True when the student has already asked DOUBT_DAILY_LIMIT doubts in the last 24 hours. */
export function overDailyLimit(createdAts: string[], now = Date.now(), limit = DOUBT_DAILY_LIMIT): boolean {
  return createdAts.filter((c) => now - Date.parse(c) < 86_400_000).length >= limit;
}

export type LibraryAnswer = { id: string; kind: "teacher" | "ai" | "admin"; body: string; helpful: number };
export type LibraryDoubt = { id: string; course: string; unit: number | null; title: string; body: string; created_at: string; answers: LibraryAnswer[] };

/** Rows from public_doubts(), cleaned up and limited to subjects of the student's stream. Extra fields (should there ever be any) are dropped. */
export function libraryFor(branch: Viewer, raw: unknown): LibraryDoubt[] {
  if (!Array.isArray(raw)) return [];
  const out: LibraryDoubt[] = [];
  for (const r of raw as Record<string, unknown>[]) {
    if (!r || typeof r.course !== "string" || !canSeeCourse(branch, r.course)) continue;
    const answers = (Array.isArray(r.answers) ? r.answers : []).flatMap((a: Record<string, unknown>) =>
      typeof a?.body === "string" && typeof a.id === "string" ? [{ id: a.id, kind: (["teacher", "ai", "admin"].includes(String(a.kind)) ? a.kind : "admin") as LibraryAnswer["kind"], body: a.body, helpful: Number(a.helpful) || 0 }] : []);
    if (!answers.length) continue;
    out.push({ id: String(r.id), course: r.course, unit: r.unit === null || r.unit === undefined ? null : Number(r.unit), title: String(r.title), body: String(r.body), created_at: String(r.created_at), answers });
  }
  return out;
}

export const STATUS_LABEL = { open: "Waiting for an answer", answered: "Answered", resolved: "Resolved" } as const;
export const kindLabel = (k: string) => (k === "ai" ? "Lochi (AI) · first answer, please double-check" : k === "teacher" ? "Teacher" : "Admin");
