import { z } from "zod";

/** Pure helpers shared by the browser UI, the API routes and the cron job. No server-only imports here. */

export const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export const prefsSchema = z.object({
  streak: z.boolean(),
  exam: z.boolean(),
  /** Daily study reminder as "HH:MM" (24h, the student's own time), or null for none. */
  studyTime: z.string().regex(HHMM, "Use a time like 18:30").nullable(),
});
export type PushPrefs = z.infer<typeof prefsSchema>;
export const DEFAULT_PREFS: PushPrefs = { streak: true, exam: true, studyTime: null };

/** The browsers' real push services. Reminders are only ever sent to these, so a crafted "endpoint" cannot make the
 * server POST to any other host (SSRF). */
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^android\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/, /^([a-z0-9-]+\.)*push\.apple\.com$/, /^([a-z0-9-]+\.)*notify\.windows\.com$/];
export function isPushEndpoint(u: string): boolean {
  try { const url = new URL(u); return url.protocol === "https:" && !url.port && PUSH_HOSTS.some((h) => h.test(url.hostname)); } catch { return false; }
}
export const subscribeSchema = z.object({
  endpoint: z.string().url().max(1000).refine(isPushEndpoint, "That isn't a browser push service"),
  keys: z.object({ p256dh: z.string().min(20).max(200), auth: z.string().min(8).max(100) }),
  prefs: prefsSchema.default(DEFAULT_PREFS),
});
export const unsubscribeSchema = z.object({ endpoint: z.string().url().max(1000) });

/** Postgres `time` comes back as "HH:MM:SS"; the UI works in "HH:MM". */
export const toHHMM = (t: string | null | undefined) => (t ? t.slice(0, 5) : null);

export type ReminderKind = "streak" | "exam" | "study" | "daily" | "sunday" | "sunday_prep";
export type Reminder = { kind: ReminderKind; streak?: number | null; days_left?: number | null; name?: string };
export type PushMessage = { title: string; body: string; url: string; tag: string };

export function buildMessage(r: Reminder): PushMessage {
  if (r.kind === "streak") {
    const n = Math.max(1, r.streak ?? 1);
    return {
      title: `Your ${n}-day streak ends tonight`,
      body: "Do one quick quiz or a few formula cards to keep it alive.",
      url: "/home", tag: "streak",
    };
  }
  if (r.kind === "exam") {
    const d = r.days_left ?? 7;
    return d <= 1
      ? { title: "Exam tomorrow. Mock test day!", body: "Take one last timed mock test, then rest well tonight.", url: "/mock", tag: "exam" }
      : { title: `${d} days to your exam`, body: "A full mock test today shows what to revise this week.", url: "/mock", tag: "exam" };
  }
  if (r.kind === "daily") {
    const n = r.streak ?? 0;
    return {
      title: "Your 5-question challenge is waiting",
      body: n > 0 ? `About 3 minutes keeps your ${n}-day streak going and earns bonus XP.` : "About 3 minutes, five questions, bonus XP. Start today's challenge.",
      url: "/daily", tag: "daily",
    };
  }
  if (r.kind === "sunday") return { title: "Your Sunday Quest is open", body: "12 questions from what you studied this week. Finish before midnight for up to 78 XP.", url: "/sunday", tag: "sunday" };
  if (r.kind === "sunday_prep") return { title: "Sunday Quest tomorrow", body: "See which units it covers and do a quick revision tonight.", url: "/sunday", tag: "sunday" };
  return { title: "Time to study", body: "Your daily study time is here. Even 15 minutes counts.", url: "/home", tag: "study" };
}

/** The browser wants the VAPID public key as bytes. */
export function urlBase64ToUint8Array(b64: string): Uint8Array<ArrayBuffer> {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** A push service answers 404/410 when the browser has dropped the subscription: delete it. */
export const isGone = (status: number | undefined) => status === 404 || status === 410;
