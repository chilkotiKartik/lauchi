import { describe, expect, it } from "vitest";
import * as S from "./bcax";

describe("dlcodes: number codes", () => {
  it("PYQ Q6.2: -25 in 8 bits", () => {
    const f = S.signedForms(-25);
    expect(S.bstr(f.sm, 8)).toBe("10011001");
    expect(S.bstr(f.ones, 8)).toBe("11100110");
    expect(S.bstr(f.twos, 8)).toBe("11100111");
    expect(S.fromTwos(f.twos)).toBe(-25);
  });
  it("positive numbers have identical forms", () => { const f = S.signedForms(25); expect(new Set([f.sm, f.ones, f.twos]).size).toBe(1); });
  it("BCD, excess-3, gray and parity of 7 and 9", () => {
    expect(S.digitCodes(7)).toEqual({ bcd: 7, xs3: 10, gray: 4, parity: 1 });
    expect(S.bstr(S.digitCodes(9).gray, 4)).toBe("1101");
    expect(S.digitCodes(5).xs3).toBe(8);
  });
  it("PYQ Q3.2: (1001.0010)2 = 9.125", () => { expect(S.fracBinary(0b10010010).value).toBe(9.125); expect(S.fracBinary(0b00001000).value).toBe(0.5); });
});

describe("dlqm: Quine-McCluskey", () => {
  it("PYQ Q3.4 gives A'B'C' + A'BD + ACD'", () => {
    const r = S.qm([...S.QM_SETS.q34.m], 4);
    expect(r.primes.map((p) => p.bits).sort()).toEqual(["0-01", "000-", "01-1", "1-10"]);
    expect(r.essential.sort()).toEqual(["000-", "01-1", "1-10"]);
    expect(r.cover.map((p) => S.impSop(p, 4)).sort()).toEqual(["A'B'C'", "A'BD", "ACD'"]);
  });
  it("PYQ Q3.3: the 5-variable cover equals the function on all 32 inputs", () => {
    const set = S.QM_SETS.q33, r = S.qm([...set.m], 5);
    for (let m = 0; m < 32; m++) expect(r.cover.some((p) => S.impCovers(p, m, 5)), String(m)).toBe(set.m.includes(m as never));
  });
  it("cyclic function has 6 primes and needs 3 chosen", () => { const r = S.qm([...S.QM_SETS.cyc.m], 4); expect(r.cover.length).toBeGreaterThanOrEqual(3); for (const m of S.QM_SETS.cyc.m) expect(r.cover.some((p) => S.impCovers(p, m, 4))).toBe(true); });
  it("a full cube collapses to 1", () => expect(S.qm([0, 1, 2, 3], 2).sop).toBe("1"));
});

describe("addsub: adders", () => {
  it("all 4-bit sums are right", () => { for (let a = 0; a < 16; a++) for (let b = 0; b < 16; b++) for (const c of [0, 1]) { const r = S.addBits(a, b, c); expect(r.value + 16 * r.cout).toBe(a + b + c); } });
  it("carry ripples: 15 + 1 makes all carries 1", () => { const r = S.addBits(15, 1, 0); expect(r.c).toEqual([0, 1, 1, 1, 1]); expect(r.value).toBe(0); });
  it("delays: ripple 8 gate delays (cout 9), look-ahead 4 (cout 3)", () => { expect(S.adderDelay(4, "ripple")).toEqual({ sum: 8, cout: 9 }); expect(S.adderDelay(4, "lookahead")).toEqual({ sum: 4, cout: 3 }); expect(S.adderDelay(8, "ripple").sum).toBe(16); });
  it("subtraction by 2's complement", () => { expect(S.subtract(9, 5).diff).toBe(4); expect(S.subtract(9, 5).noBorrow).toBe(true); expect(S.subtract(5, 9).noBorrow).toBe(false); expect(S.subtract(5, 9).signed).toBe(-4); });
  it("BCD adder corrects with +6: 9 + 8 = 17", () => { const r = S.bcdAdd(9, 8, 0); expect(r.z).toBe(17); expect(r.fix).toBe(true); expect(r.text).toBe("17"); expect(S.bcdAdd(4, 5, 0).fix).toBe(false); expect(S.bcdAdd(9, 9, 1).text).toBe("19"); });
});

