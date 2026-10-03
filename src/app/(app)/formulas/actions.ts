"use server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getCourse } from "@/lib/syllabus";
import { canSeeCourse } from "@/lib/stream";
import { indiaToday } from "@/lib/social";
import { createAdminClient } from "@/lib/supabase/admin";
import { CARD_PASS, CARD_XP } from "@/lib/cards";

/**
 * XP for a formula-card quiz round: CARD_XP once a day per deck, when at least 80% were right. The round is scored
 * in the browser, so the reward is kept small, once a day, and inside the global daily cap of award_xp.
 */
export async function awardCards(input: unknown): Promise<{ xp: number }> {
  const s = await getSession();
  const p = z.object({ course: z.string().regex(/^[A-Z0-9-]{3,12}$/), unit: z.number().int().min(1).max(12), right: z.number().int().min(0), total: z.number().int().min(1) }).safeParse(input);
  if (!s || !p.success) return { xp: 0 };
  const c = getCourse(p.data.course);
  const formulas = c?.units[p.data.unit - 1]?.formulas.length ?? 0;
  if (!c || !canSeeCourse(s.profile.branch, c.code, c.type) || p.data.total !== formulas || p.data.right > p.data.total) return { xp: 0 };
  if (p.data.right / p.data.total < CARD_PASS) return { xp: 0 };
  const { data } = await createAdminClient().rpc("award_xp", { p_user: s.user.id, p_kind: "quiz_completed", p_ref: `cards:${c.code}:${p.data.unit}:${indiaToday()}`, p_xp: CARD_XP });
  return { xp: Number(data ?? 0) };
}
