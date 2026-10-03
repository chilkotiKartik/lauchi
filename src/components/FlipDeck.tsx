"use client";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Rich } from "@/lib/rich";
import { CARD_PASS, CARD_XP, cardQuiz, type Card } from "@/lib/cards";
import { sfx } from "@/lib/sound";
import { awardCards } from "@/app/(app)/formulas/actions";

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
const hash = (t: string) => [...t].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0, 7);

export function FlipDeck({ cards, accent, deckKey, pool = [], course, unit }: { cards: Card[]; accent: string; deckKey: string; pool?: Card[]; course?: string; unit?: number }) {
  const [mode, setMode] = useState<"study" | "quiz" | "all">("study");
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
  const restart = (only: "all" | "missed" | "shuffle", list?: number[]) => {
    if (list) { setQueue(list); setPos(0); setFlipped(false); setMode("study"); return; }
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
  const canQuiz = cardQuiz(cards, pool, 1).length > 0;
  const mark = (i: number, knew: boolean) => { const k = new Set(known); if (knew) k.add(i); else k.delete(i); saveKnown(k); };
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="How to revise" className="flex rounded-2xl border-2 border-line bg-soft p-1">
          {(["study", "quiz", "all"] as const).filter((m) => m !== "quiz" || canQuiz).map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} type="button" onClick={() => setMode(m)}
              className={`rounded-xl px-4 py-1.5 text-sm font-extrabold ${mode === m ? "bg-card text-head shadow-sm" : "text-muted"}`}>{m === "study" ? "Study" : m === "quiz" ? "Quiz" : "See all"}</button>
          ))}
        </div>
        <span className="ml-auto text-sm font-bold text-muted">{knownCount} of {cards.length} known</span>
      </div>

      {mode === "quiz" ? (
        <CardQuiz key={deckKey} cards={cards} pool={pool} accent={accent} seed={hash(deckKey)} course={course} unit={unit} onMark={mark} onStudy={(list) => restart("all", list)} />
      ) : mode === "all" ? (
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
                <span className="text-xs font-black uppercase tracking-wide text-muted">{cards[idx].front.replace(/<\/?(sub|sup|b|i)>/g, "")}</span>
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

/**
 * Quiz mode: name on top, four formulas to choose from. Instant feedback with the right answer, a combo counter,
 * and XP once a day for 80% or better. Answers also update which cards count as known in Study mode.
 */
function CardQuiz({ cards, pool, accent, seed, course, unit, onMark, onStudy }: { cards: Card[]; pool: Card[]; accent: string; seed: number; course?: string; unit?: number; onMark: (i: number, knew: boolean) => void; onStudy: (missed: number[]) => void }) {
  const [round, setRound] = useState(0);
  const qs = useMemo(() => cardQuiz(cards, pool, seed + round * 977), [cards, pool, seed, round]);
  const [at, setAt] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [right, setRight] = useState<number[]>([]);
  const [missed, setMissed] = useState<number[]>([]);
  const [combo, setCombo] = useState(0);
  const [xp, setXp] = useState<number | null>(null);
  const q = qs[at];
  const done = at >= qs.length;

  const choose = (i: number) => {
    if (pick !== null || !q) return;
    setPick(i);
    const ok = i === q.answer;
    onMark(q.card, ok);
    if (ok) { sfx.pop(); setRight((r) => [...r, q.card]); setCombo((c) => c + 1); }
    else { sfx.wrong(); setMissed((m) => [...m, q.card]); setCombo(0); }
  };
  const next = async () => {
    setPick(null);
    const last = at + 1 >= qs.length;
    setAt(at + 1);
    if (last) {
      const score = right.length;
      if (score / qs.length >= CARD_PASS) sfx.victory();
      if (course && unit && score / qs.length >= CARD_PASS) setXp((await awardCards({ course, unit, right: score, total: qs.length }).catch(() => ({ xp: 0 }))).xp);
    }
  };
  const again = () => { setRound((r) => r + 1); setAt(0); setPick(null); setRight([]); setMissed([]); setCombo(0); setXp(null); };

  if (done) {
    const pct = Math.round((100 * right.length) / Math.max(1, qs.length));
    return (
      <div className="card flex flex-col items-center gap-3 p-6 text-center" role="status">
        <p className="text-4xl" aria-hidden>{pct >= 80 ? "🏆" : "💪"}</p>
        <h3 className="text-2xl">{right.length} of {qs.length} right · {pct}%</h3>
        {pct >= 80
          ? <p className="ok">{xp ? `+${xp} XP earned.` : `Great round! (The ${CARD_XP} XP for this deck is paid once a day.)`}</p>
          : <p className="text-muted">Get 80% to earn {CARD_XP} XP. Study the ones you missed, then try again.</p>}
        <div className="flex flex-wrap justify-center gap-2">
          {missed.length > 0 && <button type="button" className="btn" onClick={() => onStudy(missed)}>Study the {missed.length} I missed</button>}
          <button type="button" className="btn btn-ghost" onClick={again}>New quiz round</button>
        </div>
      </div>
    );
  }
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="bar flex-1" role="progressbar" aria-label="Quiz progress" aria-valuemin={0} aria-valuemax={qs.length} aria-valuenow={at}><i style={{ width: `${(at / qs.length) * 100}%` }} /></div>
        <span className={`text-sm font-black tabular-nums ${combo >= 3 ? "text-orange" : "text-muted"}`} aria-live="polite">{combo >= 3 ? `🔥 ${combo} in a row` : `${at + 1}/${qs.length}`}</span>
      </div>
      <div className="rounded-3xl border-2 p-5 text-center" style={{ borderColor: accent, background: `color-mix(in srgb, ${accent} 14%, var(--card))` }}>
        <p className="text-xs font-black uppercase tracking-wide text-muted">Which formula is this?</p>
        <p className="text-2xl font-black text-head"><Rich text={cards[q.card].front} /></p>
      </div>
      <ul className="grid gap-2" aria-label="Choose the formula">
        {q.options.map((o, i) => {
          const state = pick === null ? "" : i === q.answer ? "!border-green bg-green-l" : i === pick ? "!border-red bg-red-l" : "opacity-60";
          return (
            <li key={i}>
              <button type="button" onClick={() => choose(i)} disabled={pick !== null} aria-pressed={pick === i}
                className={`w-full rounded-2xl border-2 border-line bg-card p-3 text-left font-extrabold leading-relaxed text-head shadow-[0_3px_0_var(--line)] ${state}`}><Rich text={o} /></button>
            </li>
          );
        })}
      </ul>
      {pick !== null && (
        <div className={`flex flex-wrap items-center gap-3 rounded-2xl p-3 ${pick === q.answer ? "bg-green-l" : "bg-red-l"}`} role="status">
          <b className={`flex-1 ${pick === q.answer ? "text-green-t" : "text-red-t"}`}>{pick === q.answer ? "Correct!" : "Not quite. The right formula is highlighted."}</b>
          <button type="button" className="btn" onClick={next} autoFocus>{at + 1 >= qs.length ? "See my score" : "Continue"}</button>
        </div>
      )}
    </div>
  );
}