describe("muxdec", () => {
  it("mux picks the selected data bit", () => { expect(S.muxOut(0b10110010, 4)).toBe(1); expect(S.muxOut(0b10110010, 2)).toBe(0); });
  it("3:8 decoder is one-hot and dead without enable", () => { expect(S.decoder(5, true)).toBe(0b100000); expect(S.decoder(5, false)).toBe(0); });
  it("priority encoder picks the highest input", () => { expect(S.prioEnc(0b00101100)).toEqual({ valid: 1, y: 5 }); expect(S.prioEnc(0).valid).toBe(0); });
  it("16:1 mux from five 4:1 muxes selects the right bit for every select", () => { for (let s = 0; s < 16; s++) { const d = 0xa5c3; expect(S.mux16(d, s).out).toBe((d >> s) & 1); } expect(S.mux16(0, 0).chips).toBe(5); });
});

describe("ffconv: flip-flops", () => {
  it("characteristic tables", () => {
    expect(S.ffNext("SR", 0, 1, 0).q).toBe(1); expect(S.ffNext("SR", 1, 0, 1).q).toBe(0); expect(S.ffNext("SR", 1, 1, 1).bad).toBe(true);
    expect(S.ffNext("JK", 1, 1, 1).q).toBe(0); expect(S.ffNext("JK", 0, 1, 1).q).toBe(1); expect(S.ffNext("T", 1, 1, 0).q).toBe(0); expect(S.ffNext("D", 0, 1, 0).q).toBe(1);
  });
  it("every conversion matches the target for all q and inputs", () => {
    const all = ["SR", "JK", "D", "T"] as const;
    for (const base of all) for (const tgt of all) if (base !== tgt) for (const q of [0, 1]) for (const x of [0, 1]) for (const y of [0, 1]) {
      const want = S.ffNext(tgt, q, x, y); if (want.bad) continue;
      const [bx, by] = S.excite(base, q, want.q);
      const got = S.ffNext(base, q, bx, by);
      expect(got.bad, `${base}->${tgt}`).toBe(false);
      expect(got.q, `${base}->${tgt} q${q} x${x} y${y}`).toBe(want.q);
    }
  });
  it("PYQ Q3.11 SR as D: D = 1 sets, D = 0 resets", () => { const r = S.ffRun("SR", "D", 4, 0b0101, 0); expect(r.qs).toEqual([0, 1, 0, 1, 0]); expect(r.bin[0]).toEqual([1, 0]); expect(r.bin[1]).toEqual([0, 1]); });
  it("JK as T toggles when T = 1", () => { const r = S.ffRun("JK", "T", 3, 0b111, 0); expect(r.qs).toEqual([0, 1, 0, 1]); });
});

describe("counters", () => {
  it("ripple is a binary counter mod 16", () => { expect(S.ctrState("ripple", 4, 5)).toEqual([0, 1, 0, 1]); expect(S.ctrState("sync", 4, 16)).toEqual([0, 0, 0, 0]); });
  it("ring counter rotates a single 1 and repeats after n", () => { expect(S.ctrState("ring", 4, 0)).toEqual([1, 0, 0, 0]); expect(S.ctrState("ring", 4, 1)).toEqual([0, 1, 0, 0]); expect(S.ctrState("ring", 4, 4)).toEqual([1, 0, 0, 0]); });
  it("PYQ Q3.12 Johnson sequence 0000 1000 1100 1110 1111 0111 0011 0001", () => {
    const seq = Array.from({ length: 9 }, (_, k) => S.ctrState("johnson", 4, k).join(""));
    expect(seq).toEqual(["0000", "1000", "1100", "1110", "1111", "0111", "0011", "0001", "0000"]);
    expect(S.ctrMod("johnson", 4)).toBe(8); expect(S.ctrMod("ring", 4)).toBe(4); expect(S.ctrMod("ripple", 4)).toBe(16);
  });
  it("SISO shift register moves the serial bits right", () => { expect(S.ctrState("shift", 4, 4, 0b1011)).toEqual([1, 0, 1, 1]); });
  it("PYQ Q3.9 ripple is slower: fmax 12.5 MHz vs 33.3 MHz", () => { expect(S.ctrFmax("ripple", 4, 20, 10)).toBeCloseTo(12.5); expect(S.ctrFmax("sync", 4, 20, 10)).toBeCloseTo(33.33, 1); });
});

