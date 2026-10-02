import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Topic keys the signed-in student has completed. Row-level security limits this to their own rows. */
export async function doneTopics(supabase: SupabaseClient): Promise<Map<string, number>> {
  const { data } = await supabase.from("topic_progress").select("topic_key,best_score");
  return new Map((data ?? []).map((r: { topic_key: string; best_score: number }) => [r.topic_key, r.best_score]));
}
export const countDone = (done: Map<string, number>, prefix: string) => [...done.keys()].filter((k) => k.startsWith(prefix)).length;
