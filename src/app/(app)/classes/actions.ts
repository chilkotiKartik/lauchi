"use server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTeacher } from "@/lib/classes-server";
import { createClassSchema, joinSchema, JOIN_MESSAGES, uuidSchema, type JoinStatus } from "@/lib/classes";

export type Result = { ok: boolean; message?: string; id?: string; code?: string };
const NOT_SIGNED_IN: Result = { ok: false, message: "Your session expired. Log in again." };
const GENERIC: Result = { ok: false, message: "We couldn't do that. Try again." };

async function me() {
  const s = await getSession();
  return s && s.profile.onboarded_at ? s : null;
}

export async function createClassAction(input: { name: string; course: string }): Promise<Result> {
  const s = await me();
  if (!s) return NOT_SIGNED_IN;
  if (!(await isTeacher(s.supabase, s.user.id))) return { ok: false, message: "Only teachers can create classes." };
  const v = createClassSchema.safeParse(input);
  if (!v.success) return { ok: false, message: v.error.issues[0]?.message ?? "Check the form." };
  const { data, error } = await createAdminClient().rpc("create_class", { p_owner: s.user.id, p_name: v.data.name, p_course: v.data.course });
  if (error || !data) return /too many classes/.test(error?.message ?? "") ? { ok: false, message: "You have 30 active classes. Archive one first." } : GENERIC;
  revalidatePath("/classes");
  return { ok: true, id: (data as { id: string }).id };
}

export async function joinClassAction(input: { code: string }): Promise<Result> {
  const s = await me();
  if (!s) return NOT_SIGNED_IN;
  const v = joinSchema.safeParse(input);
  if (!v.success) return { ok: false, message: v.error.issues[0]?.message ?? "Type the class code." };
  const { data, error } = await createAdminClient().rpc("join_class", { p_user: s.user.id, p_code: v.data.code });
  if (error || !data) return GENERIC;
  const r = data as { status: JoinStatus; name?: string };
  revalidatePath("/classes");
  if (r.status === "ok") return { ok: true, message: `You joined ${r.name ?? "the class"}.` };
  if (r.status === "already") return { ok: true, message: "You are already in that class." };
  return { ok: false, message: JOIN_MESSAGES[r.status] ?? GENERIC.message };
}

export async function leaveClassAction(classId: string): Promise<Result> {
  const s = await me();
  if (!s || !uuidSchema.safeParse(classId).success) return s ? GENERIC : NOT_SIGNED_IN;
  const { error } = await createAdminClient().rpc("leave_class", { p_user: s.user.id, p_class: classId });
  if (error) return GENERIC;
  revalidatePath("/classes");
  return { ok: true, message: "You left the class." };
}

/** Owner-only actions: the database function re-checks ownership and raises for anyone else. */
async function owner(classId: string) {
  const s = await me();
  if (!s) return { err: NOT_SIGNED_IN, s: null } as const;
  if (!uuidSchema.safeParse(classId).success) return { err: GENERIC, s: null } as const;
  return { err: null, s } as const;
}

export async function regenerateCodeAction(classId: string): Promise<Result> {
  const o = await owner(classId);
  if (!o.s) return o.err;
  const { data, error } = await createAdminClient().rpc("regenerate_class_code", { p_owner: o.s.user.id, p_class: classId });
  if (error || typeof data !== "string") return { ok: false, message: "You can't change that class." };
  revalidatePath(`/classes/${classId}`);
  return { ok: true, code: data, message: "New code made. The old one no longer works." };
}

export async function archiveClassAction(classId: string, archived: boolean): Promise<Result> {
  const o = await owner(classId);
  if (!o.s) return o.err;
  const { error } = await createAdminClient().rpc("archive_class", { p_owner: o.s.user.id, p_class: classId, p_archived: archived === true });
  if (error) return { ok: false, message: "You can't change that class." };
  revalidatePath("/classes");
  revalidatePath(`/classes/${classId}`);
  return { ok: true, message: archived ? "Class archived. The code no longer works." : "Class is active again." };
}

export async function removeStudentAction(classId: string, studentId: string): Promise<Result> {
  const o = await owner(classId);
  if (!o.s) return o.err;
  if (!uuidSchema.safeParse(studentId).success) return GENERIC;
  const { error } = await createAdminClient().rpc("remove_class_member", { p_owner: o.s.user.id, p_class: classId, p_student: studentId });
  if (error) return { ok: false, message: "You can't change that class." };
  revalidatePath(`/classes/${classId}`);
  return { ok: true, message: "Student removed." };
}
