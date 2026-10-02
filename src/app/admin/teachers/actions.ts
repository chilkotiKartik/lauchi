"use server";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailSchema, uuidSchema } from "@/lib/classes";

export type TeacherState = { status: "idle" | "saved" | "error"; message?: string; at?: number };
const fail = (message: string): TeacherState => ({ status: "error", message, at: Date.now() });

async function admin() {
  const s = await getSession();
  if (!s || !(await isAdmin())) notFound();
  return { db: createAdminClient(), userId: s.user.id };
}

/** Finds an auth user by email with the service-role admin API (pages through the user list). */
async function findUserByEmail(db: ReturnType<typeof createAdminClient>, email: string): Promise<string | null> {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) { // admin API unavailable: fall back to the profile row that every account gets
      const { data: rows } = await db.from("profiles").select("id").eq("email", email).limit(1);
      return ((rows ?? []) as { id: string }[])[0]?.id ?? null;
    }
    const hit = data.users.find((u) => (u.email ?? "").toLowerCase() === email);
    if (hit) return hit.id;
    if (data.users.length < 1000) return null;
  }
  return null;
}

export async function grantTeacher(_prev: TeacherState, form: FormData): Promise<TeacherState> {
  const { db, userId } = await admin();
  const v = emailSchema.safeParse(String(form.get("email") ?? ""));
  if (!v.success) return fail(v.error.issues[0]?.message ?? "Enter a valid email");
  try {
    const id = await findUserByEmail(db, v.data);
    if (!id) return fail("No account with that email. They need to sign in to lockin. once first.");
    const { error } = await db.from("teachers").upsert({ user_id: id, granted_by: userId }, { onConflict: "user_id" });
    if (error) return fail("We couldn't save that. Try again.");
  } catch { return fail("We couldn't look that account up. Try again."); }
  revalidatePath("/admin/teachers");
  revalidatePath("/classes");
  return { status: "saved", message: `${v.data} can now create classes.`, at: Date.now() };
}

export async function revokeTeacher(id: string): Promise<void> {
  const { db } = await admin();
  if (!uuidSchema.safeParse(id).success) return;
  await db.from("teachers").delete().eq("user_id", id);
  revalidatePath("/admin/teachers");
  revalidatePath("/classes");
}
