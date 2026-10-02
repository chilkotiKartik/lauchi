import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const COLS = "id,course,unit,kind,topic_key,total,correct,xp,answers,created_at,submitted_at";
/** The owner's quiz sessions including their answers. The service role bypasses RLS, so the user id filter is the authorization check. */
function sessionsWithAnswers(userId: string) {
  try { return createAdminClient().from("quiz_sessions").select(COLS).eq("user_id", userId); } catch { return null; }
}

/** Daily Ask Lochi request counts (the questions themselves are never stored). Service role bypasses RLS, so the user id filter is the authorization check. */
async function aiUsage(userId: string) {
  try { const { data } = await createAdminClient().from("ai_usage").select("day,n").eq("user_id", userId); return data ?? []; } catch { return []; }
}

/** Everything lockin. holds about the signed-in student, as JSON. Row-level security scopes every query to their rows. */
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Sign in first" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const q = (t: string, cols = "*") => s.supabase.from(t).select(cols);
  const [profile, xp, topics, sessions, consents, setups, usage, revise] = await Promise.all([
    q("profiles"), q("xp_events"), q("topic_progress"),
    sessionsWithAnswers(s.user.id) ?? q("quiz_sessions", "id,course,unit,kind,topic_key,total,correct,xp,created_at,submitted_at"), q("consents"), q("lab_setups", "id,lab,name,params,created_at"), aiUsage(s.user.id), q("revise_items"),
  ]);
  const body = {
    exportedAt: new Date().toISOString(),
    note: "This is all the personal data lockin. stores about you, including the answers you gave in quizzes. The random seeds that generate quiz questions are not personal data and are left out.",
    account: { id: s.user.id, email: s.user.email }, profile: profile.data ?? [], xpEvents: xp.data ?? [], topicProgress: topics.data ?? [], quizSessions: sessions.data ?? [], consents: consents.data ?? [], labSetups: setups.data ?? [], askLochiDailyCounts: usage, reviseItems: revise.data ?? [],
  };
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="lockin-data-${new Date().toISOString().slice(0, 10)}.json"`, "Cache-Control": "private, no-store" },
  });
}