describe("fsm: detectors and state reduction", () => {
  const bits = (s: string) => s.split("").map(Number);
  it("1011 overlapping finds two matches in 1011011", () => {
    for (const m of ["mealy", "moore"] as const) { const r = S.detector("1011", m, bits("1011011")); expect(r.steps.at(-1)!.hits).toBe(2); }
  });
  it("Mealy needs L states, Moore L + 1", () => { expect(S.detector("101", "mealy", []).states).toBe(3); expect(S.detector("101", "moore", []).states).toBe(4); });
  it("Mealy output appears on the matching transition", () => { const r = S.detector("101", "mealy", bits("101")); expect(r.steps.map((s) => s.out)).toEqual([0, 0, 1]); });
  it("5-state machine reduces to 3 states {a,c,e}, {b}, {d}", () => { const r = S.reduceStates(); expect(r.length).toBe(2); expect(r[r.length - 1].map((g) => g.join("")).sort()).toEqual(["ace", "b", "d"]); });
});

describe("hazard and race", () => {
  it("a static-1 glitch as wide as the inverter delay", () => {
    const w = S.hazardWave(2, 1, false);
    const zeros = w.F.filter((f) => f === 0).length * 0.05;
    expect(zeros).toBeGreaterThan(1.9); expect(zeros).toBeLessThan(2.1); expect(S.glitchWidth(2, false)).toBe(2);
  });
  it("the consensus term BC removes the glitch", () => { expect(S.hazardWave(2, 1, true).F.every((f) => f === 1)).toBe(true); expect(S.glitchWidth(2, true)).toBe(0); });
  it("no inverter delay, no glitch", () => expect(S.hazardWave(0, 1, false).F.every((f) => f === 1)).toBe(true));
  it("critical race ends in 10 or 01 depending on speed, non-critical always in 11", () => {
    expect(S.raceResult(true, 1, 2).final).toBe("10"); expect(S.raceResult(true, 2, 1).final).toBe("01");
    expect(S.raceResult(false, 1, 2).final).toBe("11"); expect(S.raceResult(false, 2, 1).final).toBe("11");
  });
});

describe("logicfam", () => {
  it("TTL: 0.4 V noise margins, fan-out 10", () => { const m = S.famMetrics("TTL", 5, 4, 10, 15); expect(m.nmh).toBeCloseTo(0.4); expect(m.nml).toBeCloseTo(0.4); expect(m.limit).toBe(10); });
  it("CMOS margin is 30% of VDD", () => { expect(S.famMetrics("CMOS", 5, 4, 10, 15).nmh).toBeCloseTo(1.5); expect(S.famMetrics("CMOS", 10, 4, 10, 15).nml).toBeCloseTo(3); });
  it("CMOS dynamic power C V^2 f", () => { expect(S.famMetrics("CMOS", 5, 0, 10, 20).power).toBeCloseTo(20e-12 * 25 * 10e6 * 1e3, 6); });
  it("more loads, more delay; overload flagged", () => { expect(S.famMetrics("TTL", 5, 12, 10, 15).tpd).toBeGreaterThan(S.famMetrics("TTL", 5, 2, 10, 15).tpd); expect(S.famMetrics("TTL", 5, 12, 10, 15).overloaded).toBe(true); });
  it("ECL margins are small and negative-level", () => { const m = S.famMetrics("ECL", 5, 1, 10, 15); expect(m.voh).toBeLessThan(0); expect(m.nmh).toBeCloseTo(0.265, 2); });
});

