import "server-only";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPublicEnv } from "@/lib/env";
import type { Pyq } from "@/lib/pyq";

/* ------------------------------------------------------------------ roles */

/** ADMIN_EMAILS="a@x.com, b@y.com" → a set of lower-cased emails. */
export function adminEmails(raw: string | undefined = process.env.ADMIN_EMAILS): Set<string> {
  return new Set((raw ?? "").split(",").map((e) => e.trim().toLowerCase()).filter((e) => e.includes("@")));
}

/** True when the signed-in user is an admin: listed in ADMIN_EMAILS or present in the `admins` table. Always checked on the server. */
export async function isAdmin(): Promise<boolean> {
  const s = await getSession();
  if (!s) return false;
  const email = (s.user.email ?? s.profile.email ?? "").toLowerCase();
  if (email && adminEmails().has(email)) return true;
  const { data, error } = await s.supabase.from("admins").select("user_id").eq("user_id", s.user.id).limit(1);
  return !error && Array.isArray(data) && data.length > 0;
}

/** For admin pages and layouts: the session, or a 404 for anyone who is not an admin (never reveal that the page exists). */
export async function requireAdmin() {
  const s = await getSession();
  if (!s || !(await isAdmin())) notFound();
  return s;
}

/* ------------------------------------------------------------------ validation */

export const COURSE = /^[A-Z]{2,3}-[0-9]{3}$/;
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const noMarkup = (s: string) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(s);

/** Accepts a bare 11-character id or any common YouTube URL (watch, youtu.be, shorts, embed, live, m.). Returns null otherwise. */
export function parseYoutubeId(input: string): string | null {
  const s = input.trim();
  if (VIDEO_ID.test(s)) return s;
  let u: URL;
  try { u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`); } catch { return null; }
  const host = u.hostname.toLowerCase().replace(/^(www|m|music)\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = u.pathname.split("/")[1] ?? null;
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (u.pathname === "/watch") id = u.searchParams.get("v");
    else { const m = /^\/(?:shorts|embed|live|v)\/([^/?#]+)/.exec(u.pathname); id = m ? m[1] : null; }
  }
  return id && VIDEO_ID.test(id) ? id : null;
}

export const thumbUrl = (id: string) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;

const text = (max: number, label: string) => z.string().trim().max(max, `${label} is too long (max ${max} characters)`).refine(noMarkup, `${label} has characters we can't accept`);

export const pyqPartSchema = z.object({
  text: text(2000, "Question text").pipe(z.string().min(1, "Write the question text")),
  marks: text(20, "Marks").transform((m) => (m === "" ? null : m)),
});

export const customPyqSchema = z.object({
  course: z.string().regex(COURSE, "Pick a subject"),
  unit: z.coerce.number({ error: "Pick a unit" }).int("Pick a unit").min(1, "Pick a unit").max(12, "Pick a unit"),
  kind: z.enum(["theory", "numerical"], { error: "Pick theory or numerical" }),
  title: text(300, "Title").pipe(z.string().min(3, "Give the question a short title")),
  parts: z.array(pyqPartSchema).min(1, "Add at least one part").max(12, "12 parts is the most"),
  marks: text(20, "Total marks").transform((m) => (m === "" ? null : m)),
  repeated: z.coerce.number({ error: "Times asked must be a number" }).int("Times asked must be a whole number").min(0, "Times asked can't be negative").max(50, "50 is the most"),
  year: text(60, "Year").transform((y) => (y === "" ? null : y)),
});
export type CustomPyqInput = z.infer<typeof customPyqSchema>;

export const pinVideoSchema = z.object({
  course: z.string().regex(COURSE, "Pick a subject"),
  unit: z.coerce.number({ error: "Pick a unit" }).int().min(1, "Pick a unit").max(12, "Pick a unit"),
  topic: z.string().trim().regex(/^([0-9]{1,3})?$/, "Pick a topic").transform((t) => (t === "" ? null : t)),
  video: z.string().trim().min(1, "Paste a YouTube link or video id").transform((v, ctx) => {
    const id = parseYoutubeId(v);
    if (!id) { ctx.addIssue({ code: "custom", message: "That isn't a YouTube link or 11-character video id" }); return z.NEVER; }
    return id;
  }),
  title: text(140, "Title").pipe(z.string().min(1, "Give the video a title")),
  channel: text(80, "Channel"),
  note: text(200, "Note"),
});

export const reportSchema = z.object({
  where: z.enum(["quiz", "pyq", "lesson"]),
  ref: z.string().trim().min(1).max(200).refine(noMarkup),
  course: z.string().regex(COURSE).nullish(),
  unit: z.number().int().min(1).max(12).nullish(),
  text: z.string().trim().min(3, "Tell us a little more").max(500, "Keep it under 500 characters").refine(noMarkup, "That has characters we can't accept"),
});

export const REPORT_DAILY_LIMIT = 20;

/** zod issues → { field: first message }, with array paths flattened like "parts.0.text". */
export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) { const k = i.path.join(".") || "_"; if (!(k in out)) out[k] = i.message; }
  return out;
}

/* ------------------------------------------------------------------ reads for students (RLS applies) */

