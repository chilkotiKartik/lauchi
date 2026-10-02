import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUCKET, idSchema, parseHttpUrl, SIGNED_URL_SECONDS, type ResourceRow } from "@/lib/resources";
import { canSeeCourse } from "@/lib/stream";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store" };
const esc = (t: string) => t.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
/** JSON for fetch() callers; a small friendly page when the link was opened in a tab. */
const err = (status: number, message: string, html = false) => html
  ? new NextResponse(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>lockin.</title><body style="font:18px system-ui;max-width:28rem;margin:18vh auto;padding:0 1rem;text-align:center"><p>${esc(message)}</p><p><a href="/resources">Back to notes &amp; files</a></p>`, { status, headers: { ...noStore, "Content-Type": "text/html; charset=utf-8" } })
  : NextResponse.json({ error: message }, { status, headers: noStore });

/**
 * GET /api/resources/<id>            → 302 to a 10-minute signed URL (or the external link)
 * GET /api/resources/<id>?download=1 → same, with a download disposition
 * GET /api/resources/<id>?json=1     → { url, name, mime } for the in-page preview
 * Checks the session and the student's stream before anything is handed out.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const html = req.nextUrl.searchParams.get("json") !== "1";
  if (!idSchema.safeParse(id).success) return err(404, "We couldn't find that file.", html);
  const s = await getSession();
  if (!s) return err(401, "Please sign in again.", html);

  // RLS hides hidden items from students, so a hidden id looks exactly like a missing one
  const { data } = await s.supabase.from("resources").select("id,course,file_path,file_name,mime,external_url").eq("id", id).limit(1);
  const row = (data?.[0] ?? null) as Pick<ResourceRow, "id" | "course" | "file_path" | "file_name" | "mime" | "external_url"> | null;
  if (!row || !canSeeCourse(s.profile.branch, row.course)) return err(404, "We couldn't find that file.", html);

  const sp = req.nextUrl.searchParams;
  const wantJson = sp.get("json") === "1";
  const download = sp.get("download") === "1";
  const respond = (url: string) => (wantJson
    ? NextResponse.json({ url, name: row.file_name, mime: row.mime }, { headers: noStore })
    : NextResponse.redirect(url, { status: 302, headers: noStore }));

  if (!row.file_path) {
    const ext = row.external_url ? parseHttpUrl(row.external_url) : null;
    return ext ? respond(ext) : err(404, "This item has no file.", html);
  }

  try {
    const { data: signed, error } = await createAdminClient().storage.from(BUCKET)
      .createSignedUrl(row.file_path, SIGNED_URL_SECONDS, download ? { download: row.file_name || true } : undefined);
    if (error || !signed?.signedUrl) return err(503, "Files are taking a nap right now. Please try again in a minute.", html);
    return respond(signed.signedUrl);
  } catch {
    return err(503, "Files are taking a nap right now. Please try again in a minute.", html);
  }
}
