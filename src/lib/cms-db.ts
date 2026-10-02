import "server-only";
import type { Lesson } from "@/content/lessons/types";
import type { Question } from "@/labs/experiments/types";
import { createClient } from "@/lib/supabase/server";
import { getPublicEnv } from "@/lib/env";
import { validateLesson } from "@/lib/cms-lessons";
import { rowToQuestion } from "@/lib/cms-lab";

/** The published lesson for a topic ("COURSE:unit:topic"), or null. Uses the student's session, so RLS shows published rows only. */
export async function getPublishedLesson(course: string, unit: number, topic: number): Promise<Lesson | null> {
  if (!getPublicEnv()) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("cms_lessons").select("body").eq("course", course).eq("unit", unit).eq("topic", topic).eq("status", "published").limit(1);
    if (error || !data?.length) return null;
    const v = validateLesson((data[0] as { body: unknown }).body, { strict: true });
    return v.ok ? v.lesson : null;
  } catch { return null; }
}

/** Published admin-written questions for a lab. */
export async function getPublishedLabQuestions(labId: string): Promise<Question[]> {
  if (!getPublicEnv()) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("cms_lab_questions").select("id,payload,created_at").eq("lab_id", labId).eq("status", "published").order("created_at", { ascending: true }).limit(50);
    if (error || !data) return [];
    return (data as { id: string; payload: unknown }[]).map(rowToQuestion).filter((q): q is Question => q !== null);
  } catch { return []; }
}
