"use client";
import { useEffect, useSyncExternalStore } from "react";

const subscribeOnline = (cb: () => void) => {
  window.addEventListener("online", cb); window.addEventListener("offline", cb);
  return () => { window.removeEventListener("online", cb); window.removeEventListener("offline", cb); };
};

/** True while the browser reports no connection. */
export const useOnline = () => useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);

/** Mount once in the signed-in layout: registers the service worker (production only) and shows an offline badge. */
export function PwaShell() {
  const online = useOnline();
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator) || !window.isSecureContext) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => { /* the app works fine without it */ });
  }, []);
  if (online) return null;
  return (
    <div role="status" aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-2 z-50 flex justify-center px-4 pt-[env(safe-area-inset-top)]">
      <span className="chip chip-warm !px-3 !py-1.5 !text-[13px] shadow-md">
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-orange" />Offline. Recent lessons still work.
      </span>
    </div>
  );
}
