/** Question-bank CMS: pure logic (schemas, grading, CSV). No server-only imports, so unit tests and client previews can use it. */
import { z } from "zod";

export const KINDS = ["mcq", "multi", "numeric", "tf"] as const;
export type Kind = (typeof KINDS)[number];
export const KIND_LABEL: Record<Kind, string> = { mcq: "Single choice", multi: "Multiple choice", numeric: "Numeric", tf: "True / false" };
export const DIFFICULTY_LABEL = ["", "Easy", "Medium", "Hard"] as const;
export const TF_OPTIONS = ["True", "False"] as const;
export const PAGE_SIZE = 20;
export const MAX_IMPORT_ROWS = 200;

export type NumericAnswer = { value: number; tol: number };
export type StoredAnswer = number | number[] | NumericAnswer;
/** What a student submits: option index, option indexes, or a number typed as text. */
export type Given = number | number[] | string;

const COURSE = /^[A-Z]{2,3}-[0-9]{3}$/;
const noCtl = (s: string) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(s);
const txt = (min: number, max: number, label: string) =>
  z.string().trim().min(min, min ? `${label} is required` : `${label} is too short`).max(max, `${label} is too long (max ${max} characters)`).refine(noCtl, `${label} has characters we can't accept`);

const numericAnswer = z.object({
  value: z.number({ error: "Enter the correct number" }).finite("Enter the correct number"),
  tol: z.number({ error: "Tolerance must be a number" }).finite().min(0, "Tolerance can't be negative").max(1e9, "Tolerance is too large"),
});

export const questionSchema = z.object({
  course: z.string().regex(COURSE, "Pick a subject"),
  unit: z.coerce.number({ error: "Pick a unit" }).int("Pick a unit").min(1, "Pick a unit").max(12, "Pick a unit"),
  kind: z.enum(KINDS, { error: "Pick a question type" }),
  stem: txt(3, 2000, "Question"),
  options: z.array(txt(1, 300, "Option")).max(6, "6 options is the most"),
  answer: z.union([z.number().int().min(0).max(5), z.array(z.number().int().min(0).max(5)).min(1, "Pick at least one correct option").max(6), numericAnswer], { error: "Set the correct answer" }),
  explanation: txt(0, 3000, "Explanation"),
  steps: z.array(txt(1, 600, "Step")).max(12, "12 steps is the most"),
  difficulty: z.coerce.number().int().min(1, "Pick a difficulty").max(3, "Pick a difficulty"),
  tags: z.array(z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9 _-]{0,29}$/, "Tags are short words (letters, numbers, - or _)")).max(8, "8 tags is the most"),
}).superRefine((q, ctx) => {
  const bad = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message });
  const a = q.answer;
  if (q.kind === "numeric") {
    if (typeof a !== "object" || Array.isArray(a)) return bad("answer", "Enter the correct number");
    if (q.options.length) bad("options", "Numeric questions have no options");
    return;
  }
  if (q.kind === "tf") {
    if (q.options.join("|") !== TF_OPTIONS.join("|")) bad("options", "True / false uses the options True and False");
    if (typeof a !== "number" || a > 1) bad("answer", "Pick True or False");
    return;
  }
  if (q.options.length < 2) return bad("options", "Add at least 2 options");
  if (new Set(q.options.map((o) => o.toLowerCase())).size !== q.options.length) bad("options", "Two options are the same");
  if (q.kind === "mcq") {
    if (typeof a !== "number") return bad("answer", "Pick the one correct option");
    if (a >= q.options.length) bad("answer", "The correct option is out of range");
  } else {
    if (!Array.isArray(a)) return bad("answer", "Pick the correct options");
    if (new Set(a).size !== a.length) bad("answer", "Each correct option can only be picked once");
    else if (a.some((i) => i >= q.options.length)) bad("answer", "A correct option is out of range");
  }
});
export type QuestionInput = z.infer<typeof questionSchema>;

/** zod issues to { field: first message }; "answer.value" style paths are folded into "answer". */
export function errorsOf(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = typeof i.path[0] === "string" || typeof i.path[0] === "number" ? String(i.path[0]) : "_";
    if (!(k in out)) out[k] = i.message;
  }
  return out;
}

/** Grades a submitted answer against the stored one. Numbers accept "9,8" or "9.8", within the absolute tolerance. */
export function gradeAnswer(kind: Kind, stored: unknown, given: unknown): boolean {
  if (kind === "numeric") {
    const a = numericAnswer.safeParse(stored);
    if (!a.success) return false;
    const raw = typeof given === "number" ? String(given) : typeof given === "string" ? given.trim().replace(",", ".") : "";
    if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(raw)) return false;
    const n = Number(raw);
    return Number.isFinite(n) && Math.abs(n - a.data.value) <= a.data.tol + 1e-12 * Math.max(1, Math.abs(a.data.value));
  }
  if (kind === "multi") {
    if (!Array.isArray(stored) || !Array.isArray(given)) return false;
    const want = new Set(stored as number[]);
    const got = new Set(given.filter((x) => Number.isInteger(x)) as number[]);
    return got.size === given.length && got.size === want.size && [...got].every((x) => want.has(x));
  }
  return typeof stored === "number" && typeof given === "number" && stored === given;
}

/** A human-readable correct answer, shown after grading. */
export function describeAnswer(kind: Kind, options: string[], stored: unknown): string {
  if (kind === "numeric") {
    const a = numericAnswer.safeParse(stored);
    return a.success ? (a.data.tol > 0 ? `${a.data.value} (± ${a.data.tol})` : String(a.data.value)) : "";
  }
  const idx = Array.isArray(stored) ? (stored as number[]) : typeof stored === "number" ? [stored] : [];
  return idx.map((i) => options[i]).filter(Boolean).join(", ");
}

