"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getLab } from "@/labs/registry";
import { clampParams } from "@/labs/params-core";
import { ALL_SPECS } from "@/labs/meta";

export type SetupResult = { ok: true; id: string } | { ok: false; error: string };

const saveSchema = z.object({
  lab: z.string().regex(/^[a-z0-9]{2,24}$/),
  name: z.string().trim().min(1, "Give the setup a name").max(40, "Keep the name under 40 characters"),
  params: z.record(z.string(), z.union([z.number().finite(), z.boolean(), z.string().max(24)])),
});

export async function saveSetup(input: unknown): Promise<SetupResult> {
  const s = await getSession();
  if (!s) return { ok: false, error: "Your session expired. Log in again." };
  const p = saveSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "That setup isn't valid." };
  const spec = ALL_SPECS[p.data.lab];
  if (!getLab(p.data.lab) || !spec) return { ok: false, error: "Unknown lab." };
  // Store only the lab's own parameters, clamped to their allowed ranges.
  const params = clampParams(spec, p.data.params);
  const { data, error } = await s.supabase.from("lab_setups").insert({ lab: p.data.lab, name: p.data.name, params }).select("id").single();
  if (error || !data) return { ok: false, error: /too many/.test(error?.message ?? "") ? "You have 100 saved setups. Delete some first." : "We couldn't save that setup." };
  revalidatePath(`/labs/${p.data.lab}`);
  return { ok: true, id: data.id as string };
}

export async function deleteSetup(input: unknown): Promise<{ ok: boolean }> {
  const s = await getSession();
  const p = z.object({ id: z.string().uuid(), lab: z.string().regex(/^[a-z0-9]{2,24}$/) }).safeParse(input);
  if (!s || !p.success) return { ok: false };
  const { error } = await s.supabase.from("lab_setups").delete().eq("id", p.data.id); // RLS: own rows only
  revalidatePath(`/labs/${p.data.lab}`);
  return { ok: !error };
}