export type CustomPyqRow = {
  id: string; course: string; unit: number; kind: "theory" | "numerical"; title: string; parts: unknown;
  marks: string | null; repeated: number | null; year: string | null; hidden?: boolean; created_at?: string;
};
export type CustomPyq = Pyq & { unit: number; year: string | null };

/** A database row in the PYQ bank's shape. Ids are prefixed "C-" so they never clash with the bank's own ids. */
export function toPyq(r: CustomPyqRow): CustomPyq {
  const parts = Array.isArray(r.parts) ? r.parts : [];
  return {
    id: `C-${r.id}`,
    kind: r.kind === "numerical" ? "numerical" : "theory",
    title: r.title,
    marks: r.marks ?? null,
    repeated: r.repeated ?? null,
    parts: parts
      .filter((p): p is { text: unknown; marks?: unknown } => typeof p === "object" && p !== null && typeof (p as { text?: unknown }).text === "string")
      .map((p) => ({ text: String(p.text), marks: typeof p.marks === "string" && p.marks ? p.marks : null })),
    unit: Number(r.unit),
    year: r.year ?? null,
  };
}

/** Teacher-added PYQs for one subject that are not hidden, oldest first. Each has `unit` so it can be merged into that unit's list. */
export async function getCustomPyqs(code: string): Promise<CustomPyq[]> {
  if (!COURSE.test(code) || !getPublicEnv()) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("custom_pyqs")
      .select("id,course,unit,kind,title,parts,marks,repeated,year,created_at").eq("course", code).eq("hidden", false)
      .order("unit", { ascending: true }).order("created_at", { ascending: true }).limit(500);
    if (error || !data) return [];
    return (data as CustomPyqRow[]).map(toPyq);
  } catch { return []; }
}

export type PinnedVideo = { id: string; title: string; channel: string; thumb: string };
export type PinnedRow = { id: string; course: string; unit: number; topic: string | null; video_id: string; title: string; channel: string; note: string; position: number; created_at: string };

/** Which pinned videos belong on a shelf: with a topic, the unit-wide picks plus that topic's; without one, every pick in the unit. */
export function pickPinned(rows: PinnedRow[], topic?: string | number | null): PinnedVideo[] {
  const t = topic === undefined || topic === null || topic === "" ? null : String(topic);
  return rows
    .filter((r) => t === null || r.topic === null || r.topic === t)
    .sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at))
    .filter((r) => VIDEO_ID.test(r.video_id))
    .map((r) => ({ id: r.video_id, title: r.title, channel: r.channel, thumb: thumbUrl(r.video_id) }));
}

/** "Teacher's pick" videos for a unit (and optionally one topic number), in the admin's order. */
export async function getPinnedVideos(course: string, unit: number, topic?: string | number): Promise<PinnedVideo[]> {
  if (!COURSE.test(course) || !Number.isInteger(unit) || unit < 1 || unit > 12 || !getPublicEnv()) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("pinned_videos")
      .select("id,course,unit,topic,video_id,title,channel,note,position,created_at").eq("course", course).eq("unit", unit)
      .order("position", { ascending: true }).limit(100);
    if (error || !data) return [];
    return pickPinned(data as PinnedRow[], topic);
  } catch { return []; }
}

/* ------------------------------------------------------------------ analytics shape */

export type Analytics = {
  days: number; k: number; since: string;
  units: { course: string; unit: number; students: number; attempts: number; correct: number; accuracy: number }[];
  daily: { day: string; students: number | null }[];
  top_reported: { source: string; ref: string; course: string | null; unit: number | null; reports: number; open: number }[];
  totals: { students: number | null; quizzes: number | null };
};

/** Normalises the admin_analytics() JSON (numbers may arrive as strings) and enforces k-anonymity once more on this side. */
export function normaliseAnalytics(raw: unknown, k = 5): Analytics {
  const o = (raw ?? {}) as Partial<Record<keyof Analytics, unknown>>;
  const n = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number.isFinite(Number(v)) ? Number(v) : null);
  const arr = (v: unknown) => (Array.isArray(v) ? (v as Record<string, unknown>[]) : []);
  const tot = (o.totals ?? {}) as Record<string, unknown>;
  const students = n(tot.students);
  return {
    days: n(o.days) ?? 7, k, since: String(o.since ?? ""),
    units: arr(o.units).map((u) => ({ course: String(u.course), unit: n(u.unit) ?? 0, students: n(u.students) ?? 0, attempts: n(u.attempts) ?? 0, correct: n(u.correct) ?? 0, accuracy: n(u.accuracy) ?? 0 }))
      .filter((u) => u.students >= k && u.attempts > 0),
    daily: arr(o.daily).map((d) => { const s = n(d.students); return { day: String(d.day).slice(0, 10), students: s !== null && s >= k ? s : null }; }),
    top_reported: arr(o.top_reported).map((r) => ({ source: String(r.source), ref: String(r.ref), course: r.course ? String(r.course) : null, unit: n(r.unit), reports: n(r.reports) ?? 0, open: n(r.open) ?? 0 })),
    totals: { students: students !== null && students >= k ? students : null, quizzes: students !== null && students >= k ? n(tot.quizzes) : null },
  };
}