describe("dsstack: stack, queue, postfix", () => {
  it("push/pop with overflow and underflow", () => {
    const f = S.stackFrames(4);
    expect(f[4].top).toBe(3); expect(f[5].err).toBe(true); expect(f[5].note).toContain("OVERFLOW");
    expect(f.at(-1)!.err).toBe(true); expect(f.at(-1)!.note).toContain("UNDERFLOW");
    expect(S.stackFrames(8)[6].top).toBe(5);
  });
  it("circular queue wraps round with mod N", () => {
    const f = S.queueFrames(5);
    expect(f[8].rear).toBe(0); expect(f[8].note).toContain("wrapped"); expect(f[9].count).toBe(5); expect(f[10].err).toBe(true);
  });
  it("postfix evaluation gives the right values", () => {
    for (const e of Object.values(S.EXPRS)) { const f = S.postfixFrames(e.postfix); expect(f.at(-1)!.cells).toEqual([String(e.value)]); }
  });
  it("infix to postfix conversion matches", () => { for (const e of Object.values(S.EXPRS)) expect(S.infixFrames(e.infix).at(-1)!.out).toBe(e.postfix); });
});

describe("dsarray: address calculation", () => {
  it("PYQ Q5.8: A[3] at base 1000, 4 bytes = 1012", () => { expect(S.addr1D(1000, 4, 3)).toBe(1012); expect(S.addr1D(1000, 4, 4)).toBe(1016); });
  it("2D row-major vs column-major", () => {
    expect(S.addr2D(1000, 4, 3, 4, 1, 2, true)).toBe(1000 + (1 * 4 + 2) * 4);
    expect(S.addr2D(1000, 4, 3, 4, 1, 2, false)).toBe(1000 + (2 * 3 + 1) * 4);
    expect(S.addr2D(0, 1, 3, 4, 0, 0, true)).toBe(0);
  });
});

describe("dslist: linked lists", () => {
  it("insert in the middle ends with 10 20 25 30 40", () => { const f = S.listFrames("singly", "mid"); expect(S.listOrder(f[0]).map((i) => f[0].val[i])).toEqual([10, 20, 30, 40]); const l = f.at(-1)!; expect(S.listOrder(l).map((i) => l.val[i])).toEqual([10, 20, 25, 30, 40]); });
  it("a half-done insert has not yet linked the node", () => { const f = S.listFrames("singly", "mid"); expect(S.listOrder(f[2])).toEqual([1, 2, 3, 4]); expect(f[2].next[5]).toBe(3); });
  it("doubly list keeps prev pointers consistent after every operation", () => {
    for (const op of ["head", "mid", "tail", "del"] as const) { const l = S.listFrames("doubly", op).at(-1)!; const o = S.listOrder(l); o.forEach((id, i) => expect(l.prev[id], `${op} ${id}`).toBe(i === 0 ? null : o[i - 1])); }
  });
  it("circular list stays closed after tail insert and head insert", () => {
    for (const op of ["head", "tail"] as const) { const l = S.listFrames("circular", op).at(-1)!; const o = S.listOrder(l); expect(l.next[o[o.length - 1]]).toBe(l.head); }
  });
  it("delete frees the node and skips it", () => { const l = S.listFrames("singly", "del").at(-1)!; expect(S.listOrder(l).map((i) => l.val[i])).toEqual([10, 20, 40]); expect(l.freed).toEqual([3]); });
});

describe("dsbst: binary search trees", () => {
  const t = S.buildT(S.BST_SETS.q512);
  it("PYQ Q5.12 traversals", () => {
    expect(S.traverseT(t, "in")).toEqual([8, 10, 12, 15, 17, 20, 25]);
    expect(S.traverseT(t, "pre")).toEqual([15, 10, 8, 12, 20, 17, 25]);
    expect(S.traverseT(t, "post")).toEqual([8, 12, 10, 17, 25, 20, 15]);
    expect(S.traverseT(t, "level")).toEqual([15, 10, 20, 8, 12, 17, 25]);
  });
  it("height and size, and skewed trees degenerate", () => { expect(S.heightT(t)).toBe(3); expect(S.sizeT(t)).toBe(7); expect(S.heightT(S.buildT(S.BST_SETS.skew))).toBe(5); });
  it("search path", () => { expect(S.pathT(t, 17)).toEqual([15, 20, 17]); expect(S.pathT(t, 13)).toEqual([15, 10, 12]); });
  it("delete: leaf, one child and two children (inorder successor)", () => {
    expect(S.deleteCase(t, 8)).toBe("leaf"); expect(S.deleteCase(t, 15)).toBe("two children"); expect(S.deleteCase(S.deleteT(t, 8), 10)).toBe("one child");
    const d = S.deleteT(t, 15); expect(d!.key).toBe(17); expect(S.traverseT(d, "in")).toEqual([8, 10, 12, 17, 20, 25]);
  });
});

