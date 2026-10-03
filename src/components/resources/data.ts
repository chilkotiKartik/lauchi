import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { RESOURCE_COLS, toItems, type ResourceItem, type ResourceRow } from "@/lib/resources";
import { canSeeCourse, type Viewer } from "@/lib/stream";

/** Visible (not hidden, by RLS) resources the student's stream may see, newest first, with their own "done" ticks. */
export async function loadResources(
  supabase: SupabaseClient, branch: Viewer, opts: { course?: string; unit?: number; kind?: string; limit?: number } = {},
): Promise<ResourceItem[]> {
  try {
    const query = (cols: string) => {
      let q = supabase.from("resources").select(cols);
      if (opts.course) q = q.eq("course", opts.course);
      if (opts.unit) q = q.eq("unit", opts.unit);
      if (opts.kind) q = q.eq("kind", opts.kind);
      return q.order("created_at", { ascending: false }).limit(opts.limit ?? 1000);
    };
    let { data, error } = await query(RESOURCE_COLS);
    // before migration 0023 the allow_download column doesn't exist: list everything as view-only
    if (error) ({ data, error } = await query(RESOURCE_COLS.replace(",allow_download", "")));
    if (error || !data) return [];
    const rows = (data as unknown as ResourceRow[]).filter((r) => canSeeCourse(branch, r.course));
    if (!rows.length) return [];
    const { data: seen } = await supabase.from("resource_seen").select("resource_id").limit(5000);
    return toItems(rows, new Set(((seen ?? []) as { resource_id: string }[]).map((s) => s.resource_id)));
  } catch { return []; }
}
