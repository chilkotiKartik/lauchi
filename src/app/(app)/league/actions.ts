"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";

export async function setLeague(join: unknown): Promise<{ ok: boolean; error?: string }> {
  const s = await getSession();
  if (!s) return { ok: false, error: "Your session expired. Log in again." };
  const v = z.boolean().safeParse(join);
  if (!v.success) return { ok: false, error: "That choice isn't valid." };
  const { error } = await s.supabase.from("profiles").update({ league_opt_in: v.data }).eq("id", s.user.id);
  if (error) return { ok: false, error: "We couldn't save that. Try again." };
  revalidatePath("/league");
  return { ok: true };
}
