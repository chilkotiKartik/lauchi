import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { subscribeSchema, toHHMM } from "@/lib/push";
import { createAdminClient } from "@/lib/supabase/admin";

const json = (status: number, code: string, message: string) => NextResponse.json({ code, message }, { status });

/** Saves (or updates) this browser's push subscription and reminder choices for the signed-in student. Safe to call again. */
export async function POST(req: Request) {
  const s = await getSession();
  if (!s || !s.profile.onboarded_at) return json(401, "signed_out", "Sign in to switch on reminders.");
  const p = subscribeSchema.safeParse(await req.json().catch(() => null));
  if (!p.success) return json(400, "invalid", "That subscription couldn't be read.");
  const { endpoint, keys, prefs } = p.data;
  try {
    const { error } = await createAdminClient().from("push_subscriptions").upsert({
      user_id: s.user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth,
      remind_streak: prefs.streak, remind_exam: prefs.exam, study_time: prefs.studyTime,
    }, { onConflict: "endpoint" });
    if (error) return json(503, "unavailable", "Couldn't save your reminders. Try again.");
  } catch { return json(503, "unavailable", "Reminders aren't configured on this server yet."); }
  return NextResponse.json({ ok: true, prefs: { ...prefs, studyTime: toHHMM(prefs.studyTime) } });
}

/** The saved choices for one browser, so the settings card can show them. */
export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return json(401, "signed_out", "Sign in first.");
  const endpoint = new URL(req.url).searchParams.get("endpoint");
  if (!endpoint || endpoint.length > 1000) return json(400, "invalid", "Missing endpoint.");
  const { data } = await s.supabase.from("push_subscriptions")
    .select("remind_streak,remind_exam,study_time").eq("endpoint", endpoint).single<{ remind_streak: boolean; remind_exam: boolean; study_time: string | null }>();
  if (!data) return NextResponse.json({ subscribed: false });
  return NextResponse.json({ subscribed: true, prefs: { streak: data.remind_streak, exam: data.remind_exam, studyTime: toHHMM(data.study_time) } });
}
