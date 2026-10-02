import { z } from "zod";
import { BRANCHES, GOALS } from "@/lib/academics";

const validZone = (tz: string) => {
  try { new Intl.DateTimeFormat("en", { timeZone: tz }); return true; } catch { return false; }
};

// Older browsers report legacy aliases that not every Postgres tz database knows; store the canonical IANA name.
const TZ_CANONICAL: Record<string, string> = { "Asia/Calcutta": "Asia/Kolkata", "Asia/Katmandu": "Asia/Kathmandu", "Asia/Saigon": "Asia/Ho_Chi_Minh", "Asia/Rangoon": "Asia/Yangon" };

export const nameSchema = z.string().trim().min(1, "Enter your name").max(60, "Name is too long")
  .refine((s) => !/[\u0000-\u001f\u007f<>]/.test(s), "Name has characters we can't accept");

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email").max(254);
export const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(72, "Password is too long");

export const studySchema = z.object({
  name: nameSchema,
  branch: z.enum(BRANCHES.map((b) => b.key) as [string, ...string[]]),
  year: z.literal(1),
  semester: z.union([z.literal(1), z.literal(2)]),
  dailyGoalXp: z.number().int().refine((n) => GOALS.some((g) => g.xp === n), "Pick one of the goals"),
  timezone: z.string().max(64).refine(validZone, "Unknown timezone").transform((tz) => TZ_CANONICAL[tz] ?? tz),
});
export type StudyInput = z.infer<typeof studySchema>;

export const onboardingSchema = studySchema.extend({ consent: z.literal(true, { error: "Please accept to continue" }) });
