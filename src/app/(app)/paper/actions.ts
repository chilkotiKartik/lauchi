"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getPyq } from "@/lib/pyq";
import { PAPER, PAPER_COURSES, PAPER_MS, buildPaper, cleanChosen, newSeed, paperTotal, partKey, selfMarksSchema, type RubricPoint } from "@/lib/paper";
import { rubricFor } from "./data";

type Res = { ok: true } | { ok: false; error: string };
type Row = { id: string; course: string; mode: "practice" | "exam"; paper: string[][]; ends_at: string; paused_at: string | null; submitted_at: string | null };
const COLS = "id,course,mode,paper,ends_at,paused_at,submitted_at";
const GRACE_MS = 90_000; // a late autosave right at the bell still counts
const id = z.string().uuid();

async function load(paperId: unknown) {
  const s = await getSession();
  if (!s || !s.profile.onboarded_at) return { error: "Your session expired. Log in again." } as const;
  const p = id.safeParse(paperId);
  if (!p.success) return { error: "That paper doesn't exist." } as const;
  const { data } = await s.supabase.from("papers").select(COLS).eq("id", p.data).eq("user_id", s.user.id).limit(1);
  const row = (data?.[0] ?? null) as Row | null;
  if (!row) return { error: "That paper doesn't exist." } as const;
  return { s, row } as const;
}

const startSchema = z.object({ course: z.enum(PAPER_COURSES), mode: z.enum(["practice", "exam"]) });

/** Builds a new seeded paper and opens it. "Generate another paper" is the same call: every start gets a new seed. */
export async function startPaper(input: unknown): Promise<{ error: string }> {
  const s = await getSession();
  if (!s || !s.profile.onboarded_at) redirect("/login");
  const p = startSchema.safeParse(input);
  if (!p.success) return { error: "That paper isn't available." };
  const subject = getPyq(p.data.course);
  if (!subject) return { error: "That paper isn't available." };
  const seed = newSeed();
  const paper = buildPaper(subject.units, seed);
  if (paper.length < PAPER.questions || paper.some((q) => q.length === 0)) return { error: "There aren't enough questions for this subject yet." };
  const now = Date.now();
  const { data, error } = await s.supabase.from("papers").insert({
    user_id: s.user.id, course: p.data.course, seed, mode: p.data.mode, paper,
    started_at: new Date(now).toISOString(), ends_at: new Date(now + PAPER_MS).toISOString(),
  }).select("id").single<{ id: string }>();
  if (error || !data) return { error: /too many/.test(error?.message ?? "") ? "You've started a lot of papers today. Come back tomorrow." : "We couldn't start the paper. Try again." };
  revalidatePath("/paper");
  redirect(`/paper/${p.data.course}/${data.id}`);
}

const saveSchema = z.object({ chosen: z.array(z.string().max(4)).max(15).optional(), notes: z.string().max(20000).optional() });

/** Autosave while writing: attempted toggles and scratch notes. */
export async function savePaper(paperId: unknown, input: unknown): Promise<Res> {
  const l = await load(paperId);
  if ("error" in l) return { ok: false, error: l.error! };
  const v = saveSchema.safeParse(input);
  if (!v.success) return { ok: false, error: "That couldn't be saved." };
  const { row, s } = l;
  if (row.submitted_at) return { ok: false, error: "This paper is already submitted." };
  if (!row.paused_at && Date.now() > new Date(row.ends_at).getTime() + GRACE_MS) return { ok: false, error: "Time is up for this paper." };
  const patch: Record<string, unknown> = {};
  if (v.data.chosen) patch.chosen = cleanChosen(v.data.chosen);
  if (v.data.notes !== undefined) patch.notes = v.data.notes;
  if (!Object.keys(patch).length) return { ok: true };
  const { error } = await s.supabase.from("papers").update(patch).eq("id", row.id).eq("user_id", s.user.id);
  return error ? { ok: false, error: "We couldn't save. Check your connection." } : { ok: true };
}

/** Practice mode only: stop and restart the clock. In exam mode the clock never stops. */
export async function pausePaper(paperId: unknown, pause: unknown): Promise<Res & { endsAt?: string; pausedAt?: string | null }> {
  const l = await load(paperId);
  if ("error" in l) return { ok: false, error: l.error! };
  const { row, s } = l;
  if (typeof pause !== "boolean") return { ok: false, error: "That choice isn't valid." };
  if (row.mode !== "practice") return { ok: false, error: "The clock can't be paused in exam mode." };
  if (row.submitted_at) return { ok: false, error: "This paper is already submitted." };
  const now = Date.now();
  let patch: { ends_at?: string; paused_at: string | null };
  if (pause) {
    if (row.paused_at) return { ok: true, endsAt: row.ends_at, pausedAt: row.paused_at };
    if (now >= new Date(row.ends_at).getTime()) return { ok: false, error: "Time is up for this paper." };
    patch = { paused_at: new Date(now).toISOString() };
  } else {
    if (!row.paused_at) return { ok: true, endsAt: row.ends_at, pausedAt: null };
    const left = Math.max(0, new Date(row.ends_at).getTime() - new Date(row.paused_at).getTime());
    patch = { ends_at: new Date(now + left).toISOString(), paused_at: null };
  }
  // the database allows at most 30 days between start and end, which is far beyond any real pause
  const { error } = await s.supabase.from("papers").update(patch).eq("id", row.id).eq("user_id", s.user.id);
  if (error) return { ok: false, error: "We couldn't do that. Try again." };
  return { ok: true, endsAt: patch.ends_at ?? row.ends_at, pausedAt: patch.paused_at };
}

/** Hands the paper in (also called by the clock at time up). */
export async function submitPaper(paperId: unknown): Promise<Res> {
  const l = await load(paperId);
  if ("error" in l) return { ok: false, error: l.error! };
  const { row, s } = l;
  if (row.submitted_at) return { ok: true };
  const now = Date.now(), end = new Date(row.ends_at).getTime();
  const at = row.paused_at ? now : Math.min(now, end);
  const { error } = await s.supabase.from("papers").update({ submitted_at: new Date(at).toISOString(), paused_at: null, total: 0 }).eq("id", row.id).eq("user_id", s.user.id);
  if (error) return { ok: false, error: "We couldn't submit. Check your connection and try again." };
  revalidatePath("/paper");
  return { ok: true };
}

/** Saves self-marking (rubric ticks). The total is worked out here, from the same rubrics the review shows. */
export async function saveMarks(paperId: unknown, input: unknown): Promise<Res & { total?: number }> {
  const l = await load(paperId);
  if ("error" in l) return { ok: false, error: l.error! };
  const { row, s } = l;
  if (!row.submitted_at) return { ok: false, error: "Submit the paper before marking it." };
  const v = selfMarksSchema.safeParse(input);
  if (!v.success) return { ok: false, error: "Those marks couldn't be read." };
  const rubrics: Record<string, RubricPoint[]> = {};
  row.paper.forEach((ids, q) => ids.forEach((pid, p) => { rubrics[partKey(q, p)] = rubricFor(row.course, pid).rubric; }));
  const { total } = paperTotal(rubrics, v.data);
  const { error } = await s.supabase.from("papers").update({ self_marks: v.data, total }).eq("id", row.id).eq("user_id", s.user.id);
  if (error) return { ok: false, error: "We couldn't save your marks. Try again." };
  revalidatePath("/paper");
  return { ok: true, total };
}
