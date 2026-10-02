"use server";
import { requireOnboarded } from "@/lib/auth";
import { idSchema } from "@/lib/resources";

/** A student's own "done" tick for one resource. RLS keeps it to their own rows. */
export async function setResourceSeen(id: string, done: boolean): Promise<{ ok: boolean }> {
  const { supabase, user } = await requireOnboarded();
  if (!idSchema.safeParse(id).success) return { ok: false };
  try {
    if (done) {
      const { error } = await supabase.from("resource_seen").upsert({ user_id: user.id, resource_id: id }, { onConflict: "user_id,resource_id" });
      return { ok: !error };
    }
    const { error } = await supabase.from("resource_seen").delete().eq("user_id", user.id).eq("resource_id", id);
    return { ok: !error };
  } catch { return { ok: false }; }
}
