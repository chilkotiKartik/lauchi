"use client";
import { useCallback, useEffect, useState } from "react";
import { DEFAULT_PREFS, urlBase64ToUint8Array, type PushPrefs } from "@/lib/push";

type Status = "loading" | "unsupported" | "off-site" | "blocked" | "off" | "on";
const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

async function registration() {
  if (process.env.NODE_ENV !== "production") return (await navigator.serviceWorker.getRegistration()) ?? null;
  return navigator.serviceWorker.ready;
}
const post = (url: string, body: unknown) =>
  fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

/** Settings card: switch reminders on or off, and choose which ones. */
export function NotificationSettings() {
  const [status, setStatus] = useState<Status>("loading");
  const [prefs, setPrefs] = useState<PushPrefs>(DEFAULT_PREFS);
  const [studyOn, setStudyOn] = useState(false);
  const [time, setTime] = useState("18:00");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const apply = useCallback((p: PushPrefs) => { setPrefs(p); setStudyOn(Boolean(p.studyTime)); if (p.studyTime) setTime(p.studyTime); }, []);

  useEffect(() => {
    let live = true;
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return live && setStatus("unsupported");
      if (!VAPID) return live && setStatus("off-site");
      if (Notification.permission === "denied") return live && setStatus("blocked");
      const reg = await registration();
      const sub = await reg?.pushManager.getSubscription();
      if (!live) return;
      if (!sub) return setStatus("off");
      const r = await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(sub.endpoint)}`).then((x) => x.json()).catch(() => null);
      if (!live) return;
      if (r?.subscribed) { apply(r.prefs); setStatus("on"); } else setStatus("off");
    })().catch(() => live && setStatus("unsupported"));
    return () => { live = false; };
  }, [apply]);

  const current = (): PushPrefs => ({ ...prefs, studyTime: studyOn ? time : null });

  async function enable() {
    setBusy(true); setMsg(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setStatus(perm === "denied" ? "blocked" : "off"); return; }
      const reg = await registration();
      if (!reg || !VAPID) throw new Error("no worker");
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID) }));
      const res = await post("/api/push/subscribe", { ...sub.toJSON(), prefs: current() });
      if (!res.ok) { await sub.unsubscribe().catch(() => {}); throw new Error("save"); }
      setStatus("on"); setMsg({ ok: true, text: "Reminders are on." });
    } catch { setMsg({ ok: false, text: "Couldn't switch reminders on. Try again in a moment." }); }
    finally { setBusy(false); }
  }

  async function save() {
    setBusy(true); setMsg(null);
    try {
      const sub = await (await registration())?.pushManager.getSubscription();
      if (!sub) throw new Error("no sub");
      const res = await post("/api/push/subscribe", { ...sub.toJSON(), prefs: current() });
      if (!res.ok) throw new Error("save");
      setMsg({ ok: true, text: "Saved." });
    } catch { setMsg({ ok: false, text: "Couldn't save. Try again." }); }
    finally { setBusy(false); }
  }

  async function disable() {
    setBusy(true); setMsg(null);
    try {
      const sub = await (await registration())?.pushManager.getSubscription();
      if (sub) { await post("/api/push/unsubscribe", { endpoint: sub.endpoint }); await sub.unsubscribe(); }
      setStatus("off"); setMsg({ ok: true, text: "Reminders are off." });
    } catch { setMsg({ ok: false, text: "Couldn't switch reminders off. Try again." }); }
    finally { setBusy(false); }
  }

  const choices = (
    <fieldset className="flex flex-col gap-3 border-0 p-0">
      <legend className="mb-1 font-extrabold text-head">Remind me about</legend>
      <label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" className="h-5 w-5 accent-[var(--green)]" checked={prefs.streak} onChange={(e) => setPrefs({ ...prefs, streak: e.target.checked })} />
        <span>My streak, if I haven&apos;t studied by the evening</span>
      </label>
      <label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" className="h-5 w-5 accent-[var(--green)]" checked={prefs.exam} onChange={(e) => setPrefs({ ...prefs, exam: e.target.checked })} />
        <span>My exam, 7 days and 1 day before</span>
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-h-11 items-center gap-3">
          <input type="checkbox" className="h-5 w-5 accent-[var(--green)]" checked={studyOn} onChange={(e) => setStudyOn(e.target.checked)} />
          <span>A daily study time</span>
        </label>
        <label className="flex items-center gap-2">
          <span className="sr-only">Study reminder time</span>
          <input type="time" className="field !w-auto" value={time} disabled={!studyOn} onChange={(e) => setTime(e.target.value)} />
        </label>
      </div>
    </fieldset>
  );

  return (
    <section aria-labelledby="notif-h" className="card flex flex-col gap-4">
      <h2 id="notif-h" className="text-xl font-black text-head">Reminders</h2>
      {status === "loading" && <p className="text-muted">Checking this device…</p>}
      {status === "unsupported" && <p>This browser can&apos;t show reminders. On iPhone, first add lockin. to your Home Screen, then come back here.</p>}
      {status === "off-site" && <p>Reminders aren&apos;t switched on for this site yet. Check back soon.</p>}
      {status === "blocked" && <p>Notifications are blocked for lockin. Allow them in your browser&apos;s site settings, then reload this page.</p>}
      {status === "off" && (<>
        {choices}
        <button type="button" className="btn self-start" disabled={busy} onClick={enable}>{busy ? "Switching on…" : "Turn on reminders"}</button>
      </>)}
      {status === "on" && (<>
        <p className="ok" role="status">Reminders are on for this device.</p>
        {choices}
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save choices"}</button>
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={disable}>Turn off</button>
        </div>
      </>)}
      {msg && <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "ok" : "err"}>{msg.text}</p>}
    </section>
  );
}
