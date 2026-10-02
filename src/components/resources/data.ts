import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { RESOURCE_COLS, toItems, type ResourceItem, type ResourceRow } from "@/lib/resources";
import { canSeeCourse } from "@/lib/stream";

/** Visible (not hidden, by RLS) resources the student's stream may see, newest first, with their own "done" ticks. */
export async function loadResources(
  supabase: SupabaseClient, branch: string | null | undefined, opts: { course?: string; unit?: number; kind?: string; limit?: number } = {},
): Promise<ResourceItem[]> {
  try {
    let q = supabase.from("resources").select(RESOURCE_COLS);
    if (opts.course) q = q.eq("course", opts.course);
    if (opts.unit) q = q.eq("unit", opts.unit);
    if (opts.kind) q = q.eq("kind", opts.kind);
    const { data, error } = await q.order("created_at", { ascending: false }).limit(opts.limit ?? 1000);
    if (error || !data) return [];
    const rows = (data as ResourceRow[]).filter((r) => canSeeCourse(branch, r.course));
    if (!rows.length) return [];
    const { data: seen } = await supabase.from("resource_seen").select("resource_id").limit(5000);
    return toItems(rows, new Set(((seen ?? []) as { resource_id: string }[]).map((s) => s.resource_id)));
  } catch { return []; }
}
