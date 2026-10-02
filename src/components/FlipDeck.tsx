"use client";
import { useState } from "react";
import { Rich } from "@/lib/rich";
import type { Card } from "@/lib/cards";

/** Click or press Enter/Space to flip a card in 3D. */
function Flip({ c, i, accent }: { c: Card; i: number; accent: string }) {
  const [on, setOn] = useState(false);
  return (
    <div className="flip" data-on={on}>
      <div>
        <button type="button" onClick={() => setOn(!on)} aria-pressed={on} aria-label={`Card ${i + 1}: ${c.front}. ${on ? "Showing the formula." : "Flip to see the formula."}`}
          className="face text-left" style={{ background: `color-mix(in srgb, ${accent} 20%, var(--card))`, borderColor: accent, cursor: "pointer" }} tabIndex={on ? -1 : 0} aria-hidden={on}>
          <span className="text-xs font-black uppercase tracking-wide text-muted">Card {i + 1} · tap to flip</span>
          <span className="text-xl font-black text-head"><Rich text={c.front} /></span>
        </button>
        <button type="button" onClick={() => setOn(!on)} aria-label={`Formula for ${c.front}. Flip back.`}
          className="face back text-left" style={{ background: "var(--card)", borderColor: accent, cursor: "pointer" }} tabIndex={on ? 0 : -1} aria-hidden={!on}>
          <span className="text-xs font-black uppercase tracking-wide text-muted">Formula</span>
          <span className="text-base font-extrabold leading-relaxed text-head"><Rich text={c.back} /></span>
        </button>
      </div>
    </div>
  );
}

export function FlipDeck({ cards, accent }: { cards: Card[]; accent: string }) {
  return <ul className="grid gap-4 sm:grid-cols-2">{cards.map((c, i) => <li key={i}><Flip c={c} i={i} accent={accent} /></li>)}</ul>;
}
