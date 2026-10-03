export type Card = { front: string; back: string };
/** "Name: expression" splits into front and back; anything else gets a numbered front. */
export function toCard(f: string, i: number): Card {
  const m = /^([^:]{2,60}):\s+(.+)$/.exec(f);
  return m ? { front: m[1], back: m[2] } : { front: `Formula ${i + 1}`, back: f };
}

export type CardQuestion = { card: number; options: string[]; answer: number };

/** Small seeded PRNG so a quiz round is stable for its seed (no Math.random in render). */
function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function shuffle<T>(xs: T[], r: () => number): T[] { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/**
 * A multiple-choice round: for each card, its real formula plus up to three different formulas as distractors
 * (from this unit first, then from `pool`, e.g. the rest of the subject). Cards are asked in a shuffled order.
 */
export function cardQuiz(cards: Card[], pool: Card[], seed: number): CardQuestion[] {
  const r = rng(seed);
  const backs = [...new Set([...cards.map((c) => c.back), ...pool.map((c) => c.back)])];
  if (backs.length < 2) return [];
  return shuffle(cards.map((_, i) => i), r).map((i) => {
    const right = cards[i].back;
    const near = shuffle(cards.map((c) => c.back).filter((b) => b !== right), r);
    const far = shuffle(backs.filter((b) => b !== right && !near.includes(b)), r);
    const wrong = [...new Set([...near, ...far])].slice(0, 3);
    const options = shuffle([right, ...wrong], r);
    return { card: i, options, answer: options.indexOf(right) };
  });
}

/** XP for a quiz round: paid once a day per deck when at least 80% were right. */
export const CARD_PASS = 0.8;
export const CARD_XP = 5;