describe("dsavl: rotations", () => {
  const rot = (k: readonly number[]) => S.avlFrames(k).filter((f) => f.bad !== null).map((f) => f.rot);
  it("the four cases", () => { expect(rot(S.AVL_SETS.ll)).toEqual(["LL"]); expect(rot(S.AVL_SETS.rr)).toEqual(["RR"]); expect(rot(S.AVL_SETS.lr)).toEqual(["LR"]); expect(rot(S.AVL_SETS.rl)).toEqual(["RL"]); });
  it("after a rotation the middle key is the root", () => { for (const k of ["ll", "rr", "lr", "rl"] as const) expect(S.avlFrames(S.AVL_SETS[k]).at(-1)!.tree!.key).toBe(S.AVL_SETS[k].slice().sort((a, b) => a - b)[1]); });
  it("every frame after rotation is balanced and sorted", () => {
    for (const f of S.avlFrames(S.AVL_SETS.long)) if (f.bad === null) { expect(S.layoutT(f.tree).every((p) => Math.abs(p.bf) <= 1)).toBe(true); const io = S.traverseT(f.tree, "in"); expect(io).toEqual([...io].sort((a, b) => a - b)); }
  });
  it("skewed insertion would have height 6, AVL keeps 3", () => { expect(S.heightT(S.avlFrames(S.AVL_SETS.long).at(-1)!.tree)).toBeLessThanOrEqual(4); });
});

describe("dsgraph: traversals and spanning trees", () => {
  it("BFS and DFS order from A", () => {
    expect(S.graphFrames("bfs", 0).at(-1)!.order.map((i) => S.GN[i]).join("")).toBe("ABDCEFG");
    expect(S.graphFrames("dfs", 0).at(-1)!.order.map((i) => S.GN[i]).join("")).toBe("ABCEDFG");
  });
  it("Prim and Kruskal both give MST weight 39 with 6 edges", () => {
    for (let s = 0; s < 7; s++) { const p = S.graphFrames("prim", s).at(-1)!; expect(p.weight).toBe(39); expect(p.tree.length).toBe(6); }
    const k = S.graphFrames("kruskal", 0).at(-1)!; expect(k.weight).toBe(39); expect(k.tree.length).toBe(6); expect(k.rejected.length).toBe(S.GEDGES.length - 6);
  });
  it("adjacency matrix is symmetric with 2E ones", () => { const m = S.adjMatrix(); let ones = 0; for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) { expect(m[i][j]).toBe(m[j][i]); ones += m[i][j]; } expect(ones).toBe(2 * S.GEDGES.length); expect(S.adjList().reduce((a, l) => a + l.length, 0)).toBe(22); });
});

describe("dshash: collision resolution", () => {
  it("linear probing places the classic keys", () => { const f = S.hashFrames("linear", 7, S.HKEYS.k1).at(-1)!; expect(f.slots).toEqual([700, 50, 85, 92, 73, 101, 76]); expect(f.total).toBe(1 + 1 + 1 + 2 + 3 + 2 + 3); });
  it("chaining never fails and stores everything", () => { const f = S.hashFrames("chain", 7, S.HKEYS.k1).at(-1)!; expect(f.chains.flat().length).toBe(7); expect(f.chains[1]).toEqual([50, 85, 92]); });
  it("quadratic probing and double hashing sequences", () => { expect(S.probeAt("quad", 85, 7, 2)).toBe((1 + 4) % 7); expect(S.probeAt("double", 85, 7, 1)).toBe((1 + 1 + (85 % 6)) % 7); });
  it("a full table reports failure", () => { const f = S.hashFrames("linear", 3, [3, 6, 9, 12]).at(-1)!; expect(f.failed).toBe(true); });
});

