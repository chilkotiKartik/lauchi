import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { mergeStats, mockUnitStats, unitStats, type MockRow, type SessionRow, type UnitStat } from "@/lib/insights";
import { sessionUnit } from "@/lib/quiz";

/** Per-unit accuracy from practice, topic and assignment quizzes plus every answered question of the student's recent mocks.
 *  A mock's answers are not readable by the browser, so they are read here on the server, scoped to this student. */
export async function allUnitStats(userId: string, sessions: SessionRow[]): Promise<UnitStat[]> {
  const base = unitStats(sessions);
  try {
    const { data } = await createAdminClient().from("quiz_sessions").select("course,total,answers").eq("user_id", userId).eq("kind", "mock").not("submitted_at", "is", null)
      .order("created_at", { ascending: false }).limit(30);
    const mocks = (data ?? []) as MockRow[];
    return mergeStats(base, mockUnitStats(mocks, (course, i) => sessionUnit({ kind: "mock", course, unit: 1, seed: 0 }, i)));
  } catch { return base; }
}
