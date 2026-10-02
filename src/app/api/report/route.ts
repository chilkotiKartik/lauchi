import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { REPORT_DAILY_LIMIT, reportSchema } from "@/lib/admin";

const json = (status: number, code: string, message: string) => NextResponse.json({ code, message }, { status });

/** A signed-in student reports a problem with a quiz question, PYQ or lesson. At most 20 a day; a teacher reviews them in /admin/reports. */
export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return json(401, "signed_out", "Sign in to report a problem.");
  const p = reportSchema.safeParse(await req.json().catch(() => null));
  if (!p.success) {
    const textIssue = p.error.issues.find((i) => i.path[0] === "text");
    return json(400, "invalid", textIssue?.message ?? "That report couldn't be read.");
  }
  const { where, ref, course, unit, text } = p.data;
  const { data, error } = await s.supabase.rpc("submit_question_report", {
    p_source: where, p_ref: ref, p_course: course ?? null, p_unit: unit ?? null, p_text: text, p_limit: REPORT_DAILY_LIMIT,
  });
  if (error) return json(503, "unavailable", "We couldn't send that just now. Try again in a moment.");
  if (data === false) return json(429, "limit", `You've sent ${REPORT_DAILY_LIMIT} reports today. Thank you! You can send more tomorrow.`);
  return NextResponse.json({ ok: true });
}
