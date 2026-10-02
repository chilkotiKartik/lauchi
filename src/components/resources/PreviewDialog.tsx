"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { ResourceItem } from "@/lib/resources";

type Loaded = { id: string; url: string | null; failed: boolean };

/** In-page preview of a PDF or image. The file is fetched through a short-lived signed URL; "Open in new tab" and "Download" always work. */
export function PreviewDialog({ item, opener, onClose }: { item: ResourceItem; opener: HTMLElement | null; onClose: () => void }) {
  const [res, setRes] = useState<Loaded | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });
  const state = res && res.id === item.id ? res : null;

  useEffect(() => {
    const ctl = new AbortController();
    fetch(`/api/resources/${item.id}?json=1`, { signal: ctl.signal, cache: "no-store" })
      .then(async (r) => { if (!r.ok) throw new Error(String(r.status)); return (await r.json()) as { url?: string }; })
      .then((j) => setRes({ id: item.id, url: j.url ?? null, failed: !j.url }))
      .catch((e: unknown) => { if ((e as { name?: string })?.name !== "AbortError") setRes({ id: item.id, url: null, failed: true }); });
    return () => ctl.abort();
  }, [item.id]);

  useEffect(() => {
    closeBtn.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); closeRef.current(); return; }
      if (e.key !== "Tab" || !box.current) return;
      const f = [...box.current.querySelectorAll<HTMLElement>("a[href],button:not([disabled])")];
      if (!f.length) return;
      const first = f[0], lastEl = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; opener?.focus(); };
  }, [opener]);

  const isImage = item.mime?.startsWith("image/");
  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-2 sm:p-6" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduce ? undefined : { opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div ref={box} role="dialog" aria-modal="true" aria-labelledby="res-prev-t" initial={reduce ? false : { y: 24, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={reduce ? undefined : { y: 12, scale: 0.98 }}
        transition={{ duration: 0.2 }} className="flex h-[92dvh] w-full max-w-4xl flex-col gap-2 rounded-3xl border-2 border-line bg-card p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="res-prev-t" className="min-w-0 flex-1 break-words text-lg">{item.title}</h2>
          <a className="btn btn-ghost !px-3 !py-2 !text-sm no-underline" href={`/api/resources/${item.id}`} target="_blank" rel="noopener noreferrer">Open in new tab</a>
          <a className="btn btn-ghost !px-3 !py-2 !text-sm no-underline" href={`/api/resources/${item.id}?download=1`}>Download</a>
          <button ref={closeBtn} type="button" className="btn !px-3 !py-2 !text-sm" onClick={onClose}>Close</button>
        </div>
        <div className="relative min-h-0 flex-1 overflow-auto rounded-2xl bg-soft">
          {!state && <p className="grid h-full place-items-center p-6 text-muted" role="status">Getting your file…</p>}
          {state?.failed && <p className="err m-4" role="alert">We couldn&apos;t open the preview. Try &ldquo;Open in new tab&rdquo; or Download instead.</p>}
          {state?.url && (isImage
            // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL, not optimisable
            ? <img src={state.url} alt={item.title} className="mx-auto max-h-full max-w-full object-contain" />
            : <iframe src={state.url} title={`Preview of ${item.title}`} className="h-full w-full border-0" />)}
        </div>
      </motion.div>
    </motion.div>
  );
}
