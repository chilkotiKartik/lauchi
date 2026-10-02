import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { unsubscribeSchema } from "@/lib/push";

const json = (status: number, code: string, message: string) => NextResponse.json({ code, message }, { status });

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return json(401, "signed_out", "Sign in first.");
  const p = unsubscribeSchema.safeParse(await req.json().catch(() => null));
  if (!p.success) return json(400, "invalid", "That request couldn't be read.");
  // Row-level security limits this to the student's own subscriptions.
  const { error } = await s.supabase.from("push_subscriptions").delete().eq("endpoint", p.data.endpoint).eq("user_id", s.user.id);
  if (error) return json(503, "unavailable", "Couldn't switch reminders off. Try again.");
  return NextResponse.json({ ok: true });
}
