"use client";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Rich } from "@/lib/rich";
import type { Card } from "@/lib/cards";

/** Cards the student marked "knew it" for one deck, remembered on this device. */
function useKnown(key: string) {
  const sub = (cb: () => void) => { window.addEventListener("storage", cb); return () => window.removeEventListener("storage", cb); };
  const raw = useSyncExternalStore(sub, () => { try { return localStorage.getItem(key) ?? ""; } catch { return ""; } }, () => "");
  const known = useMemo(() => new Set(raw ? raw.split(",").map(Number) : []), [raw]);
  const save = (next: Set<number>) => { try { localStorage.setItem(key, [...next].join(",")); window.dispatchEvent(new StorageEvent("storage")); } catch { /* private mode */ } };
  return [known, save] as const;
}

/**
 * Formula cards, two ways:
 * - Study: one big card at a time. Recall the formula, tap to flip, then "Knew it" or "Again" (missed cards come back at
 *   the end of the round). Arrow keys / Space work too.
 * - See all: every formula of the unit open at once, for last-minute revision.
 */
export function FlipDeck({ cards, accent, deckKey }: { cards: Card[]; accent: string; deckKey: string }) {
  const [mode, setMode] = useState<"study" | "all">("study");
  const [known, saveKnown] = useKnown(`lockin.cards.${deckKey}`);
  const [queue, setQueue] = useState<number[]>(() => cards.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const idx = queue[pos];
  const done = pos >= queue.length;

  const next = (knew: boolean | null) => {
    if (knew !== null) {
      const k = new Set(known);
      if (knew) k.add(idx); else k.delete(idx);
      saveKnown(k);
      if (!knew) setQueue((q) => [...q, idx]); // see it again this round
    }
    setFlipped(false);
    setPos((p) => p + 1);
  };
  const restart = (only: "all" | "missed" | "shuffle") => {
    let q = cards.map((_, i) => i);
    if (only === "missed") q = q.filter((i) => !known.has(i));
    if (only === "shuffle") for (let i = q.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [q[i], q[j]] = [q[j], q[i]]; }
    setQueue(q.length ? q : cards.map((_, i) => i)); setPos(0); setFlipped(false);
  };

  useEffect(() => {
    if (mode !== "study") return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input,textarea,select")) return;
      if (e.key === " " || e.key === "Enter") { if (!done) { e.preventDefault(); setFlipped((f) => !f); } }
      else if (e.key === "ArrowRight") setPos((p) => Math.min(queue.length, p + 1));
      else if (e.key === "ArrowLeft") { setPos((p) => Math.max(0, p - 1)); setFlipped(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, done, queue.length]);

  const knownCount = cards.filter((_, i) => known.has(i)).length;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="How to revise" className="flex rounded-2xl border-2 border-line bg-soft p-1">
          {(["study", "all"] as const).map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} type="button" onClick={() => setMode(m)}
              className={`rounded-xl px-4 py-1.5 text-sm font-extrabold ${mode === m ? "bg-card text-head shadow-sm" : "text-muted"}`}>{m === "study" ? "Study" : "See all"}</button>
          ))}
        </div>
        <span className="ml-auto text-sm font-bold text-muted">{knownCount} of {cards.length} known</span>
      </div>

      {mode === "all" ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {cards.map((c, i) => (
            <li key={i} className="rounded-2xl border-2 bg-card p-4" style={{ borderColor: known.has(i) ? "var(--green)" : "var(--line)" }}>
              <p className="text-xs font-black uppercase tracking-wide text-muted">{known.has(i) ? "✓ known" : `Card ${i + 1}`}</p>
              <p className="font-black text-head"><Rich text={c.front} /></p>
              <p className="mt-1 rounded-xl px-3 py-2 font-extrabold leading-relaxed text-head" style={{ background: `color-mix(in srgb, ${accent} 14%, var(--card))` }}><Rich text={c.back} /></p>
            </li>
          ))}
        </ul>
      ) : done ? (
        <div className="card flex flex-col items-center gap-3 p-6 text-center" role="status">
          <p className="text-4xl" aria-hidden>🎉</p>
          <h3 className="text-2xl">Round complete</h3>
          <p className="text-muted">You know {knownCount} of {cards.length} formulas in this unit.</p>
          <div className="flex flex-wrap justify-center gap-2">
            {knownCount < cards.length && <button type="button" className="btn" onClick={() => restart("missed")}>Practise the {cards.length - knownCount} I missed</button>}
            <button type="button" className="btn btn-ghost" onClick={() => restart("shuffle")}>Shuffle and go again</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="bar" role="progressbar" aria-label="Cards done" aria-valuemin={0} aria-valuemax={queue.length} aria-valuenow={pos}><i style={{ width: `${(pos / queue.length) * 100}%` }} /></div>
          <div className="flip mx-auto w-full max-w-xl" data-on={flipped}>
            <div className="!min-h-[13rem] sm:!min-h-[15rem]">
              <button type="button" onClick={() => setFlipped(true)} aria-label={`${cards[idx].front}. Tap to show the formula.`} tabIndex={flipped ? -1 : 0} aria-hidden={flipped}
                className="face items-center justify-center text-center" style={{ background: `color-mix(in srgb, ${accent} 18%, var(--card))`, borderColor: accent, cursor: "pointer" }}>
                <span className="text-xs font-black uppercase tracking-wide text-muted">Card {pos + 1} of {queue.length} · recall it, then tap</span>
                <span className="text-2xl font-black text-head"><Rich text={cards[idx].front} /></span>
              </button>
              <button type="button" onClick={() => setFlipped(false)} aria-label="Formula. Tap to flip back." tabIndex={flipped ? 0 : -1} aria-hidden={!flipped}
                className="face back items-center justify-center text-center" style={{ background: "var(--card)", borderColor: accent, cursor: "pointer" }}>
                <span className="text-xs font-black uppercase tracking-wide text-muted">{cards[idx].front.replace(/<[^>]+>/g, "")}</span>
                <span className="text-xl font-extrabold leading-relaxed text-head"><Rich text={cards[idx].back} /></span>
              </button>
            </div>
          </div>
          {flipped ? (
            <div className="mx-auto grid w-full max-w-xl grid-cols-2 gap-3">
              <button type="button" className="btn btn-ghost" onClick={() => next(false)}>Again</button>
              <button type="button" className="btn" onClick={() => next(true)}>Knew it</button>
            </div>
          ) : (
            <button type="button" className="btn btn-blue mx-auto w-full max-w-xl" onClick={() => setFlipped(true)}>Show formula</button>
          )}
        </div>
      )}
    </div>
  );
}
