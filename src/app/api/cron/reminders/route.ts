import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { buildMessage, isGone, type ReminderKind } from "@/lib/push";
import { pushConfigured, sendPush } from "@/lib/push-send";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

type Due = { sub_id: string; user_id: string; endpoint: string; p256dh: string; auth: string; kind: ReminderKind; streak: number | null; days_left: number | null; local_day: string };
const COLUMN: Record<ReminderKind, string> = { streak: "last_streak_on", exam: "last_exam_on", study: "last_study_on", daily: "last_daily_on" };

function authorised(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? req.headers.get("x-cron-secret") ?? "";
  const a = Buffer.from(given), b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Call every 30 minutes (Vercel Cron sends `Authorization: Bearer $CRON_SECRET`). Sends each reminder at most once a day. */
async function run(req: Request) {
  if (!authorised(req)) return NextResponse.json({ code: "forbidden" }, { status: 401 });
  if (!pushConfigured()) return NextResponse.json({ ok: true, skipped: "no VAPID keys", sent: 0 });
  const db = createAdminClient();
  const { data, error } = await db.rpc("reminders_due", { p_now: new Date().toISOString() });
  if (error) return NextResponse.json({ code: "unavailable" }, { status: 503 });
  const due = (data ?? []) as Due[];
  let sent = 0, removed = 0, failed = 0;
  for (const d of due) {
    const res = await sendPush(d, buildMessage({ kind: d.kind, streak: d.streak, days_left: d.days_left }));
    if (res.ok) {
      sent++;
      await db.from("push_subscriptions").update({ [COLUMN[d.kind]]: d.local_day, last_ok: new Date().toISOString() }).eq("id", d.sub_id);
    } else if (isGone(res.status)) {
      removed++;
      await db.from("push_subscriptions").delete().eq("id", d.sub_id);
    } else failed++;
  }
  return NextResponse.json({ ok: true, due: due.length, sent, removed, failed });
}
export const GET = run;
export const POST = run;
