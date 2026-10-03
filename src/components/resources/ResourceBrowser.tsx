"use client";
import { useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { setResourceSeen } from "@/app/(app)/resources/actions";
import { canPreview, filterItems, formatSize, groupItems, kindLabel, KINDS, KIND_LABEL, type ResourceItem, type ResourceKind } from "@/lib/resources";
import { PreviewDialog } from "./PreviewDialog";

export type CourseInfo = { code: string; short: string; name: string; units: string[] };

export function ResourceBrowser({ items, courses, openId, watermark }: { items: ResourceItem[]; courses: CourseInfo[]; openId?: string; watermark?: string }) {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<ResourceKind | "all">("all");
  const [course, setCourse] = useState("all");
  const [todo, setTodo] = useState(false);
  const [seen, setSeen] = useState<Set<string>>(() => new Set(items.filter((i) => i.seen).map((i) => i.id)));
  // /resources?open=<id> (used by the unit pages) opens that file in the reader straight away
  const [preview, setPreview] = useState<{ item: ResourceItem; opener: HTMLElement | null } | null>(() => {
    const it = openId ? items.find((r) => r.id === openId && canPreview(r)) : undefined;
    return it ? { item: it, opener: null } : null;
  });
  const [note, setNote] = useState<string | null>(null);
  const [, start] = useTransition();
  const reduce = useReducedMotion();

  const withSeen = items.map((r) => ({ ...r, seen: seen.has(r.id) }));
  const shown = filterItems(withSeen.filter((r) => course === "all" || r.course === course), q, kind, todo);
  const groups = groupItems(shown, courses.map((c) => c.code));
  const info = (code: string) => courses.find((c) => c.code === code);
  const have = new Set(items.map((i) => i.course));

  function toggle(id: string, done: boolean) {
    setNote(null);
    setSeen((s) => { const n = new Set(s); if (done) n.add(id); else n.delete(id); return n; });
    start(async () => {
      const r = await setResourceSeen(id, done);
      if (!r.ok) {
        setSeen((s) => { const n = new Set(s); if (done) n.delete(id); else n.add(id); return n; });
        setNote("We couldn't save that tick. Check your connection and try again.");
      }
    });
  }
  function open(item: ResourceItem, el: HTMLElement) {
    // phones without a built-in PDF viewer would show an empty frame, so send them to a tab instead
    if (item.mime === "application/pdf" && typeof navigator !== "undefined" && navigator.pdfViewerEnabled === false) {
      window.open(`/api/resources/${item.id}`, "_blank", "noopener");
      return;
    }
    setPreview({ item, opener: el });
  }

  if (items.length === 0) {
    return <p className="card text-muted">Nothing has been shared for your subjects yet. When a teacher adds notes or an assignment, it shows up here with a <b>New</b> badge.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="card flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_14rem]">
          <div className="flex flex-col gap-1">
            <label htmlFor="res-q" className="text-sm font-black text-head">Search</label>
            <input id="res-q" type="search" className="field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title, subject or word…" autoComplete="off" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="res-c" className="text-sm font-black text-head">Subject</label>
            <select id="res-c" className="field" value={course} onChange={(e) => setCourse(e.target.value)}>
              <option value="all">All subjects</option>
              {courses.filter((c) => have.has(c.code)).map((c) => <option key={c.code} value={c.code}>{c.short}</option>)}
            </select>
          </div>
        </div>
        <div role="group" aria-label="Filter by kind" className="flex flex-wrap gap-2">
          {(["all", ...KINDS] as const).map((k) => (
            <button key={k} type="button" aria-pressed={kind === k} className={`seg ${kind === k ? "is-on" : ""}`} onClick={() => setKind(k)}>{k === "all" ? "All" : KIND_LABEL[k]}</button>
          ))}
        </div>
        <label className="flex w-fit items-center gap-2 text-sm font-extrabold text-head">
          <input type="checkbox" checked={todo} onChange={(e) => setTodo(e.target.checked)} className="h-5 w-5" /> Hide the ones I&apos;ve marked done
        </label>
      </div>

      <p className="sr-only" role="status">{shown.length} {shown.length === 1 ? "item" : "items"} shown</p>
      {note && <p className="err" role="alert">{note}</p>}
      {groups.length === 0 && <p className="card text-muted">Nothing matches. Try a different word or clear the filters.</p>}

      {groups.map((g) => (
        <section key={g.course} className="card flex flex-col gap-4" aria-labelledby={`res-${g.course}`}>
          <h2 id={`res-${g.course}`} className="text-xl">
            <span className="text-xs font-black tracking-wide text-muted">{g.course}</span><br />{info(g.course)?.name ?? g.course}
            <span className="pill ml-2 align-middle text-sm !px-3">{g.count}</span>
          </h2>
          {g.units.map((u) => (
            <div key={u.unit} className="flex flex-col gap-2">
              <h3 className="text-base">Unit {u.unit}{info(g.course)?.units[u.unit - 1] ? `: ${info(g.course)!.units[u.unit - 1]}` : ""}</h3>
              <ul className="flex flex-col gap-2">
                <AnimatePresence initial={false}>
                  {u.items.map((r) => (
                    <motion.li key={r.id} layout={!reduce} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.18 }}
                      className={`flex flex-col gap-2 rounded-2xl border-2 p-3 ${r.seen ? "border-line bg-soft" : "border-line"}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <b className="min-w-0 break-words text-head">{r.title}</b>
                        {r.fresh && <span className="chip chip-hot">New</span>}
                        <span className="chip chip-cool">{kindLabel(r.kind)}</span>
                        {r.seen && <span className="chip chip-soft">Done</span>}
                      </div>
                      {r.description && <p className="text-[0.95rem]">{r.description}</p>}
                      <p className="text-xs text-muted">{[r.topic ? `Topic ${r.topic}` : "Whole unit", r.file_name, formatSize(r.size_bytes)].filter(Boolean).join(" · ")}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        {canPreview(r) && <button type="button" className="btn btn-blue !px-4 !py-2 !text-sm" onClick={(e) => open(r, e.currentTarget)} aria-label={`Read ${r.title}`}>Read</button>}
                        {!r.file_path && <a className="btn btn-ghost !px-4 !py-2 !text-sm no-underline" href={`/api/resources/${r.id}`} target="_blank" rel="noopener noreferrer" aria-label={`Open link: ${r.title}`}>Open link</a>}
                        {r.file_path && r.allow_download && <a className="btn btn-ghost !px-4 !py-2 !text-sm no-underline" href={`/api/resources/${r.id}?download=1`} aria-label={`Download ${r.title}`}>Download</a>}
                        {r.file_path && !r.allow_download && <span className="chip chip-soft" title="Your teacher shared this to read inside lockin.">Read-only</span>}
                        <button type="button" aria-pressed={r.seen} className={`seg ml-auto ${r.seen ? "is-on is-green" : ""}`} onClick={() => toggle(r.id, !r.seen)} aria-label={`${r.seen ? "Unmark" : "Mark"} ${r.title} as done`}>{r.seen ? "✓ Done" : "Mark as done"}</button>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          ))}
        </section>
      ))}

      <PreviewHost state={preview} onClose={() => setPreview(null)} watermark={watermark} />
    </div>
  );
}

function PreviewHost({ state, onClose, watermark }: { state: { item: ResourceItem; opener: HTMLElement | null } | null; onClose: () => void; watermark?: string }) {
  return <AnimatePresence>{state && <PreviewDialog key={state.item.id} item={state.item} opener={state.opener} onClose={onClose} watermark={watermark} />}</AnimatePresence>;
}
