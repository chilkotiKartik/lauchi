"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Rich } from "@/lib/rich";
import { importPyqTicks, pyqTicks, setPyqTick } from "@/app/(app)/revise/actions";
import { ListenButton, MicButton } from "@/components/Voice";
import { VideoButton } from "@/components/Videos";
import type { Pyq } from "@/lib/pyq";
import { ReportButton } from "@/components/admin/ReportButton";
import { ArtAsk } from "@/components/art";

const strip = (s: string) => s.replace(/<[^>]*>/g, "");
type Kind = "all" | "theory" | "numerical";

function Heat({ n }: { n: number | null }) {
  if (!n) return <span className="chip chip-soft">New pattern</span>;
  const cls = n >= 8 ? "chip-hot" : n >= 5 ? "chip-warm" : "chip-cool";
  return <span className={`chip ${cls}`} title={`Asked in ${n} past papers`}>{n >= 8 && <span aria-hidden className="flame-dot" />}Asked {n}×</span>;
}

const LOCAL_KEY = "lockin.pyq.done"; // where ticks lived before they moved to the account

/** Filterable list of one unit's previous-year questions, with read-aloud, lectures, Ask Lochi and a "practised" tick.
 * Ticks are stored on the account (as "Revise today" items, so a practised question comes back for spaced review). */