/* ------------------------------------------------------------------ CSV import */

export const CSV_HEADER = ["course", "unit", "kind", "stem", "options", "answer", "tolerance", "explanation", "steps", "difficulty", "tags"] as const;

/** RFC 4180-style parser: quoted fields, doubled quotes, commas and newlines inside quotes. Returns rows of cells with their start line. */
export function parseCsv(text: string): { line: number; cells: string[] }[] {
  const rows: { line: number; cells: string[] }[] = [];
  let cells: string[] = [], cur = "", inQ = false, line = 1, start = 1, touched = false;
  const src = text.replace(/^﻿/, "");
  const endRow = () => {
    cells.push(cur);
    if (touched || cells.some((c) => c.trim() !== "")) rows.push({ line: start, cells });
    cells = []; cur = ""; touched = false;
  };
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQ) {
      if (ch === '"') { if (src[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
      else { if (ch === "\n") line++; cur += ch; }
    } else if (ch === '"' && cur === "") { inQ = true; touched = true; }
    else if (ch === ",") { cells.push(cur); cur = ""; touched = true; }
    else if (ch === "\r") { /* skip */ }
    else if (ch === "\n") { endRow(); line++; start = line; }
    else { cur += ch; touched = true; }
  }
  if (inQ) rows.push({ line: start, cells: [`\u0000unterminated`] });
  else if (cur !== "" || cells.length) endRow();
  return rows;
}

const letterIdx = (s: string) => { const t = s.trim().toUpperCase(); return /^[A-F]$/.test(t) ? t.charCodeAt(0) - 65 : /^[1-6]$/.test(t) ? Number(t) - 1 : -1; };
const list = (s: string) => s.split("|").map((x) => x.trim()).filter(Boolean);

export type ImportResult = { rows: QuestionInput[]; errors: { line: number; message: string }[] };

/**
 * CSV columns: course, unit, kind, stem, options ("|" between options), answer, tolerance, explanation, steps ("|"), difficulty, tags ("|").
 * answer: mcq A-F (or 1-6), multi "A|C", tf "true"/"false", numeric the number. A header row is optional.
 * `courseOk(course, unit)` lets the server check the course and unit exist. All-or-nothing: the caller imports only when errors is empty.
 */
export function parseImport(text: string, courseOk?: (course: string, unit: number) => boolean): ImportResult {
  const parsed = parseCsv(text);
  const errors: ImportResult["errors"] = [];
  const rows: QuestionInput[] = [];
  const first = parsed[0]?.cells.map((c) => c.trim().toLowerCase()) ?? [];
  const body = first[0] === "course" && first[2] === "kind" ? parsed.slice(1) : parsed;
  if (!body.length) return { rows, errors: [{ line: 1, message: "Paste at least one question row." }] };
  if (body.length > MAX_IMPORT_ROWS) return { rows, errors: [{ line: body[0].line, message: `Import at most ${MAX_IMPORT_ROWS} questions at a time.` }] };
  for (const { line, cells } of body) {
    if (cells[0] === "\u0000unterminated") { errors.push({ line, message: "A quoted field is never closed." }); continue; }
    if (cells.length !== CSV_HEADER.length) { errors.push({ line, message: `Expected ${CSV_HEADER.length} columns, found ${cells.length}.` }); continue; }
    const [course, unit, kind0, stem, options0, answer0, tol, explanation, steps, difficulty, tags] = cells.map((c) => c.trim());
    const kind = kind0.toLowerCase();
    let answer: unknown = undefined;
    let options = list(options0);
    if (kind === "mcq") answer = letterIdx(answer0);
    else if (kind === "multi") answer = list(answer0).map(letterIdx);
    else if (kind === "tf") { options = [...TF_OPTIONS]; const a = answer0.toLowerCase(); answer = a === "true" || a === "t" ? 0 : a === "false" || a === "f" ? 1 : -1; }
    else if (kind === "numeric") {
      const v = Number(answer0.replace(",", ".")), t = tol === "" ? 0 : Number(tol.replace(",", "."));
      answer = answer0 === "" || Number.isNaN(v) ? undefined : { value: v, tol: Number.isNaN(t) ? -1 : t };
    }
    const p = questionSchema.safeParse({
      course, unit, kind, stem, options, answer, explanation, steps: list(steps), difficulty: difficulty === "" ? 2 : difficulty, tags: list(tags),
    });
    if (!p.success) { errors.push({ line, message: Object.values(errorsOf(p.error))[0] ?? "Invalid row." }); continue; }
    if (courseOk && !courseOk(p.data.course, p.data.unit)) { errors.push({ line, message: `${p.data.course} unit ${p.data.unit} doesn't exist.` }); continue; }
    rows.push(p.data);
  }
  return { rows: errors.length ? [] : rows, errors };
}

/** Plain-text search over stem, tags and explanation. */
export const matchesSearch = (q: { stem: string; tags: string[]; explanation?: string }, term: string) => {
  const t = term.trim().toLowerCase();
  return !t || q.stem.toLowerCase().includes(t) || q.tags.some((x) => x.includes(t)) || (q.explanation ?? "").toLowerCase().includes(t);
};

export function paginate<T>(items: T[], page: number, size = PAGE_SIZE): { items: T[]; page: number; pages: number; total: number } {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const p = Math.min(Math.max(1, Math.floor(page) || 1), pages);
  return { items: items.slice((p - 1) * size, p * size), page: p, pages, total: items.length };
}
