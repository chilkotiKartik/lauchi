"use server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { studySchema } from "@/lib/schemas";

export type ProfileState = { status: "idle" | "saved" | "error"; message?: string };

export async function updateProfile(_prev: ProfileState, form: FormData): Promise<ProfileState> {
  const s = await getSession();
  if (!s) return { status: "error", message: "Your session expired. Log in again." };
  const parsed = studySchema.safeParse({
    name: form.get("name"), branch: form.get("branch"), year: 1,
    semester: Number(form.get("semester")), dailyGoalXp: Number(form.get("goal")), timezone: s.profile.timezone,
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };
  const v = parsed.data;
  const { error } = await s.supabase.from("profiles")
    .update({ name: v.name, branch: v.branch, semester: v.semester, daily_goal_xp: v.dailyGoalXp }).eq("id", s.user.id);
  if (error) return { status: "error", message: "We couldn't save that. Try again." };
  revalidatePath("/", "layout");
  return { status: "saved", message: "Saved." };
}
