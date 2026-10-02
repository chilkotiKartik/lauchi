"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export type Video = { id: string; title: string; channel: string; published: string };
type State = { status: "idle" | "loading" } | { status: "ok"; videos: Video[] } | { status: "off" | "error"; message: string; search: string };

const ytSearch = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
const thumb = (id: string) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
const memo = new Map<string, Video[]>();

/** Fetches lecture videos for a search phrase from our own /api/videos (which holds the API key). */
export function useVideos(query: string, enabled: boolean): State {
  const [st, setSt] = useState<{ q: string; s: State }>({ q: "", s: { status: "idle" } });
  useEffect(() => {
    if (!enabled || !query || memo.has(query)) return;
    let live = true;
    const ac = new AbortController();
    fetch(`/api/videos?q=${encodeURIComponent(query)}`, { signal: ac.signal })
      .then(async (r) => {
        const j = (await r.json().catch(() => ({}))) as { videos?: Video[]; message?: string; code?: string; search?: string };
        if (!live) return;
        if (r.ok && j.videos) { memo.set(query, j.videos); setSt({ q: query, s: { status: "ok", videos: j.videos } }); }
        else setSt({ q: query, s: { status: j.code === "not_configured" ? "off" : "error", message: j.message ?? "Videos couldn't load.", search: j.search ?? ytSearch(query) } });
      })
      .catch(() => { if (live) setSt({ q: query, s: { status: "error", message: "You seem to be offline.", search: ytSearch(query) } }); });
    return () => { live = false; ac.abort(); };
  }, [query, enabled]);
  if (!enabled || !query) return { status: "idle" };
  const cached = memo.get(query);
  if (cached) return { status: "ok", videos: cached };
  return st.q === query ? st.s : { status: "loading" };
}

/** A YouTube player that loads only when asked (privacy-enhanced domain, no autoplay until the student taps). */
export function Player({ video, autoplay = true }: { video: Video; autoplay?: boolean }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border-2 border-line bg-black">
      <iframe key={video.id} className="absolute inset-0 h-full w-full" title={video.title}
        src={`https://www.youtube-nocookie.com/embed/${video.id}?rel=0&modestbranding=1&playsinline=1${autoplay ? "&autoplay=1" : ""}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" loading="lazy" />
    </div>
  );
}

function Thumb({ v, on, onPick }: { v: Video; on: boolean; onPick: () => void }) {
  return (
    <button type="button" onClick={onPick} aria-pressed={on} className={`vid-card group ${on ? "is-on" : ""}`}>
      <span className="relative block aspect-video w-full overflow-hidden rounded-xl bg-soft">
        {/* eslint-disable-next-line @next/next/no-img-element -- remote YouTube thumbnail, no image optimiser needed */}
        <img src={thumb(v.id)} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        <span aria-hidden className="vid-play">▶</span>
      </span>
      <span className="line-clamp-2 text-left text-sm font-extrabold text-head">{v.title}</span>
      <span className="text-left text-xs text-muted">{v.channel}</span>
    </button>
  );
}

function Status({ s, query }: { s: State; query: string }) {
  if (s.status !== "ok" && s.status !== "off" && s.status !== "error") return <div className="grid gap-3 sm:grid-cols-2"><div className="skel aspect-video" /><div className="skel aspect-video" /></div>;
  if (s.status === "ok") return s.videos.length ? null : <p className="text-muted">No embeddable lectures found. <a href={ytSearch(query)} target="_blank" rel="noopener noreferrer">Search YouTube ↗</a></p>;
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-soft p-4" role="status">
      <p className="font-bold text-head">{s.message}</p>
      {s.status === "off" && <p className="text-sm text-muted">The site owner can turn on in-app videos by adding a free <code>YOUTUBE_API_KEY</code>. Until then:</p>}
      <a className="btn btn-ghost w-fit" href={s.search} target="_blank" rel="noopener noreferrer">Search on YouTube ↗</a>
    </div>
  );
}

/** Player + list of results for one search. Used inline on the videos page. */
export function VideoShelf({ query, title, lazy = false }: { query: string; title?: string; lazy?: boolean }) {
  const [go, setGo] = useState(!lazy);
  const s = useVideos(query, go);
  const [pick, setPick] = useState<string | null>(null);
  const videos = s.status === "ok" ? s.videos : [];
  const cur = videos.find((v) => v.id === pick) ?? videos[0] ?? null;
  return (
    <div className="flex flex-col gap-3">
      {title && <h3 className="text-lg">{title}</h3>}
      {!go && <button type="button" className="btn btn-ghost w-fit" onClick={() => setGo(true)}><span aria-hidden>▶</span> Show lectures</button>}
      {cur && <Player video={cur} autoplay={pick !== null} />}
      {go && <Status s={s} query={query} />}
      {videos.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {videos.map((v) => <li key={v.id}><Thumb v={v} on={v.id === cur?.id} onPick={() => setPick(v.id)} /></li>)}
        </ul>
      )}
      <p className="text-xs text-muted">Videos come from YouTube search, not from lockin. Pick teachers you trust.</p>
    </div>
  );
}

/** A button that opens a sheet with lecture videos for `query` and plays them right there. */
export function VideoButton({ query, label = "Watch a lecture", className = "btn btn-ghost" }: { query: string; label?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const dlg = useRef<HTMLDialogElement>(null);
  const reduce = useReducedMotion();
  const close = useCallback(() => { dlg.current?.close(); setOpen(false); }, []);
  useEffect(() => { if (open && dlg.current && !dlg.current.open) dlg.current.showModal(); }, [open]);
  const s = useVideos(query, open);
  const [pick, setPick] = useState<string | null>(null);
  const videos = s.status === "ok" ? s.videos : [];
  const cur = videos.find((v) => v.id === pick) ?? videos[0] ?? null;
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)} aria-haspopup="dialog">
        <span aria-hidden>▶</span> {label}
      </button>
      {open && (
        <dialog ref={dlg} className="video-dialog" aria-label={`Lectures: ${query}`} onClose={() => setOpen(false)} onClick={(e) => { if (e.target === dlg.current) close(); }}>
          <AnimatePresence>
            <motion.div initial={reduce ? false : { y: 40, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ duration: 0.25, ease: [0.2, 0.9, 0.3, 1] }}
              className="flex max-h-[90dvh] flex-col gap-3 overflow-y-auto p-4">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-xs font-black uppercase tracking-wide text-muted">Lectures for</p><h2 className="text-xl">{query}</h2></div>
                <button type="button" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-2xl text-muted hover:bg-soft" onClick={close} aria-label="Close videos">×</button>
              </div>
              {cur && <Player video={cur} autoplay={pick !== null} />}
              <Status s={s} query={query} />
              {videos.length > 1 && (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {videos.map((v) => <li key={v.id}><Thumb v={v} on={v.id === cur?.id} onPick={() => setPick(v.id)} /></li>)}
                </ul>
              )}
              <p className="text-xs text-muted">From YouTube search. lockin. doesn&apos;t make or check these videos.</p>
            </motion.div>
          </AnimatePresence>
        </dialog>
      )}
    </>
  );
}
