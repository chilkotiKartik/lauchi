import "server-only";
// Needs: npm i web-push @types/web-push
import webpush from "web-push";
import type { PushMessage } from "@/lib/push";

export type SendResult = { ok: true } | { ok: false; status?: number };
export type Target = { endpoint: string; p256dh: string; auth: string };

let ready: boolean | undefined;
/** True once VAPID keys are present in the environment. */
export function pushConfigured() {
  if (ready !== undefined) return ready;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return (ready = false);
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:hello@lockin.app", pub, priv);
  return (ready = true);
}

export async function sendPush(t: Target, msg: PushMessage): Promise<SendResult> {
  if (!pushConfigured()) return { ok: false };
  try {
    await webpush.sendNotification({ endpoint: t.endpoint, keys: { p256dh: t.p256dh, auth: t.auth } }, JSON.stringify(msg), { TTL: 60 * 60 * 6, urgency: "normal" });
    return { ok: true };
  } catch (e) {
    return { ok: false, status: (e as { statusCode?: number }).statusCode };
  }
}
