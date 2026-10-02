export type Card = { front: string; back: string };
/** "Name: expression" splits into front and back; anything else gets a numbered front. */
export function toCard(f: string, i: number): Card {
  const m = /^([^:]{2,60}):\s+(.+)$/.exec(f);
  return m ? { front: m[1], back: m[2] } : { front: `Formula ${i + 1}`, back: f };
}
