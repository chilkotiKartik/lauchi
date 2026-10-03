"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { ResourceItem } from "@/lib/resources";
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from "pdfjs-dist";

type Doc = { kind: "pdf"; pdf: PDFDocumentProxy; pages: { w: number; h: number }[] } | { kind: "image"; url: string };

/** pdf.js loads on demand (only when a student opens a PDF), with its worker served from this site. The legacy build
 * carries polyfills, so it also works on older phone browsers (the modern build needs very new JavaScript features). */
async function loadPdf(bytes: ArrayBuffer): Promise<PDFDocumentLoadingTask> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  if (!pdfjs.GlobalWorkerOptions.workerPort) {
    pdfjs.GlobalWorkerOptions.workerPort = new Worker(new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url), { type: "module" });
  }
  return pdfjs.getDocument({ data: new Uint8Array(bytes), enableXfa: false });
}

/** One page: a sized placeholder that is drawn to a canvas only when it scrolls near the viewport (fast for long PDFs). */
function Page({ pdf, n, w, h, width }: { pdf: PDFDocumentProxy; n: number; w: number; h: number; width: number }) {
  const holder = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const [near, setNear] = useState(n <= 2);
  useEffect(() => {
    const el = holder.current;
    if (!el || near) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setNear(true); }, { rootMargin: "800px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [near]);
  useEffect(() => {
    if (!near || !canvas.current || width <= 0) return;
    let cancelled = false;
    let task: { cancel: () => void; promise: Promise<void> } | null = null;
    (async () => {
      const page = await pdf.getPage(n);
      if (cancelled || !canvas.current) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const vp = page.getViewport({ scale: (width / w) * dpr });
      const c = canvas.current;
      c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
      const renderTask = page.render({ canvasContext: c.getContext("2d")!, viewport: vp } as any);
      task = renderTask as any;
      await (renderTask as any)?.promise?.catch(() => {});
    })();
    return () => { cancelled = true; task?.cancel(); };
  }, [near, pdf, n, w, width]);
  return (
    <div ref={holder} className="relative mx-auto bg-white shadow" style={{ width, height: (width * h) / w }}>
      <canvas ref={canvas} className="block h-full w-full" aria-label={`Page ${n}`} />
    </div>
  );
}

/**
 * In-app reader for a PDF or image. The bytes come from this server (/api/resources/<id>?view=1), never from a storage
 * link; PDFs are drawn page by page with pdf.js, so there is no browser PDF toolbar (no save / print button). A light
 * watermark with the student's email discourages sharing screenshots. Download appears only when the admin allowed it.
 */
export function PreviewDialog({ item, opener, onClose, watermark }: { item: ResourceItem; opener: HTMLElement | null; onClose: () => void; watermark?: string }) {
  const [doc, setDoc] = useState<Doc | null>(null);
  const [failed, setFailed] = useState(false);
  const [width, setWidth] = useState(0);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });

  useEffect(() => {
    const ctl = new AbortController();
    let objectUrl: string | null = null, task: PDFDocumentLoadingTask | null = null;
    (async () => {
      try {
        const r = await fetch(`/api/resources/${item.id}?view=1`, { signal: ctl.signal, cache: "no-store" });
        if (!r.ok) throw new Error(String(r.status));
        const bytes = await r.arrayBuffer();
        if (item.mime === "application/pdf") {
          task = await loadPdf(bytes);
          const pdf = await task.promise;
          const pages = await Promise.all(Array.from({ length: pdf.numPages }, async (_, i) => { const vp = (await pdf.getPage(i + 1)).getViewport({ scale: 1 }); return { w: vp.width, h: vp.height }; }));
          if (!ctl.signal.aborted) setDoc({ kind: "pdf", pdf, pages });
        } else {
          objectUrl = URL.createObjectURL(new Blob([bytes], { type: item.mime ?? "image/png" }));
          if (!ctl.signal.aborted) setDoc({ kind: "image", url: objectUrl });
        }
      } catch (e) { if ((e as { name?: string })?.name !== "AbortError") setFailed(true); }
    })();
    return () => { ctl.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); void task?.destroy(); };
  }, [item.id, item.mime]);

  // page width follows the reader's width (re-rendered sharply on resize)
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.min(1000, Math.floor(e.contentRect.width - 16))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    closeBtn.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); closeRef.current(); return; }
      // Ctrl/Cmd+S and Ctrl/Cmd+P would save or print the page behind the reader
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "p") && !item.allow_download) { e.preventDefault(); return; }
      if (e.key !== "Tab" || !box.current) return;
      const f = [...box.current.querySelectorAll<HTMLElement>("a[href],button:not([disabled])")];
      if (!f.length) return;
      const first = f[0], lastEl = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; opener?.focus(); };
  }, [opener, item.allow_download]);

  const pageCount = doc?.kind === "pdf" ? doc.pages.length : 0;
  return (
    <motion.div className="no-print fixed inset-0 z-50 grid place-items-center bg-black/60 p-2 sm:p-6" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduce ? undefined : { opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div ref={box} role="dialog" aria-modal="true" aria-labelledby="res-prev-t" initial={reduce ? false : { y: 24, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={reduce ? undefined : { y: 12, scale: 0.98 }}
        transition={{ duration: 0.2 }} className="flex h-[94dvh] w-full max-w-5xl flex-col gap-2 rounded-3xl border-2 border-line bg-card p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-0 flex-1">
            <h2 id="res-prev-t" className="break-words text-lg">{item.title}</h2>
            <p className="text-xs text-muted">{pageCount ? `${pageCount} page${pageCount === 1 ? "" : "s"} · ` : ""}{item.allow_download ? "You may download this file." : "Read-only: shared to read inside lockin."}</p>
          </div>
          {item.allow_download && <a className="btn btn-ghost !px-3 !py-2 !text-sm no-underline" href={`/api/resources/${item.id}?download=1`}>Download</a>}
          <button ref={closeBtn} type="button" className="btn !px-3 !py-2 !text-sm" onClick={onClose}>Close</button>
        </div>
        <div ref={scroller} className="relative min-h-0 flex-1 select-none overflow-auto rounded-2xl bg-soft p-2" onContextMenu={(e) => { if (!item.allow_download) e.preventDefault(); }}>
          {!doc && !failed && <p className="grid h-full place-items-center p-6 text-muted" role="status">Opening your file…</p>}
          {failed && <p className="err m-4" role="alert">We couldn&apos;t open this file. Check your connection and try again.</p>}
          {doc?.kind === "pdf" && width > 0 && (
            <div className="flex flex-col gap-3">
              {doc.pages.map((p, i) => <Page key={i} pdf={doc.pdf} n={i + 1} w={p.w} h={p.h} width={width} />)}
            </div>
          )}
          {doc?.kind === "image" && (
            // eslint-disable-next-line @next/next/no-img-element -- in-memory blob, not optimisable
            <img src={doc.url} alt={item.title} draggable={false} className="mx-auto max-h-full max-w-full object-contain" />
          )}
          {watermark && doc && !item.allow_download && (
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="grid h-[300%] w-[300%] -translate-x-1/3 -translate-y-1/3 rotate-[-24deg] grid-cols-3 content-start gap-x-24 gap-y-28 p-10 text-sm font-bold text-black/[0.07]">
                {Array.from({ length: 60 }, (_, i) => <span key={i} className="whitespace-nowrap">{watermark}</span>)}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
