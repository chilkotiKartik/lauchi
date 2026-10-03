import { describe, expect, it } from "vitest";
import { cardQuiz, toCard } from "./cards";

const deck = ["Rolle: f(a) = f(b) ⇒ f′(c) = 0", "LMVT: f′(c) = (f(b) − f(a))/(b − a)", "Taylor: f(a+h) = Σ hⁿ f⁽ⁿ⁾(a)/n!"].map(toCard);
const pool = ["Leibniz: (uv)⁽ⁿ⁾ = Σ C(n,r) u⁽ʳ⁾ v⁽ⁿ⁻ʳ⁾", "Euler: x ∂u/∂x + y ∂u/∂y = n u"].map(toCard);

describe("cardQuiz", () => {
  it("asks every card once with the real formula among four distinct options", () => {
    const q = cardQuiz(deck, pool, 7);
    expect(q.map((x) => x.card).sort()).toEqual([0, 1, 2]);
    for (const x of q) {
      expect(x.options).toHaveLength(4);
      expect(new Set(x.options).size).toBe(4);
      expect(x.options[x.answer]).toBe(deck[x.card].back);
    }
  });
  it("is stable for a seed and needs at least two different formulas", () => {
    expect(cardQuiz(deck, pool, 3)).toEqual(cardQuiz(deck, pool, 3));
    expect(cardQuiz([deck[0]], [], 1)).toEqual([]);
    expect(cardQuiz([deck[0]], [deck[1]], 1)[0].options).toHaveLength(2);
  });
});
