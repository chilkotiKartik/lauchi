"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { localDay } from "@/lib/insights";
import { addDays } from "@/lib/plan";

export type SettingsState = { status: "idle" | "saved" | "error"; message?: string };

const examSchema = z.object({
  examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date").nullable(),
  hours: z.number().int().min(1, "Study at least 1 hour a day").max(12, "12 hours a day is the most we can plan"),
});

export async function saveExam(_prev: SettingsState, form: FormData): Promise<SettingsState> {
  const s = await getSession();
  if (!s) return { status: "error", message: "Your session expired. Log in again." };
  const raw = String(form.get("examDate") ?? "").trim();
  const parsed = examSchema.safeParse({ examDate: raw === "" ? null : raw, hours: Number(form.get("hours")) });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };
  const { examDate, hours } = parsed.data;
  if (examDate) {
    if (Number.isNaN(Date.parse(examDate + "T00:00:00Z")) || new Date(examDate + "T00:00:00Z").toISOString().slice(0, 10) !== examDate) return { status: "error", message: "Pick a valid date" };
    const today = localDay(new Date(), s.profile.timezone);
    if (examDate < today) return { status: "error", message: "That date is in the past" };
    if (examDate > addDays(today, 730)) return { status: "error", message: "Pick a date within the next two years" };
  }
  const { error } = await s.supabase.from("profiles").update({ exam_date: examDate, study_hours: hours }).eq("id", s.user.id);
  if (error) return { status: "error", message: "We couldn't save that. Try again." };
  revalidatePath("/", "layout");
  return { status: "saved", message: examDate ? "Saved. Your plan is ready." : "Exam date cleared." };
}

/** Permanently deletes the account. Foreign keys cascade to every table that holds the student's data. */
export async function deleteAccount(_prev: SettingsState, form: FormData): Promise<SettingsState> {
  const s = await getSession();
  if (!s) return { status: "error", message: "Your session expired. Log in again." };
  if (String(form.get("confirm") ?? "").trim() !== "DELETE") return { status: "error", message: "Type DELETE in capital letters to confirm." };
  try {
    const { error } = await createAdminClient().auth.admin.deleteUser(s.user.id);
    if (error) return { status: "error", message: "We couldn't delete your account. Try again, or contact us." };
  } catch { return { status: "error", message: "Account deletion isn't configured on this server." }; }
  await s.supabase.auth.signOut().catch(() => {});
  redirect("/");
}

/** Theme is a plain preference cookie (not a login cookie), so the server can paint the right colours on first load. */
export async function setTheme(theme: string): Promise<void> {
  if (theme !== "dark" && theme !== "light" && theme !== "system") return;
  (await cookies()).set("lockin-theme", theme, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  revalidatePath("/", "layout");
}
