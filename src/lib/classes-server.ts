import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normaliseCompare, uuidSchema, type ClassRow, type Compare } from "@/lib/classes";

type Db = Awaited<ReturnType<typeof createClient>>;

/** True when this user is in the teachers table. Reads through RLS: a user can only ever see their own row. */
export async function isTeacher(supabase: Db, userId: string): Promise<boolean> {
  const { data, error } = await supabase.from("teachers").select("user_id").eq("user_id", userId).limit(1);
  return !error && Array.isArray(data) && data.length > 0;
}

const COLS = "id,owner_id,name,course,archived,created_at";

/** Classes this user belongs to as a student (RLS shows only those). */
export async function myClasses(supabase: Db, userId: string): Promise<{ classes: ClassRow[]; compare: Compare[]; failed: boolean }> {
  const { data: mem, error } = await supabase.from("class_members").select("class_id").eq("user_id", userId);
  if (error) return { classes: [], compare: [], failed: true };
  const ids = (mem ?? []).map((m: { class_id: string }) => m.class_id);
  if (!ids.length) return { classes: [], compare: [], failed: false };
  const [{ data: cls, error: e2 }, cmp] = await Promise.all([
    supabase.from("classes").select(COLS).in("id", ids).order("created_at", { ascending: false }),
    createAdminClient().rpc("my_class_compare", { p_user: userId }),
  ]);
  if (e2) return { classes: [], compare: [], failed: true };
  return { classes: ((cls ?? []) as ClassRow[]).filter((c) => !c.archived), compare: cmp.error ? [] : normaliseCompare(cmp.data), failed: false };
}

/** Classes this user owns (RLS: owner only). */
export async function ownedClasses(supabase: Db, userId: string): Promise<{ classes: (ClassRow & { members: number })[]; failed: boolean }> {
  const { data, error } = await supabase.from("classes").select(COLS).eq("owner_id", userId).order("created_at", { ascending: false });
  if (error) return { classes: [], failed: true };
  const rows = (data ?? []) as ClassRow[];
  const counts = new Map<string, number>();
  if (rows.length) {
    const { data: mem } = await supabase.from("class_members").select("class_id").in("class_id", rows.map((r) => r.id));
    for (const m of (mem ?? []) as { class_id: string }[]) counts.set(m.class_id, (counts.get(m.class_id) ?? 0) + 1);
  }
  return { classes: rows.map((r) => ({ ...r, members: counts.get(r.id) ?? 0 })), failed: false };
}

/** One class the user owns, with its invite code (only the owner gets it; the code column is not readable by clients). Null when it is not theirs. */
export async function ownedClass(supabase: Db, userId: string, id: string): Promise<(ClassRow & { invite_code: string }) | null> {
  if (!uuidSchema.safeParse(id).success) return null;
  const { data } = await supabase.from("classes").select(COLS).eq("id", id).eq("owner_id", userId).limit(1);
  const row = ((data ?? []) as ClassRow[])[0];
  if (!row || row.owner_id !== userId) return null;
  const { data: code } = await createAdminClient().from("classes").select("invite_code").eq("id", id).eq("owner_id", userId).limit(1);
  const invite = ((code ?? []) as { invite_code: string }[])[0]?.invite_code;
  return invite ? { ...row, invite_code: invite } : null;
}
