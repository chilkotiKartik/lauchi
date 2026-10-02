"use client";

/** Log-out button. Clears the cached study pages on this device first, so the next person on a shared phone sees none of them. */
export function LogoutButton({ action }: { action: () => void | Promise<void> }) {
  function clear() {
    try {
      if ("caches" in window) void caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("lockin-pages")).map((k) => caches.delete(k)))).catch(() => {});
    } catch { /* nothing cached */ }
  }
  return <form action={action} onSubmit={clear}><button className="btn btn-ghost btn-wide">Log out</button></form>;
}
