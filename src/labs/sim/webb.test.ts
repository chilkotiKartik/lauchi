import { describe, expect, it } from "vitest";
import * as W from "./webb";

describe("re-rendering", () => {
  it("a change at the root renders everything", () => { const r = W.rerender(3, 2, 0, false); expect(r.total).toBe(15); expect(r.rendered).toBe(15); });
  it("a change at level 1 renders that subtree only", () => { const r = W.rerender(3, 2, 1, false); expect(r.rendered).toBe(1 + 2 + 4); });
  it("a change at a leaf renders one component", () => { expect(W.rerender(3, 2, 3, false).rendered).toBe(1); });
  it("memoised children are skipped", () => { const r = W.rerender(3, 2, 0, true); expect(r.rendered).toBe(1); expect(r.savedPct).toBeCloseTo((14 / 15) * 100, 6); });
  it("mask matches the count", () => { const r = W.rerender(3, 3, 1, false); expect(r.mask.filter(Boolean).length).toBe(r.rendered); expect(r.mask).toHaveLength(r.total); });
});
describe("state batching", () => {
  it("direct set reads a stale value", () => { expect(W.stateBatch(5, 3, false, true)).toMatchObject({ count: 5, renders: 5, lost: 10 }); });
  it("functional updates all count", () => { expect(W.stateBatch(5, 3, true, true)).toMatchObject({ count: 15, renders: 5, lost: 0 }); });
  it("without batching every set renders", () => { expect(W.stateBatch(5, 3, true, false).renders).toBe(15); });
});
describe("effect dependencies", () => {
  it("no array runs every render", () => { expect(W.effectRuns(10, 3, "none").count).toBe(10); });
  it("empty array runs once", () => { expect(W.effectRuns(10, 3, "empty")).toMatchObject({ count: 1, cleanups: 0, skipped: 9 }); });
  it("a dependency that changes every k renders", () => { expect(W.effectRuns(10, 3, "dep").count).toBe(4); expect(W.effectRuns(10, 3, "dep").runs.slice(0, 4)).toEqual([true, false, false, true]); });
  it("a new object each render defeats the array", () => { expect(W.effectRuns(10, 3, "object").count).toBe(10); });
});
describe("routing", () => {
  it("extracts path params", () => { expect(W.matchRoute("/users/:id/posts/:postId", "/users/42/posts/7")).toMatchObject({ ok: true, params: { id: "42", postId: "7" } }); });
  it("rejects missing or extra segments", () => { expect(W.matchRoute("/users/:id", "/users").ok).toBe(false); expect(W.matchRoute("/users/:id", "/users/1/x").ok).toBe(false); });
  it("splat takes the rest", () => { expect(W.matchRoute("/files/*", "/files/a/b.txt").params["*"]).toBe("a/b.txt"); expect(W.matchRoute("/files/*", "/files").ok).toBe(false); });
  it("ignores a trailing slash and the query string", () => { expect(W.matchRoute("/about", "/about/").ok).toBe(true); expect(W.matchRoute("/users/:id", "/users/9?tab=x").params.id).toBe("9"); });
  it("literal mismatch", () => { expect(W.matchRoute("/about", "/contact").ok).toBe(false); });
  it("paging", () => {
    expect(W.paging(2, 10, 95)).toMatchObject({ pages: 10, offset: 10, shown: 10, hasNext: true, hasPrev: true });
    expect(W.paging(10, 10, 95)).toMatchObject({ offset: 90, shown: 5, hasNext: false });
    expect(W.paging(99, 10, 95).page).toBe(10);
    expect(W.paging(1, 10, 0)).toMatchObject({ pages: 1, shown: 0 });
  });
});
describe("state space", () => {
  it("three booleans allow 8 states but only 3 make sense", () => { expect(W.stateSpace(3, 3)).toMatchObject({ total: 8, valid: 3, illegal: 5 }); });
  it("valid states cannot exceed the total", () => { expect(W.stateSpace(1, 10)).toMatchObject({ total: 2, valid: 2, illegal: 0 }); });
});
describe("reducer", () => {
  it("is pure and replayable", () => {
    const log = W.actionLog(30, 60), a = W.replay(log, 30), b = W.replay(log, 30);
    expect(a).toEqual(b);
    expect(W.replay(log, 0).state.items).toEqual([]);
    for (let s = 0; s <= 30; s++) { const r = W.replay(log, s); expect(r.state.total).toBe(r.state.items.reduce((x, y) => x + y, 0)); }
  });
  it("actions", () => {
    let s = W.cartReducer({ items: [], total: 0 }, { type: "add", price: 10 });
    s = W.cartReducer(s, { type: "add", price: 5 });
    expect(s).toEqual({ items: [10, 5], total: 15 });
    expect(W.cartReducer(s, { type: "remove" })).toEqual({ items: [10], total: 10 });
    expect(W.cartReducer(s, { type: "clear" })).toEqual({ items: [], total: 0 });
    expect(W.cartReducer({ items: [], total: 0 }, { type: "remove" }).items).toEqual([]);
  });
});
describe("backoff", () => {
  it("doubles and caps", () => {
    const b = W.backoff(100, 2, 5, 10000, 50);
    expect(b.waits).toEqual([100, 200, 400, 800]); expect(b.worstWait).toBe(1500);
    expect(W.backoff(1000, 3, 6, 5000, 50).waits).toEqual([1000, 3000, 5000, 5000, 5000]);
  });
  it("probabilities", () => {
    const b = W.backoff(100, 2, 3, 10000, 50);
    expect(b.pAllFail).toBeCloseTo(0.125, 9); expect(b.pSuccess).toBeCloseTo(0.875, 9);
    expect(b.expAttempts).toBeCloseTo(1 + 0.5 + 0.25, 9);
    expect(b.expWait).toBeCloseTo(0.5 * 100 + 0.25 * 200, 9);
  });
  it("always failing uses every attempt", () => { expect(W.backoff(100, 2, 4, 1e4, 100).expAttempts).toBe(4); });
});
describe("contrast", () => {
  it("black on white is 21:1", () => { expect(W.contrast([0, 0, 0], [255, 255, 255]).ratio).toBeCloseTo(21, 6); });
  it("same colour is 1:1", () => { expect(W.contrast([10, 20, 30], [10, 20, 30]).ratio).toBeCloseTo(1, 9); });
  it("#777 on white just fails AA and #767676 passes", () => {
    expect(W.contrast([119, 119, 119], [255, 255, 255]).ratio).toBeCloseTo(4.48, 2); expect(W.contrast([119, 119, 119], [255, 255, 255]).aa).toBe(false);
    expect(W.contrast([118, 118, 118], [255, 255, 255]).aa).toBe(true);
  });
  it("is symmetric", () => { expect(W.contrast([200, 30, 30], [255, 255, 255]).ratio).toBeCloseTo(W.contrast([255, 255, 255], [200, 30, 30]).ratio, 9); });
  it("levels", () => { const c = W.contrast([0, 0, 0], [255, 255, 255]); expect([c.aa, c.aaLarge, c.aaa, c.aaaLarge]).toEqual([true, true, true, true]); });
});
describe("code splitting", () => {
  it("splits the first load", () => {
    const c = W.codeSplit(8, 100, 300, 3, 8);
    expect(c.single).toBe(1100); expect(c.initial).toBe(400); expect(c.after).toBe(600); expect(c.unusedKB).toBe(500);
    expect(c.singleMs).toBeCloseTo(1100, 6); expect(c.savedPct).toBeCloseTo((1 - 400 / 1100) * 100, 6);
  });
});
describe("integration strategies", () => {
  it("merge keeps every commit and adds one", () => { expect(W.integrate(3, 4, 2, "merge")).toMatchObject({ commits: 10, mergeCommit: true, linear: false }); });
  it("squash adds one", () => { expect(W.integrate(3, 4, 2, "squash")).toMatchObject({ commits: 6, mergeCommit: false, featureVisible: 0 }); });
  it("rebase replays the feature commits", () => { expect(W.integrate(3, 4, 2, "rebase")).toMatchObject({ commits: 9, rewritten: 4, linear: true }); });
});
describe("bundle size", () => {
  it("multiplies the stages", () => { const b = W.bundleSize(200, 8, 40, 60, 30); expect(b.raw).toBe(1600); expect(b.shaken).toBe(640); expect(b.minified).toBeCloseTo(384, 6); expect(b.gz).toBeCloseTo(115.2, 6); });
});
describe("source-map VLQ", () => {
  it("matches the well-known values", () => {
    expect(W.vlqEncode(0).text).toBe("A"); expect(W.vlqEncode(1).text).toBe("C"); expect(W.vlqEncode(-1).text).toBe("D");
    expect(W.vlqEncode(15).text).toBe("e"); expect(W.vlqEncode(16).text).toBe("gB"); expect(W.vlqEncode(123).text).toBe("2H"); expect(W.vlqEncode(-123).text).toBe("3H");
  });
  it("round-trips", () => { for (let n = -1000; n <= 1000; n++) expect(W.vlqDecode(W.vlqEncode(n).text)).toBe(n); });
  it("marks continuation", () => { const g = W.vlqEncode(16).groups; expect(g.map((x) => x.more)).toEqual([true, false]); });
});
describe("test pyramid", () => {
  it("costs", () => { const p = W.pyramid(200, 20, 10); expect(p.seconds).toBeCloseTo(4 + 10 + 200, 6); expect(p.tests).toBe(230); expect(p.e2eShare).toBeCloseTo(200 / 214, 6); expect(p.pClean).toBeCloseTo(0.998 ** 20 * 0.98 ** 10, 9); });
  it("no tests is clean", () => { expect(W.pyramid(0, 0, 0)).toMatchObject({ seconds: 0, pClean: 1 }); });
});
describe("CI pipeline", () => {
  it("sequential time and pass chance", () => {
    const p = W.pipelineStats(7, 8, 10, false, false);
    expect(p.cleanMin).toBeCloseTo(0.5 + 2 + 3 + 7 + 1, 9);
    expect(p.pGreen).toBeCloseTo(0.97 * 0.92 * 0.98 * 0.9 * 0.99, 9);
    expect(p.expMin).toBeLessThan(p.cleanMin);
  });
  it("parallel and cache both save time", () => {
    const a = W.pipelineStats(7, 8, 10, false, false), b = W.pipelineStats(7, 8, 10, false, true), c = W.pipelineStats(7, 8, 10, true, false);
    expect(b.cleanMin).toBeCloseTo(3 + 7 + 1, 9); expect(b.cleanMin).toBeLessThan(a.cleanMin); expect(c.cleanMin).toBe(a.cleanMin - 2);
    expect(b.pGreen).toBeCloseTo(a.pGreen, 12);
  });
  it("certain success costs the full time", () => { const p = W.pipelineStats(7, 0, 0, false, false); p.stages.forEach((s) => { s.fail = 0; }); expect(W.pipelineStats(7, 0, 0, false, false).pGreen).toBeLessThan(1); });
});
describe("rollout", () => {
  it("scales with the rollout share", () => {
    const r = W.rollout(1000, 5, 20, 5, 50);
    expect(r.failed).toBeCloseTo(1000 * 60 * 5 * 0.05 * 0.2, 6); expect(r.bigBang).toBeCloseTo(1000 * 60 * 5 * 0.2, 6);
    expect(r.saved).toBeCloseTo(95, 6); expect(r.expected).toBeCloseTo(r.failed / 2, 6);
  });
});
describe("image layers", () => {
  it("changing app code rebuilds one layer", () => { const l = W.layers(80, 200, 150, 20, "app", false); expect(l.count).toBe(1); expect(l.pushed).toBe(20); expect(l.finalMB).toBe(450); });
  it("changing dependencies rebuilds two", () => { const l = W.layers(80, 200, 150, 20, "deps", false); expect(l.count).toBe(2); expect(l.pushed).toBe(170); });
  it("changing the base rebuilds everything", () => { const l = W.layers(80, 200, 150, 20, "base", false); expect(l.count).toBe(4); expect(l.pushed).toBe(450); expect(l.reusedPct).toBe(0); });
  it("multi-stage drops the build tools from the image", () => { const l = W.layers(80, 200, 150, 20, "base", true); expect(l.finalMB).toBe(250); expect(l.pushed).toBe(250); });
});
describe("plural categories agree with Intl.PluralRules", () => {
  for (const lang of ["en", "fr", "ru", "pl", "ar", "ja"] as const) {
    it(lang, () => {
      const pr = new Intl.PluralRules(lang);
      for (let n = 0; n <= 300; n++) expect(W.pluralCategory(lang, n), `${lang} ${n}`).toBe(pr.select(n));
    });
  }
  it("summary", () => {
    const s = W.pluralSummary("ru", 2);
    expect(s.cat).toBe("few"); expect(s.used.sort()).toEqual(["few", "many", "one"]); expect(s.next).toBe(5);
    expect(W.pluralSummary("ar", 5).used).toHaveLength(6);
    expect(W.pluralSummary("ja", 1).used).toEqual(["other"]);
    expect(W.pluralSummary("en", 100).next).toBe(-1);
  });
});
