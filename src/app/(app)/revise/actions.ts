"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { fromTemplate, grade, rightAnswer, type Answer } from "@/lib/quiz";
import { getPyq } from "@/lib/pyq";
import { PYQ_ID, parseQuizRef, pyqRef, titleSnippet } from "@/lib/revise";

type Fail = { ok: false; error: string };
export type ReviewResult = { ok: true; correct: boolean; why: string; right: string; step: number; due: string; xp: number; reviewed: boolean } | Fail;
export type GradeResult = { ok: true; step: number; due: string; xp: number; reviewed: boolean } | Fail;

const id = z.string().uuid();
const quizInput = z.object({
  id,
  answer: z.union([z.number().int().min(0).max(9), z.array(z.number().int().min(0).max(9)).max(10), z.string().max(30)]),
});
const selfInput = z.object({ id, ok: z.boolean() });

type Row = { id: string; kind: "quiz" | "pyq"; ref: string };
async function item(userId: string, itemId: string): Promise<Row | null> {
  const { data } = await createAdminClient().from("revise_items").select("id,kind,ref").eq("id", itemId).eq("user_id", userId).limit(1);
  return ((data ?? [])[0] as Row | undefined) ?? null;
}
async function review(userId: string, itemId: string, ok: boolean) {
  const { data, error } = await createAdminClient().rpc("revise_review", { p_user: userId, p_id: itemId, p_ok: ok });
  if (error || !data) return null;
  return data as { step: number; due: string; xp: number; reviewed: boolean };
}

/** Answer a missed quiz question again: graded on the server from the stored (template, seed), then rescheduled. */
export async function reviewQuiz(input: unknown): Promise<ReviewResult> {
  const s = await getSession();
  if (!s) return { ok: false, error: "Your session expired. Log in again." };
  const p = quizInput.safeParse(input);
  if (!p.success) return { ok: false, error: "That answer isn't valid." };
  const it = await item(s.user.id, p.data.id);
  const ref = it?.kind === "quiz" ? parseQuizRef(it.ref) : null;
  const q = ref ? fromTemplate(ref.course, ref.unit, ref.t, ref.s) : null;
  if (!it || !q) return { ok: false, error: "That question isn't in your queue any more." };
  const correct = grade(q, p.data.answer as Answer);
  const r = await review(s.user.id, it.id, correct);
  if (!r) return { ok: false, error: "We couldn't save that review." };
  revalidatePath("/", "layout");
  return { ok: true, correct, why: q.why, right: rightAnswer(q), ...r };
}

/** Self-grade a previous-year question: "I could answer it" (true) or "I need more practice" (false). */
export async function reviewPyq(input: unknown): Promise<GradeResult> {
  const s = await getSession();
  if (!s) return { ok: false, error: "Your session expired. Log in again." };
  const p = selfInput.safeParse(input);
  if (!p.success) return { ok: false, error: "That choice isn't valid." };
  const it = await item(s.user.id, p.data.id);
  if (!it || it.kind !== "pyq") return { ok: false, error: "That question isn't in your queue any more." };
  const r = await review(s.user.id, it.id, p.data.ok);
  if (!r) return { ok: false, error: "We couldn't save that review." };
  revalidatePath("/", "layout");
  return { ok: true, ...r };
}

// ------------------------------------------------------------------ PYQ "practised" ticks (stored as pyq revise items)
const code = z.string().regex(/^[A-Z]{2,3}-[0-9]{3}$/);
const tickInput = z.object({ code, id: z.string().regex(PYQ_ID), on: z.boolean() });
const keyInput = z.array(z.string().max(40)).max(500);

function findPyq(c: string, pid: string) {
  const subject = getPyq(c);
  if (!subject) return null;
  for (const u of subject.units) {
    const q = u.pyqs.find((x) => x.id === pid);
    if (q) return { unit: u.n, title: q.title };
  }
  return null;
}
async function addTick(userId: string, c: string, pid: string): Promise<boolean> {
  const found = findPyq(c, pid);
  if (!found) return false;
  const { error } = await createAdminClient().rpc("revise_add", {
    p_user: userId, p_kind: "pyq", p_ref: pyqRef(c, pid), p_course: c, p_unit: found.unit, p_title: titleSnippet(found.title),
  });
  return !error;
}

/** The ids of the PYQs this student has marked practised in one subject. */
export async function pyqTicks(input: unknown): Promise<string[]> {
  const s = await getSession();
  const c = code.safeParse(input);
  if (!s || !c.success) return [];
  try {
    const { data } = await createAdminClient().from("revise_items").select("ref").eq("user_id", s.user.id).eq("kind", "pyq").eq("course", c.data).limit(1000);
    return ((data ?? []) as { ref: string }[]).map((r) => r.ref.slice(c.data.length + 1));
  } catch { return []; }
}

/** Mark or unmark a PYQ as practised. Marking it also queues it for spaced review. */
export async function setPyqTick(input: unknown): Promise<{ ok: boolean }> {
  const s = await getSession();
  const p = tickInput.safeParse(input);
  if (!s || !p.success) return { ok: false };
  try {
    if (p.data.on) return { ok: await addTick(s.user.id, p.data.code, p.data.id) };
    const { error } = await createAdminClient().rpc("revise_remove", { p_user: s.user.id, p_kind: "pyq", p_ref: pyqRef(p.data.code, p.data.id) });
    return { ok: !error };
  } catch { return { ok: false }; }
}

/** One-time move of ticks saved on this device (localStorage "lockin.pyq.done", keys like "AHT-001:Q1.2") to the account. */
export async function importPyqTicks(input: unknown): Promise<{ ok: boolean; added: number }> {
  const s = await getSession();
  const p = keyInput.safeParse(input);
  if (!s || !p.success) return { ok: false, added: 0 };
  let added = 0, ok = true;
  for (const key of new Set(p.data)) {
    const m = /^([A-Z]{2,3}-[0-9]{3}):(.+)$/.exec(key);
    if (!m || !PYQ_ID.test(m[2])) continue;
    try { if (await addTick(s.user.id, m[1], m[2])) added++; } catch { ok = false; }
  }
  return { ok, added };
}
