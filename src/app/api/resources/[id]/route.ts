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

type Row = Pick<ResourceRow, "id" | "course" | "file_path" | "file_name" | "mime" | "external_url" | "allow_download">;

/** The row the student may see (RLS hides hidden items). Works before migration 0023 too: files then count as view-only. */
async function loadRow(supabase: NonNullable<Awaited<ReturnType<typeof getSession>>>["supabase"], id: string): Promise<Row | null> {
  const cols = "id,course,file_path,file_name,mime,external_url";
  const first = await supabase.from("resources").select(`${cols},allow_download`).eq("id", id).limit(1);
  if (!first.error) return (first.data?.[0] ?? null) as Row | null;
  const fallback = await supabase.from("resources").select(cols).eq("id", id).limit(1);
  const r = (fallback.data?.[0] ?? null) as Row | null;
  return r ? { ...r, allow_download: false } : null;
}

/**
 * GET /api/resources/<id>?view=1      → the file's bytes, streamed by this server for the in-app viewer (inline, no-store)
 * GET /api/resources/<id>?json=1      → { url, name, mime } with a 10-minute signed URL  (downloadable files only)
 * GET /api/resources/<id>             → 302 to that signed URL / the external link       (downloadable files only)
 * GET /api/resources/<id>?download=1  → same, as a download                               (downloadable files only)
 * View-only files (the default) never hand out a storage URL: they can only be read inside the app.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sp = req.nextUrl.searchParams;
  const view = sp.get("view") === "1", wantJson = sp.get("json") === "1", download = sp.get("download") === "1";
  const html = !wantJson && !view;
  if (!idSchema.safeParse(id).success) return err(404, "We couldn't find that file.", html);
  const s = await getSession();
  if (!s) return err(401, "Please sign in again.", html);

  const row = await loadRow(s.supabase, id);
  if (!row || !canSeeCourse(s.profile, row.course)) return err(404, "We couldn't find that file.", html);

  if (!row.file_path) {
    const ext = row.external_url ? parseHttpUrl(row.external_url) : null;
    if (!ext) return err(404, "This item has no file.", html);
    return wantJson ? NextResponse.json({ url: ext, name: row.file_name, mime: row.mime }, { headers: noStore }) : NextResponse.redirect(ext, { status: 302, headers: noStore });
  }

  let db;
  try { db = createAdminClient(); } catch { return err(503, "Files are taking a nap right now. Please try again in a minute.", html); }

  if (view) {
    // Streamed through this server: the browser never learns a storage URL, and nothing tells it to save the file.
    const { data, error } = await db.storage.from(BUCKET).download(row.file_path);
    if (error || !data) return err(503, "Files are taking a nap right now. Please try again in a minute.", false);
    return new NextResponse(data.stream(), {
      headers: {
        ...noStore,
        "Content-Type": row.mime ?? "application/octet-stream",
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  }

  if (!row.allow_download) return err(403, "This file can be read inside lockin. but not downloaded.", html);

  try {
    const { data: signed, error } = await db.storage.from(BUCKET)
      .createSignedUrl(row.file_path, SIGNED_URL_SECONDS, download ? { download: row.file_name || true } : undefined);
    if (error || !signed?.signedUrl) return err(503, "Files are taking a nap right now. Please try again in a minute.", html);
    return wantJson ? NextResponse.json({ url: signed.signedUrl, name: row.file_name, mime: row.mime }, { headers: noStore }) : NextResponse.redirect(signed.signedUrl, { status: 302, headers: noStore });
  } catch {
    return err(503, "Files are taking a nap right now. Please try again in a minute.", html);
  }
}
