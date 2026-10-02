import { describe, expect, it } from "vitest";
import { buildPipeline, callStates, factorial, fibonacci, fileSim, flowTrace, heapStates, ptrArith, runVM, sortStates, structInfo, unionRead, unionWrite, SORT_ARRAYS, HEAP_BYTES } from "./cstx";

describe("pipeline VM", () => {
  it("hello prints Hi!", () => { const p = buildPipeline("hello", 0, 0, 0); expect(p.states.at(-1)!.out).toBe("Hi!"); expect(p.src.length).toBeLessThan(p.pre.length); });
  it("sum adds two ints", () => { const s = buildPipeline("sum", 7, 12, 0).states; expect(s.at(-1)!.out).toBe("19"); expect(s.at(-1)!.mem.slice(0, 3)).toEqual([7, 12, 19]); });
  it("loop sums 1..n", () => { expect(buildPipeline("loop", 0, 0, 10).states.at(-1)!.out).toBe("55"); expect(buildPipeline("loop", 0, 0, 1).states.at(-1)!.out).toBe("1"); });
  it("linker relocates jumps and the VM halts", () => { const p = buildPipeline("loop", 0, 0, 3); expect(p.exe).not.toEqual(p.obj); expect(p.states.at(-1)!.done).toBe(true); expect(runVM(p.exe).length).toBe(p.states.length); });
});

describe("control flow interpreter", () => {
  it("Q2.9 break prints 15", () => expect(flowTrace("break", 5).output).toBe("15 "));
  it("continue prints 15 19 20", () => expect(flowTrace("continue", 5).output).toBe("15 19 20 "));
  it("primes up to 30", () => expect(flowTrace("primes", 30).output.trim()).toBe("2 3 5 7 11 13 17 19 23 29"));
  it("triangle", () => expect(flowTrace("pattern", 4).output).toBe("1 \n1 2 \n1 2 3 \n1 2 3 4 \n"));
  it("Q2.8 short circuit y=1 z=1 and skips j+1 for z", () => {
    const r = flowTrace("shortcirc", 0);
    expect(r.output).toBe("y=1 z=1");
    expect(r.events.filter((e) => e.role === "skip").length).toBe(1);
  });
  it("Q2.10 stray semicolon prints 6", () => expect(flowTrace("semicolon", 5).output).toBe("6 "));
});

describe("sorting", () => {
  const cnt = (a: number[], alg: "bubble" | "insertion" | "selection" | "quick", early = true) => { const s = sortStates(alg, a, early); return s[s.length - 1]; };
  it("bubble on [5,1,4,2,8,7]: 12 comparisons with early exit, 15 without, 5 swaps", () => {
    expect(cnt([5, 1, 4, 2, 8, 7], "bubble").cmps).toBe(12);
    expect(cnt([5, 1, 4, 2, 8, 7], "bubble", false).cmps).toBe(15);
    expect(cnt([5, 1, 4, 2, 8, 7], "bubble").swaps).toBe(5);
  });
  it("every algorithm sorts every exam array", () => {
    for (const a of Object.values(SORT_ARRAYS)) for (const alg of ["bubble", "insertion", "selection", "quick"] as const) {
      const last = cnt([...a], alg);
      expect(last.arr, alg).toEqual([...a].sort((x, y) => x - y));
      expect(last.fixed.every(Boolean)).toBe(true);
    }
  });
  it("selection makes n(n-1)/2 comparisons", () => expect(cnt([...SORT_ARRAYS.a4], "selection").cmps).toBe(36));
});

describe("call stack", () => {
  it("factorial(5) depth and value", () => { const s = callStates("fact", 5); expect(s.at(-1)!.last).toBe(120); expect(s.at(-1)!.maxDepth).toBe(5); expect(factorial(5)).toBe(120); });
  it("fibonacci(6) = 8 with 25 calls", () => { const s = callStates("fib", 6); expect(s.at(-1)!.last).toBe(8); expect(s.at(-1)!.calls).toBe(25); expect(fibonacci(6)).toBe(8); });
});

describe("pointers and heap", () => {
  it("Q4.6: ptr2 - ptr1 = 5 but the char* difference = 20", () => { const r = ptrArith("int", 5); expect(r.diffElems).toBe(5); expect(r.diffBytes).toBe(20); expect(ptrArith("double", 5).diffBytes).toBe(40); });
  it("first-fit malloc, free and coalescing", () => {
    const s = heapStates("basic");
    expect(s[1].used).toBe(16); expect(s[2].used).toBe(32);
    expect(s.at(-1)!.used).toBe(0); expect(s.at(-1)!.blocks.length).toBe(1); expect(s.at(-1)!.free).toBe(HEAP_BYTES);
  });
  it("detects the leak when the only pointer is overwritten", () => {
    const s = heapStates("leak");
    expect(s[2].leaked).toBe(0); expect(s[3].leaked).toBe(32); expect(s[3].leakedIds.length).toBe(1);
    expect(s.at(-1)!.leaked).toBe(32); expect(s.at(-1)!.dangling).toContain("q");
  });
  it("realloc moves a block that cannot grow", () => { const s = heapStates("realloc"); expect(s[3].addr.a).not.toBe(s[2].addr.a); expect(s[5].addr.c).toBe(0x5000); });
});

describe("struct, union, FILE", () => {
  it("struct {char; int; char} is 12 bytes with 6 padding; reordered it is 8", () => {
    expect(structInfo(["char", "int", "char"]).size).toBe(12); expect(structInfo(["char", "int", "char"]).padding).toBe(6);
    expect(structInfo(["int", "char", "char"]).size).toBe(8);
  });
  it("union sizeof is the largest member (8)", () => expect(structInfo(["char", "short", "int", "float", "double"]).unionSize).toBe(8));
  it("write int, read char (little-endian)", () => {
    const b = unionWrite("int", 0x41424344);
    expect(b.slice(0, 4)).toEqual([0x44, 0x43, 0x42, 0x41]); expect(unionRead("char", b)).toBe(0x44); expect(unionRead("short", b)).toBe(0x4344);
    expect(unionRead("float", unionWrite("float", 1.5))).toBe(1.5);
  });
  it("file modes", () => {
    expect(fileSim("r", false, 2, 0).ok).toBe(false);
    expect(fileSim("w", true, 0, 2).content).toBe("AB");
    expect(fileSim("a", true, 0, 2).content).toBe("HELLOAB");
    expect(fileSim("r+", true, 2, 2).content).toBe("HEABO");
    expect(fileSim("w", false, 0, 1).created).toBe(true);
    expect(fileSim("r", true, 3, 0).readData).toBe("HEL");
    expect(fileSim("a+", true, 3, 1).readData).toBe("HEL");
  });
});