export function PyqBrowser({ code, subject, unit, unitTitle, pyqs }: { code: string; subject: string; unit: number; unitTitle: string; pyqs: Pyq[] }) {
  const [kind, setKind] = useState<Kind>("all");
  const [hot, setHot] = useState(false);
  const [hideDone, setHideDone] = useState(false);
  const [q, setQ] = useState("");
  const [done, setDone] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        // move ticks saved on this device to the account once, then forget them locally
        let local: unknown = null;
        try { local = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "null"); } catch { /* storage blocked */ }
        if (Array.isArray(local) && local.length) {
          const r = await importPyqTicks(local.filter((x): x is string => typeof x === "string").slice(0, 500));
          if (r.ok) { try { localStorage.removeItem(LOCAL_KEY); } catch { /* ignore */ } }
        }
        const ids = await pyqTicks(code);
        if (live) setDone(ids.map((id) => `${code}:${id}`));
      } catch { /* offline: show no ticks rather than break the page */ } finally {
        if (live) setLoaded(true);
      }
    })();
    return () => { live = false; };
  }, [code]);
  const reduce = useReducedMotion();
  const doneSet = useMemo(() => new Set(done), [done]);
  const key = (p: Pyq) => `${code}:${p.id}`;

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return pyqs
      .filter((p) => kind === "all" || p.kind === kind)
      .filter((p) => !hot || (p.repeated ?? 0) >= 5)
      .filter((p) => !hideDone || !doneSet.has(`${code}:${p.id}`))
      .filter((p) => !needle || strip(p.title + " " + p.parts.map((x) => x.text).join(" ")).toLowerCase().includes(needle))
      .sort((a, b) => (b.repeated ?? 0) - (a.repeated ?? 0));
  }, [pyqs, kind, hot, hideDone, q, doneSet, code]);

  const nDone = pyqs.filter((p) => doneSet.has(key(p))).length;
  const toggle = (p: Pyq) => {
    const k = key(p), on = !doneSet.has(k);
    setDone((d) => (on ? [...d, k] : d.filter((x) => x !== k)));
    setPyqTick({ code, id: p.id, on }).then((r) => {
      if (!r.ok) setDone((d) => (on ? d.filter((x) => x !== k) : [...d, k])); // undo if it didn't save
    }, () => setDone((d) => (on ? d.filter((x) => x !== k) : [...d, k])));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="card flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-black text-head">{nDone} of {pyqs.length} question sets practised</p>
          <span className="text-sm text-muted">Ticks follow you on every device</span>
        </div>
        <div className="bar" role="progressbar" aria-label="Unit PYQs practised" aria-valuemin={0} aria-valuemax={pyqs.length} aria-valuenow={nDone}><i style={{ width: `${(nDone / Math.max(1, pyqs.length)) * 100}%` }} /></div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter questions">
          {(["all", "theory", "numerical"] as const).map((k) => (
            <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={`seg ${kind === k ? "is-on" : ""}`}>{k === "all" ? "All" : k === "theory" ? "Theory & derivations" : "Numericals"}</button>
          ))}
          <button type="button" aria-pressed={hot} onClick={() => setHot(!hot)} className={`seg ${hot ? "is-on" : ""}`}>Asked 5+ times</button>
          <button type="button" aria-pressed={hideDone} onClick={() => setHideDone(!hideDone)} className={`seg ${hideDone ? "is-on" : ""}`}>Hide practised</button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="pyq-q" className="sr-only">Search this unit&apos;s questions</label>
          <input id="pyq-q" type="search" className="field min-w-0 flex-1" placeholder="Search e.g. Newton's rings, derive, numerical…" value={q} onChange={(e) => setQ(e.target.value)} />
          <MicButton label="Say it" onText={(t) => setQ(t)} />
        </div>
      </div>

      <p className="text-sm text-muted" role="status">{list.length} {list.length === 1 ? "question set" : "question sets"} · most repeated first</p>
      <ol className="flex flex-col gap-4">
        <AnimatePresence initial={false}>
          {list.map((p, i) => {
            const isDone = doneSet.has(key(p));
            const speech = `${p.title}. ${p.parts.map((x) => x.text).join(". ")}`;
            const query = `${strip(p.title).replace(/[.?…]+$/, "")} ${subject}`;
            return (
              <motion.li key={p.id} layout={!reduce} initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.28, delay: reduce ? 0 : Math.min(i, 8) * 0.03 }}
                className={`card pyq-card flex flex-col gap-3 ${isDone ? "is-done" : ""}`} data-kind={p.kind}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="chip chip-id">{p.id}</span>
                  <Heat n={p.repeated} />
                  {p.marks && <span className="chip chip-soft">{p.marks} marks</span>}
                  <span className={`chip ${p.kind === "numerical" ? "chip-num" : "chip-th"}`}>{p.kind === "numerical" ? "Numerical" : "Theory"}</span>
                </div>
                <h3 className="text-lg leading-snug"><Rich text={p.title} /></h3>
                {p.parts.length > 0 && (
                  <ol className="flex flex-col gap-2">
                    {p.parts.map((x, k) => (
                      <li key={k} className="rounded-xl bg-soft p-3 text-[0.97rem] leading-relaxed">
                        {p.parts.length > 1 && <b className="mr-1 text-head">({String.fromCharCode(97 + k)})</b>}
                        <Rich text={x.text} />
                        {x.marks && <span className="ml-2 whitespace-nowrap text-xs font-black text-muted">[{x.marks} marks]</span>}
                      </li>
                    ))}
                  </ol>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => toggle(p)} aria-pressed={isDone} disabled={!loaded} className={`seg ${isDone ? "is-on is-green" : ""}`}>{isDone ? "✓ Practised" : "Mark practised"}</button>
                  <ListenButton text={speech} />
                  <VideoButton query={query} label="Lecture" className="voice-btn" />
                  <Link className="voice-btn no-underline" href={`/ask?course=${code}&unit=${unit}&pyq=${encodeURIComponent(p.id)}&q=${encodeURIComponent(`Explain how to answer this ${subject} exam question (${unitTitle}), step by step: ${strip(speech).slice(0, 600)}`)}`}>
                    <ArtAsk size={20} /> Ask Lochi
                  </Link>
                  <ReportButton where="pyq" refId={p.id} course={code} unit={unit} />
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
      {list.length === 0 && <p className="card text-muted">No questions match. Clear a filter to see more.</p>}
      <p className="sr-only">Unit {unit}</p>
    </div>
  );
}