describe("dsbigo: counting and bounds", () => {
  it("exact loop counts", () => { expect(S.loopCount("lin", 10)).toBe(10); expect(S.loopCount("nest", 10)).toBe(100); expect(S.loopCount("tri", 10)).toBe(45); expect(S.loopCount("log", 16)).toBe(5); expect(S.loopCount("nlogn", 8)).toBe(8 * 4); });
  it("growth ordering", () => { const g = S.growth(16); expect(g.log).toBe(4); expect(g.nlogn).toBe(64); expect(g.quad).toBe(256); expect(g.exp).toBe(65536); });
  it("3n^2 + 2n + 5 <= 4n^2 from n0 = 4", () => { expect(S.bigONaught(3, 2, 5, 4)).toBe(4); expect(S.bigONaught(3, 2, 5, 3)).toBeNull(); expect(S.bigONaught(1, 0, 0, 1)).toBe(1); });
});

describe("dsmerge: merge and radix sort", () => {
  it("merge sort sorts and counts comparisons", () => {
    const f = S.mergeFrames(S.MERGE_ARRAYS.m1).at(-1)!;
    expect(f.arr).toEqual([3, 9, 10, 27, 38, 43, 82]); expect(f.cmps).toBeLessThanOrEqual(7 * 3); expect(f.cmps).toBeGreaterThanOrEqual(6);
    expect(S.mergeFrames([1, 2, 3, 4]).at(-1)!.cmps).toBe(4);
  });
  it("radix sort passes", () => {
    const f = S.radixFrames();
    expect(f[2].arr).toEqual([170, 90, 802, 2, 24, 45, 75, 66]);
    expect(f.at(-1)!.arr).toEqual([2, 24, 45, 66, 75, 90, 170, 802]);
  });
});

describe("coacache: mapping and EMAT", () => {
  const last = (m: S.CMap, s: readonly number[]) => S.cacheRun(m, s).at(-1)!;
  it("direct mapping thrashes on a conflict, 2-way does not", () => {
    expect(last("direct", S.CACHE_SEQS.conf.seq).hits).toBe(0);
    expect(last("set2", S.CACHE_SEQS.conf.seq).hits).toBeGreaterThan(5);
  });
  it("hits + misses = accesses and full associative never evicts below 8 blocks", () => {
    for (const m of ["direct", "set2", "set4", "full"] as const) { const l = last(m, S.CACHE_SEQS.loc.seq); expect(l.hits + l.misses).toBe(12); }
    expect(S.cacheRun("full", S.CACHE_SEQS.loc.seq).every((f) => f.evicted === null)).toBe(true);
  });
  it("PYQ Q6.16: 10 ns cache, 100 ns memory, h = 0.9 gives 20 ns (19 ns if simultaneous)", () => { expect(S.emat(0.9, 10, 100)).toBeCloseTo(20); expect(S.emat(0.9, 10, 100, true)).toBeCloseTo(19); expect(S.emat(1, 10, 100)).toBe(10); expect(S.emat(0, 10, 100)).toBe(110); });
});

describe("coavmem: page replacement", () => {
  const faults = (a: S.Repl, n: number, s: readonly number[]) => S.pageRun(a, n, s).at(-1)!.faults;
  it("classic string with 3 frames: FIFO 15, LRU 12, OPT 9", () => { expect(faults("fifo", 3, S.PAGE_SEQS.classic)).toBe(15); expect(faults("lru", 3, S.PAGE_SEQS.classic)).toBe(12); expect(faults("opt", 3, S.PAGE_SEQS.classic)).toBe(9); });
  it("Belady's anomaly: FIFO has more faults with 4 frames (10) than 3 (9)", () => { expect(faults("fifo", 3, S.PAGE_SEQS.belady)).toBe(9); expect(faults("fifo", 4, S.PAGE_SEQS.belady)).toBe(10); expect(faults("lru", 4, S.PAGE_SEQS.belady)).toBeLessThanOrEqual(faults("lru", 3, S.PAGE_SEQS.belady)); });
});

