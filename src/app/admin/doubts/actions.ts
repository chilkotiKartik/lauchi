"use server";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { answerSchema, canAnswerDoubts, idSchema } from "@/lib/doubts";

export type AdState = { status: "idle" | "saved" | "error"; message?: string; at?: number };
const fail = (message: string): AdState => ({ status: "error", message, at: Date.now() });
const ok = (message: string): AdState => ({ status: "saved", message, at: Date.now() });
const refresh = () => { revalidatePath("/admin/doubts"); revalidatePath("/doubts"); };

async function guard(manage = false) {
  const s = await getSession();
  if (!s || !(manage ? await isAdmin() : await canAnswerDoubts())) notFound();
  return { db: createAdminClient(), userId: s.user.id };
}

export async function answerDoubt(id: string, _prev: AdState, form: FormData): Promise<AdState> {
  const { db, userId } = await guard();
  const did = idSchema.safeParse(id);
  const body = answerSchema.safeParse(String(form.get("body") ?? ""));
  if (!did.success) return fail("That doubt doesn't exist.");
  if (!body.success) return fail(body.error.issues[0].message);
  const { data: d } = await db.from("doubts").select("id,status").eq("id", did.data).limit(1);
  if (!(d ?? [])[0]) return fail("That doubt doesn't exist.");
  const { error } = await db.from("doubt_answers").insert({ doubt_id: did.data, author_id: userId, author_kind: "admin", body: body.data });
  if (error) return fail("We couldn't save the answer. Try again.");
  if ((d![0] as { status: string }).status === "open") await db.from("doubts").update({ status: "answered" }).eq("id", did.data);
  refresh();
  return ok("Answer sent.");
}

export async function setPublished(id: string, publish: boolean): Promise<AdState> {
  const { db } = await guard(true);
  const did = idSchema.safeParse(id);
  if (!did.success) return fail("That doubt doesn't exist.");
  if (publish) {
    const { data } = await db.from("doubts").select("id,visibility,status,hidden").eq("id", did.data).limit(1);
    const d = (data ?? [])[0] as { visibility: string; status: string; hidden: boolean } | undefined;
    if (!d) return fail("That doubt doesn't exist.");
    if (d.visibility !== "public") return fail("The student kept this doubt private, so it can't be published.");
    if (d.hidden) return fail("Unhide this doubt first.");
    if (d.status === "open") return fail("Answer the doubt before publishing it.");
    const { data: a } = await db.from("doubt_answers").select("id").eq("doubt_id", did.data).limit(1);
    if (!(a ?? []).length) return fail("Answer the doubt before publishing it.");
  }
  const { error } = await db.from("doubts").update({ published: publish }).eq("id", did.data);
  if (error) return fail("We couldn't save that. Try again.");
  refresh();
  return ok(publish ? "Published to the shared library." : "Removed from the shared library.");
}

export async function setHidden(id: string, hide: boolean): Promise<AdState> {
  const { db } = await guard(true);
  const did = idSchema.safeParse(id);
  if (!did.success) return fail("That doubt doesn't exist.");
  const { error } = await db.from("doubts").update(hide ? { hidden: true, published: false } : { hidden: false }).eq("id", did.data);
  if (error) return fail("We couldn't save that. Try again.");
  refresh();
  return ok(hide ? "Hidden. The student no longer sees it." : "Unhidden.");
}

export async function deleteDoubt(id: string): Promise<AdState> {
  const { db } = await guard(true);
  const did = idSchema.safeParse(id);
  if (!did.success) return fail("That doubt doesn't exist.");
  const { error } = await db.from("doubts").delete().eq("id", did.data);
  if (error) return fail("We couldn't delete that. Try again.");
  refresh();
  return ok("Deleted.");
}
