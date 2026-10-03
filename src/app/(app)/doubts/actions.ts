"use server";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { canSeeCourse } from "@/lib/stream";
import { getCourse } from "@/lib/syllabus";
import { askSchema, idSchema, overDailyLimit, DOUBT_DAILY_LIMIT } from "@/lib/doubts";
import { aiFirstAnswer } from "@/lib/doubts-ai";

export type DoubtState = { status: "idle" | "saved" | "error"; message?: string; errors?: Record<string, string>; at?: number };
const fail = (message: string, errors?: Record<string, string>): DoubtState => ({ status: "error", message, errors, at: Date.now() });

export async function askDoubt(_prev: DoubtState, form: FormData): Promise<DoubtState> {
  const s = await getSession();
  if (!s || !s.profile.onboarded_at) return fail("Your session expired. Log in again.");
  const parsed = askSchema.safeParse({
    course: String(form.get("course") ?? ""), unit: String(form.get("unit") ?? ""), title: String(form.get("title") ?? ""),
    body: String(form.get("body") ?? ""), makePublic: form.get("makePublic") === "on",
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) { const k = String(i.path[0] ?? "_"); if (!(k in errors)) errors[k] = i.message; }
    return fail("Please fix the highlighted fields.", errors);
  }
  const v = parsed.data;
  const c = getCourse(v.course);
  if (!c || !canSeeCourse(s.profile.branch, c.code, c.type)) return fail("Please fix the highlighted fields.", { course: "Pick a subject from your list" });
  if (v.unit !== null && !c.units[v.unit - 1]) return fail("Please fix the highlighted fields.", { unit: "That unit doesn't exist for this subject" });
  const { data: recent, error: rerr } = await s.supabase.from("doubts").select("created_at").order("created_at", { ascending: false }).limit(DOUBT_DAILY_LIMIT);
  if (rerr) return fail("We couldn't save your doubt. Try again.");
  if (overDailyLimit(((recent ?? []) as { created_at: string }[]).map((r) => r.created_at))) return fail(`You can ask ${DOUBT_DAILY_LIMIT} doubts a day. Try again tomorrow, or search the shared library.`);
  const id = randomUUID();
  const { error } = await s.supabase.from("doubts").insert({ id, user_id: s.user.id, course: v.course, unit: v.unit, title: v.title, body: v.body, visibility: v.makePublic ? "public" : "private" });
  if (error) return fail(/too many doubts/.test(error.message) ? `You can ask ${DOUBT_DAILY_LIMIT} doubts a day. Try again tomorrow, or search the shared library.` : "We couldn't save your doubt. Try again.");
  revalidatePath("/doubts");
  redirect(`/doubts/${id}`);
}

/** The student's own doubt (RLS), or null. */
async function mine(id: unknown) {
  const s = await getSession();
  const ok = idSchema.safeParse(id);
  if (!s || !s.profile.onboarded_at || !ok.success) return null;
  const { data } = await s.supabase.from("doubts").select("id,course,unit,title,body,status").eq("id", ok.data).limit(1);
  const d = (data ?? [])[0] as { id: string; course: string; unit: number | null; title: string; body: string; status: string } | undefined;
  return d ? { s, d } : null;
}

export async function resolveDoubt(id: string): Promise<DoubtState> {
  const m = await mine(id);
  if (!m) return fail("We couldn't find that doubt.");
  if (m.d.status === "open") return fail("Wait for an answer before marking it resolved.");
  const { error } = await createAdminClient().from("doubts").update({ status: "resolved" }).eq("id", m.d.id).eq("user_id", m.s.user.id);
  if (error) return fail("We couldn't save that. Try again.");
  revalidatePath(`/doubts/${m.d.id}`); revalidatePath("/doubts");
  return { status: "saved", message: "Marked as resolved." };
}

export async function markHelpful(answerId: string): Promise<{ ok: boolean; count?: number; error?: string }> {
  const s = await getSession();
  const ok = idSchema.safeParse(answerId);
  if (!s || !ok.success) return { ok: false, error: "Your session expired. Log in again." };
  const { data, error } = await s.supabase.rpc("doubt_mark_helpful", { p_answer: ok.data });
  if (error || typeof data !== "number") return { ok: false, error: "We couldn't save that. Try again." };
  return { ok: true, count: data };
}

export async function askAi(id: string): Promise<DoubtState> {
  const m = await mine(id);
  if (!m) return fail("We couldn't find that doubt.");
  const db = createAdminClient();
  const { data: ex } = await db.from("doubt_answers").select("id,author_kind").eq("doubt_id", m.d.id).limit(50);
  if (((ex ?? []) as { author_kind: string }[]).some((a) => a.author_kind === "ai")) return fail("Lochi has already given a first answer.");
  const r = await aiFirstAnswer({ userId: m.s.user.id, course: m.d.course, unit: m.d.unit, title: m.d.title, body: m.d.body });
  if (!r.ok) return fail(r.message);
  const { error } = await db.from("doubt_answers").insert({ doubt_id: m.d.id, author_id: null, author_kind: "ai", body: r.text });
  // 23505: a second click raced the first one; the database keeps only one AI answer per doubt
  if (error) return error.code === "23505" ? fail("Lochi has already given a first answer.") : fail("We couldn't save the answer. Try again.");
  if (m.d.status === "open") await db.from("doubts").update({ status: "answered" }).eq("id", m.d.id);
  revalidatePath(`/doubts/${m.d.id}`); revalidatePath("/doubts");
  return { status: "saved", message: "Lochi wrote a first answer." };
}