describe("coabooth: Booth multiplication and division", () => {
  it("every 4-bit signed product is right", () => { const bad: string[] = []; for (let a = -7; a < 8; a++) for (let b = -8; b < 8; b++) if (S.boothProduct(S.boothFrames(a, b).at(-1)!) !== a * b) bad.push(`${a}x${b}`); expect(bad).toEqual([]); });
  it("7 x -3 = -21 takes 9 frames", () => { const f = S.boothFrames(7, -3); expect(f.length).toBe(9); expect(S.boothProduct(f.at(-1)!)).toBe(-21); });
  it("recognises runs of ones: multiplier 0111 (7) uses one subtract and one add", () => { const ops = S.boothFrames(3, 7).map((f) => f.op).filter((o) => o === "A + M" || o === "A - M"); expect(ops).toEqual(["A - M", "A + M"]); });
  it("restoring division 13 / 3 = 4 remainder 1", () => { const f = S.divFrames(13, 3).at(-1)!; expect(f.Q).toBe(4); expect(f.A).toBe(1); const g = S.divFrames(15, 4).at(-1)!; expect([g.Q, g.A]).toEqual([3, 3]); });
});

describe("coaddr: addressing modes", () => {
  it("the textbook table with R1 = 400, XR = 100, address field 500", () => {
    const e = (m: S.AMode) => S.effective(m, 500, 400, 100);
    expect(e("imm").operand).toBe(500); expect(e("dir")).toMatchObject({ ea: 500, operand: 800 }); expect(e("ind")).toMatchObject({ ea: 800, operand: 300, accesses: 2 });
    expect(e("reg").operand).toBe(400); expect(e("regind")).toMatchObject({ ea: 400, operand: 700 }); expect(e("autodec")).toMatchObject({ ea: 399, operand: 450 });
    expect(e("rel")).toMatchObject({ ea: 702, operand: 325 }); expect(e("idx")).toMatchObject({ ea: 600, operand: 900 });
  });
});

describe("coapipe: pipeline hazards", () => {
  it("independent instructions: 5 + 4 cycles, CPI 9/5, no stalls", () => { const r = S.pipeline("free", true, 0); expect(r.cycles).toBe(9); expect(r.stalls).toBe(0); });
  it("RAW without forwarding stalls 2 cycles per dependent neighbour", () => { const r = S.pipeline("alu", false, 0); expect(r.rows[1].stalls).toBe(2); expect(r.cycles).toBe(9 + r.stalls); });
  it("forwarding removes ALU stalls, load-use still costs 1", () => { expect(S.pipeline("alu", true, 0).stalls).toBe(0); expect(S.pipeline("load", true, 0).stalls).toBe(1); expect(S.pipeline("load", false, 0).stalls).toBeGreaterThan(1); });
  it("branch penalty adds bubbles and speed-up is below 5", () => { const a = S.pipeline("branch", true, 0), b = S.pipeline("branch", true, 2); expect(b.cycles).toBe(a.cycles + 2); expect(b.speedup).toBeLessThan(5); expect(a.speedup).toBeLessThan(5); });
});

describe("coaio: I/O methods", () => {
  it("CPU time free: programmed 0%, interrupt 80%, DMA about 97%", () => { const r = S.ioModel(100, 50, 10); expect(r.prog.free).toBe(0); expect(r.intr.free).toBeCloseTo(0.8); expect(r.dma.free).toBeCloseTo(1 - 130 / 5020, 4); });
  it("daisy chain: the device nearest the CPU wins", () => { expect(S.daisy(0b1010)).toMatchObject({ winner: 1, passed: [0] }); expect(S.daisy(0b1000).winner).toBe(3); expect(S.daisy(0).winner).toBe(-1); });
});

