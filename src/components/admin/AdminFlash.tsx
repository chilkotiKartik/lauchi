"use client";
import { useEffect, useState } from "react";

/** Tell the admin page what just happened. Lives outside lists that remount after a refresh, so the message survives. */
export const flash = (ok: boolean, text: string) => window.dispatchEvent(new CustomEvent("admin:flash", { detail: { ok, text } }));

export function AdminFlash() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => {
    const on = (e: Event) => setMsg((e as CustomEvent<{ ok: boolean; text: string }>).detail);
    window.addEventListener("admin:flash", on);
    return () => window.removeEventListener("admin:flash", on);
  }, []);
  return <div aria-live="polite">{msg && <p className={msg.ok ? "ok" : "err"} role={msg.ok ? "status" : "alert"}>{msg.text}</p>}</div>;
}
