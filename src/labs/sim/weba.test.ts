import { describe, expect, it } from "vitest";
import * as W from "./weba";

describe("http journey", () => {
  it("adds up the round trips", () => {
    const j = W.httpJourney(50, 30, true, 100, 500, 20);
    expect(j.tcp).toBe(50); expect(j.tls).toBe(50); expect(j.request).toBe(150);
    expect(j.download).toBeCloseTo(200, 6); // 500 KB = 4000 kbit at 20 Mbit/s
    expect(j.total).toBeCloseTo(30 + 50 + 50 + 150 + 200, 6);
    expect(j.ttfb).toBe(280);
  });
  it("drops the TLS round trip on plain http", () => { expect(W.httpJourney(50, 0, false, 0, 0, 10).tls).toBe(0); });
});
describe("DOM tree", () => {
  it("counts nodes of a full tree", () => {
    expect(W.domTree(2, 3)).toMatchObject({ nodes: 13, leaves: 9 });
    expect(W.domTree(0, 4).nodes).toBe(1);
    expect(W.domTree(4, 4).nodes).toBe(341);
  });
});
describe("cascade", () => {
  it("compares ids then classes then tags", () => {
    expect(W.cascade([0, 2, 1], [1, 0, 0], false).winner).toBe("B");
    expect(W.cascade([0, 2, 0], [0, 1, 5], false).winner).toBe("A");
    expect(W.cascade([0, 1, 1], [0, 1, 1], false).winner).toBe("B");
    expect(W.cascade([0, 0, 1], [1, 0, 0], true).winner).toBe("A");
  });
});
describe("doubles", () => {
  it("0.1 + 0.2 is the double 0x3FD3333333333334", () => {
    const o = W.doubleOp(0.1, 0.2, "add");
    expect(o.shortest).toBe("0.30000000000000004");
    expect(o.exactDecimal).toBe(false);
    const hex = o.bits.join("").match(/.{4}/g)!.map((b) => parseInt(b, 2).toString(16)).join("");
    expect(hex).toBe("3fd3333333333334");
    expect(o.bits).toHaveLength(64);
  });
  it("0.5 + 0.25 is exact", () => { expect(W.doubleOp(0.5, 0.25, "add").exactDecimal).toBe(true); });
  it("integers stop being exact at 2^53", () => { expect(W.powerCollapses(52)).toBe(false); expect(W.powerCollapses(53)).toBe(true); });
});
describe("array pipeline", () => {
  it("filters then maps then sums", () => {
    const p = W.pipeline(12, 50, 2);
    expect(p.data).toHaveLength(12);
    expect(p.kept.every((x) => x > 50)).toBe(true);
    expect(p.mapped).toEqual(p.kept.map((x) => x * 2));
    expect(p.sum).toBe(p.kept.reduce((s, x) => s + x, 0) * 2);
    expect(p.keepMask.filter(Boolean)).toHaveLength(p.kept.length);
  });
});
describe("call stack", () => {
  it("factorial", () => { const t = W.stackTrace("fact", 5); expect(t.result).toBe(120); expect(t.calls).toBe(6); expect(t.maxDepth).toBe(6); });
  it("fibonacci makes 2·F(n+1) − 1 calls", () => { const t = W.stackTrace("fib", 5); expect(t.result).toBe(5); expect(t.calls).toBe(15); expect(t.maxDepth).toBe(5); expect(W.stackTrace("fib", 10).calls).toBe(177); });
  it("sum", () => { expect(W.stackTrace("sum", 10).result).toBe(55); });
  it("replays the stack", () => {
    const t = W.stackTrace("fact", 3);
    expect(W.stackAt(t.events, 0)).toEqual([]);
    expect(W.stackAt(t.events, 4)).toEqual([3, 2, 1, 0]);
    expect(W.stackAt(t.events, t.events.length)).toEqual([]);
  });
});
describe("form size", () => {
  it("matches hand counts for one plain field", () => {
    const f = W.formSize(1, 4, 5, 0, 0);
    expect(f.urlencoded).toBe(4 + 1 + 5); // name=Asha
    expect(f.json).toBe(2 + 4 + 5 + 6); // {"name":"Asha1"}
    // --B\r\nContent-Disposition: form-data; name="k"\r\n\r\nv\r\n plus closing --B--\r\n
    expect(f.multipart).toBe(40 + 49 + 4 + 5 + 40 + 6);
  });
  it("percent-encoding triples special characters and base64 grows a file by a third", () => {
    expect(W.formSize(1, 1, 10, 50, 0).urlencoded).toBe(1 + 1 + 10 + 2 * 5);
    const big = W.formSize(1, 1, 1, 0, 30);
    expect(big.multipart).toBeLessThan(big.json);
    expect(big.json).toBeLessThan(big.urlencoded);
  });
});
describe("event loop order", () => {
  it("sync, then nextTick, then promises, then timers by delay", () => {
    const o = W.eventLoop(1, 2, [50, 0, 10]).map((x) => x.label);
    expect(o).toEqual(["start", "end", "nextTick 1", "promise 1", "promise 2", "timer 2 (1 ms)", "timer 3 (10 ms)", "timer 1 (50 ms)"]);
  });
  it("equal delays keep creation order", () => { expect(W.eventLoop(0, 0, [5, 5, 5]).slice(2).map((x) => x.label[6])).toEqual(["1", "2", "3"]); });
});
describe("semver ranges", () => {
  it("caret", () => {
    expect(W.satisfies([1, 4, 4], "caret", [1, 2, 0])).toBe(true);
    expect(W.satisfies([2, 0, 0], "caret", [1, 2, 0])).toBe(false);
    expect(W.satisfies([0, 2, 9], "caret", [0, 2, 3])).toBe(true);
    expect(W.satisfies([0, 3, 0], "caret", [0, 2, 3])).toBe(false);
    expect(W.satisfies([0, 0, 3], "caret", [0, 0, 3])).toBe(true);
    expect(W.satisfies([0, 0, 4], "caret", [0, 0, 3])).toBe(false);
    expect(W.satisfies([1, 1, 9], "caret", [1, 2, 0])).toBe(false);
  });
  it("tilde, exact and >=", () => {
    expect(W.satisfies([1, 2, 9], "tilde", [1, 2, 3])).toBe(true);
    expect(W.satisfies([1, 3, 0], "tilde", [1, 2, 3])).toBe(false);
    expect(W.satisfies([1, 2, 3], "exact", [1, 2, 3])).toBe(true);
    expect(W.satisfies([1, 2, 4], "exact", [1, 2, 3])).toBe(false);
    expect(W.satisfies([3, 0, 0], "gte", [1, 2, 3])).toBe(true);
  });
  it("counts what ^1.2.0 installs", () => { const s = W.semver("caret", [1, 2, 0]); expect(s.count).toBe(15); expect(s.highest).toEqual([1, 4, 4]); expect(s.lowest).toEqual([1, 2, 0]); expect(W.VERSIONS).toHaveLength(100); });
});
describe("closures", () => {
  it("give each counter its own state", () => { expect(W.counters(3, 5, "closure").values).toEqual([2, 2, 1]); expect(W.counters(3, 5, "closure").total).toBe(5); });
  it("a shared global is one number", () => { expect(W.counters(3, 5, "global").values).toEqual([5, 5, 5]); });
});
describe("coverage", () => {
  it("is deterministic, grows with tests and finds bugs only in covered code", () => {
    const a = W.coverage(20, 5, 2, 3), b = W.coverage(20, 5, 2, 3);
    expect(a).toEqual(b);
    expect(W.coverage(20, 0, 2, 3).count).toBe(0);
    let last = 0;
    for (let t = 0; t <= 40; t++) { const c = W.coverage(20, t, 2, 3); expect(c.count).toBeGreaterThanOrEqual(last); last = c.count; expect(c.found).toBeLessThanOrEqual(c.bugs); }
    const full = W.coverage(20, 40, 6, 3);
    expect(full.pct).toBeGreaterThan(95);
    expect(W.coverage(20, 40, 2, 20).bugs).toBe(20);
    expect(W.coverage(10, 5, 1, 99).bugs).toBe(10);
  });
});
describe("index against scan", () => {
  it("levels are log base fanout", () => {
    expect(W.dbIndex(6, 100)).toMatchObject({ rows: 1_000_000, levels: 3, indexReads: 4 });
    expect(W.dbIndex(2, 100).levels).toBe(1);
    expect(W.dbIndex(8, 100).levels).toBe(4);
    expect(W.dbIndex(6, 100).scanAvg).toBe(500_000);
  });
});
describe("M/M/c queue", () => {
  it("one worker gives ρ/(1 − ρ)", () => {
    const q = W.queue(8, 10, 1);
    if (!q.stable) throw new Error("unstable");
    expect(q.rho).toBeCloseTo(0.8, 9); expect(q.pWait).toBeCloseTo(0.8, 9); expect(q.lq).toBeCloseTo(0.64 / 0.2, 6); expect(q.w).toBeCloseTo(1 / (10 - 8), 6);
  });
  it("two workers at ρ = 0.8, a = 3.2 (Erlang C ≈ 0.7111)", () => {
    const q = W.queue(40, 25, 2);
    if (!q.stable) throw new Error("unstable");
    expect(q.pWait).toBeCloseTo(0.7111, 3);
    expect(q.lq).toBeCloseTo(2.844, 2);
  });
  it("is unstable when λ ≥ cμ", () => { expect(W.queue(60, 25, 2).stable).toBe(false); });
});
describe("flexbox", () => {
  it("grows equal items to fill", () => { expect(W.flexLayout(600, 3, 100, 1, 1, 0, false).lines[0]).toEqual([200, 200, 200]); });
  it("without grow keeps the basis", () => { expect(W.flexLayout(600, 3, 100, 0, 1, 0, false).lines[0]).toEqual([100, 100, 100]); });
  it("shrinks equal items when too wide", () => { const l = W.flexLayout(200, 3, 100, 0, 1, 0, false).lines[0]; expect(l[0]).toBeCloseTo(66.667, 2); });
  it("overflows when shrink is 0", () => { expect(W.flexLayout(200, 3, 100, 0, 0, 0, false).overflow).toBe(100); });
  it("wraps into lines", () => { expect(W.flexLayout(250, 5, 100, 0, 1, 10, true).lines.map((l) => l.length)).toEqual([2, 2, 1]); });
  it("gaps count", () => { expect(W.flexLayout(320, 3, 100, 1, 1, 10, false).lines[0][0]).toBeCloseTo(100 + 0 / 3 + (320 - 300 - 20) / 3, 6); });
});
describe("SSR against CSR", () => {
  it("adds up", () => {
    const r = W.renderTimes(50, 20, 40, 300, 100, 80, 2);
    expect(r.ssrContent).toBeCloseTo(100 + 50 + 100 + 16, 6);
    expect(r.ssrReady).toBeCloseTo(r.ssrContent + 120 + 600, 6);
    expect(r.csrContent).toBeCloseTo(100 + 50 + 0.8 + 120 + 600 + 50 + 80, 6);
    expect(r.ssrContent).toBeLessThan(r.csrContent);
  });
});
describe("CSRF token guessing", () => {
  it("16 random bytes are hopeless to guess", () => { const g = W.csrfGuess(16, 1000, 60); expect(g.bits).toBe(128); expect(g.p).toBeLessThan(1e-30); });
  it("1 byte is guessed at once", () => { expect(W.csrfGuess(1, 100, 1).p).toBe(1); });
});
describe("password cracking", () => {
  it("8 lowercase letters against MD5", () => {
    const c = W.passwordCrack(8, "lower", "md5", 5, false);
    expect(c.space).toBe(26 ** 8);
    expect(c.avgSeconds).toBeCloseTo(26 ** 8 / 2 / 1.6e11, 6);
    expect(c.sameHash).toBe(true);
  });
  it("bcrypt halves the rate for each cost step and is always salted", () => {
    expect(W.guessRate("bcrypt", 6)).toBeCloseTo(W.guessRate("bcrypt", 5) / 2, 6);
    expect(W.passwordCrack(8, "alnum", "bcrypt", 12, false).sameHash).toBe(false);
    expect(W.passwordCrack(8, "alnum", "sha256", 12, true).sameHash).toBe(false);
  });
});