describe("coacycle: instruction cycle", () => {
  it("5 + 3 ends with AC = 8 stored at M[14]", () => { const f = S.cycleFrames("add", false); const l = f.at(-1)!; expect(l.phase).toBe("halt"); expect(l.ac).toBe(8); expect(l.mem[14]).toBe(8); expect(f[1].rtl).toContain("AR <- PC"); });
  it("jump skips the ADD", () => { const l = S.cycleFrames("jump", false).at(-1)!; expect(l.ac).toBe(5); expect(l.mem[14]).toBe(5); });
  it("an interrupt saves the return address in M[0] and the program still finishes", () => {
    const f = S.cycleFrames("add", true), l = f.at(-1)!;
    expect(f.some((x) => x.phase === "int")).toBe(true); expect(l.ac).toBe(8); expect(l.mem[0]).toBe(3);
  });
});

describe("Java labs", () => {
  it("dynamic dispatch uses the object's class (PYQ Q7.3)", () => {
    expect(S.dispatch("Animal", "Dog", "speak")).toMatchObject({ ok: true, impl: "Dog", out: "Woof" });
    expect(S.dispatch("Animal", "Cat", "speak").out).toBe("Meow");
    expect(S.dispatch("Animal", "Puppy", "speak")).toMatchObject({ impl: "Dog", lookup: ["Puppy", "Dog"] });
    expect(S.dispatch("Animal", "Puppy", "eat").impl).toBe("Puppy");
    expect(S.dispatch("Animal", "Cat", "eat").impl).toBe("Animal");
  });
  it("compile-time errors come from the reference type", () => {
    expect(S.dispatch("Animal", "Dog", "fetch").ok).toBe(false); expect(S.dispatch("Dog", "Dog", "fetch").ok).toBe(true);
    expect(S.dispatch("Dog", "Cat", "speak").ok).toBe(false); expect(S.jChain("Puppy")).toEqual(["Puppy", "Dog", "Animal"]);
  });
  it("garbage collection frees only unreachable objects", () => {
    const g = S.JHEAP_FRAMES.gc; expect(S.jLive(g[5])).toBe(1); expect(g[5].objs.filter((o) => o.dead).length).toBe(1); expect(g[6].objs.length).toBe(1); expect(g[6].gc).toBe(true);
  });
  it("string pool: literals shared, new String is separate, StringBuffer mutates in place", () => {
    const s = S.JHEAP_FRAMES.str; expect(s[2].vars[0].to).toBe(s[2].vars[1].to); expect(s[3].vars[2].to).not.toBe(s[3].vars[0].to);
    expect(s[4].objs.length).toBe(s[3].objs.length + 1); expect(s[6].objs.length).toBe(s[5].objs.length);
  });
  it("exception flow: finally always runs", () => {
    for (const k of ["none", "arith", "index", "custom"] as const) for (const ca of [false, true]) for (const e of [false, true]) expect(S.excFlow(k, ca, e).output).toContain("finally");
    expect(S.excFlow("none", false, false).output).toBe("stmt1 stmt2 finally after");
    expect(S.excFlow("arith", false, false)).toMatchObject({ output: "stmt1 catch finally after", outcome: "caught" });
    expect(S.excFlow("custom", false, false).outcome).toBe("propagates"); expect(S.excFlow("custom", true, false).outcome).toBe("caught");
    expect(S.excFlow("none", false, true).output).toBe("stmt1 finally");
  });
  it("thread lifecycle starts NEW and ends TERMINATED", () => { expect(S.THREAD_LIFE[0].state).toBe("NEW"); expect(S.THREAD_LIFE.at(-1)!.state).toBe("TERMINATED"); expect(S.THREAD_LIFE.map((t) => t.state)).toContain("WAITING"); });
  it("race condition loses updates unless synchronized", () => {
    expect(S.raceRun(2, 10, false).lost).toBeGreaterThan(0);
    expect(S.raceRun(2, 10, true).counter).toBe(20); expect(S.raceRun(1, 10, true).counter).toBe(20); expect(S.raceRun(5, 10, true).counter).toBe(20);
    expect(S.raceRun(3, 10, false).lost).toBe(0);
  });
  it("bytecode executes a + b * k on an operand stack", () => {
    const f = S.jvmFrames(3, 4, 2), l = f.at(-1)!; expect(l.locals[3]).toBe(11); expect(Math.max(...f.map((x) => x.stack.length))).toBe(3); expect(f[8].stack).toEqual([3, 8]);
  });
});
