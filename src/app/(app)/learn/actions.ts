"use server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getCourse } from "@/lib/syllabus";
import { canSeeCourse } from "@/lib/stream";
import { createAdminClient } from "@/lib/supabase/admin";
import { CHEST_PCT, CHEST_XP } from "@/lib/subject-progress";

export type ChestResult = { ok: true; xp: number } | { ok: false; error: string };

/**
 * Open a unit's chest: pays CHEST_XP once, only when the server sees a finished practice quiz on that unit scoring at
 * least CHEST_PCT%. The check runs here against the database, never on the student's word.
 */
export async function openChest(input: unknown): Promise<ChestResult> {
  const s = await getSession();
  if (!s) return { ok: false, error: "Your session expired. Log in again." };
  const p = z.object({ course: z.string().regex(/^[A-Z0-9-]{3,12}$/), unit: z.number().int().min(1).max(12) }).safeParse(input);
  const c = p.success ? getCourse(p.data.course) : undefined;
  if (!p.success || !c || !c.units[p.data.unit - 1] || !canSeeCourse(s.profile.branch, c.code, c.type)) return { ok: false, error: "Unknown unit." };
  const db = createAdminClient();
  const { data } = await db.from("quiz_sessions").select("correct,total").eq("user_id", s.user.id).eq("course", c.code).eq("unit", p.data.unit)
    .in("kind", ["practice", "topic"]).not("submitted_at", "is", null).limit(200);
  const best = Math.max(0, ...((data ?? []) as { correct: number | null; total: number }[]).map((r) => (r.total ? (100 * (r.correct ?? 0)) / r.total : 0)));
  if (best < CHEST_PCT) return { ok: false, error: `Score ${CHEST_PCT}% or more in a practice quiz on this unit to open it.` };
  const { data: paid, error } = await db.rpc("award_xp", { p_user: s.user.id, p_kind: "quiz_completed", p_ref: `chest:${c.code}:${p.data.unit}`, p_xp: CHEST_XP });
  if (error) return { ok: false, error: "We couldn't open it. Try again." };
  return { ok: true, xp: Number(paid ?? 0) };
}
