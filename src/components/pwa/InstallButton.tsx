"use client";
import { useState, useSyncExternalStore } from "react";
import { getInstallState, isIos, isStandalone, promptInstall, serverInstallState, subscribeInstall } from "./install-store";

const noop = () => () => {};
/** "Install lockin." on Android/Chrome; a "Share, then Add to Home Screen" hint on iPhone; nothing once installed. */
export function InstallButton({ className = "" }: { className?: string }) {
  const st = useSyncExternalStore(subscribeInstall, getInstallState, () => serverInstallState);
  const env = useSyncExternalStore(noop, () => (isStandalone() ? "app" : isIos() ? "ios" : "web"), () => "web");
  const [busy, setBusy] = useState(false);
  if (st.installed || env === "app") return null;
  if (st.canPrompt) {
    return (
      <button type="button" className={`btn ${className}`} disabled={busy}
        onClick={async () => { setBusy(true); try { await promptInstall(); } finally { setBusy(false); } }}>
        Install lockin.
      </button>
    );
  }
  if (env === "ios") {
    return (
      <p className={`rounded-2xl border-2 border-line bg-soft p-3 text-sm ${className}`}>
        <strong className="text-head">Install lockin. on your iPhone:</strong> tap <span aria-label="the Share button">Share</span>, then <strong>Add to Home Screen</strong>.
      </p>
    );
  }
  return null;
}
