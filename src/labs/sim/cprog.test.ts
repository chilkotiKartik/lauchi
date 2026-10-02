import { describe, expect, it } from "vitest";
import { CTYPE, binaryWorst, bitHint, bitOp, bin8, hex, hex2, makeInput, mulberry32, pointerInfo, searchArray, searchTrace, sortTrace, sortedOrder, structLayout, unionSize } from "./cprog";

const sorted = (a: number[]) => a.every((v, i) => i === 0 || a[i - 1] <= v);

describe("sorting traces", () => {
  it("inputs are permutations of 1…n and reproducible", () => {
    for (const order of ["random", "nearly", "reversed"] as const) {
      const a = makeInput(15, 3, order);
      expect([...a].sort((x, y) => x - y)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
      expect(makeInput(15, 3, order)).toEqual(a);
    }
    expect(makeInput(10, 1, "reversed")).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
  });
  it("every algorithm ends sorted", () => {
    for (const algo of ["bubble", "insertion", "selection"] as const) for (const order of ["random", "nearly", "reversed"] as const) {
      const t = sortTrace(algo, makeInput(20, 5, order));
      expect(sorted(t[t.length - 1].a)).toBe(true); expect(t[t.length - 1].kind).toBe("done");
    }
  });
  it("bubble sort on a reversed array of 12 makes 66 comparisons and 66 swaps", () => {
    const e = sortTrace("bubble", makeInput(12, 1, "reversed")).at(-1)!;
    expect(e.cmp).toBe(66); expect(e.mov).toBe(66);
  });
  it("insertion sort on sorted data is O(n): n−1 comparisons and no shifts", () => {
    const e = sortTrace("insertion", [1, 2, 3, 4, 5, 6, 7, 8]).at(-1)!;
    expect(e.cmp).toBe(7); expect(e.mov).toBe(0);
  });
  it("selection sort always makes n(n−1)/2 comparisons and at most n−1 swaps", () => {
    const e = sortTrace("selection", makeInput(12, 7, "random")).at(-1)!;
    expect(e.cmp).toBe(66); expect(e.mov).toBeLessThanOrEqual(11);
  });
  it("bubble sort stops early on sorted data", () => {
    expect(sortTrace("bubble", [1, 2, 3, 4, 5]).at(-1)!.cmp).toBe(4);
  });
});

describe("searching", () => {
  it("the array is strictly increasing and stable in n", () => {
    const a = searchArray(64);
    expect(a.every((v, i) => i === 0 || v > a[i - 1])).toBe(true); expect(a[63]).toBeLessThanOrEqual(260);
    expect(searchArray(10)).toEqual(a.slice(0, 10));
  });
  it("finds every element with both methods; binary never exceeds ⌈log₂(n+1)⌉ probes", () => {
    const a = searchArray(64);
    for (let i = 0; i < a.length; i++) {
      expect(searchTrace("linear", a, a[i]).found).toBe(i);
      const b = searchTrace("binary", a, a[i]); expect(b.found).toBe(i); expect(b.probes).toBeLessThanOrEqual(binaryWorst(64));
    }
    expect(binaryWorst(64)).toBe(7); expect(binaryWorst(1000000)).toBe(20);
  });
  it("missing values are reported as not found", () => {
    const a = searchArray(32);
    expect(searchTrace("linear", a, 0).found).toBe(-1); expect(searchTrace("linear", a, 0).probes).toBe(32);
    expect(searchTrace("binary", a, 999).found).toBe(-1);
  });
});

describe("pointers", () => {
  it("p + i moves i × sizeof bytes", () => {
    const r = pointerInfo("int", 6, 1, 2, 0x1000);
    expect(r.addrK).toBe(0x1004); expect(r.addrP).toBe(0x100c); expect(r.offset).toBe(8); expect(r.value).toBe(40); expect(r.sizeofA).toBe(24);
    expect(pointerInfo("double", 6, 0, 2, 0x1000).addrP).toBe(0x1010);
  });
  it("flags out-of-bounds and one-past-the-end", () => {
    expect(pointerInfo("int", 4, 2, 2, 0).onePast).toBe(true); expect(pointerInfo("int", 4, 2, 3, 0).inBounds).toBe(false);
    expect(pointerInfo("int", 4, 2, -3, 0).inBounds).toBe(false);
  });
  it("hex formatting", () => expect(hex(0x7ffe3c10)).toBe("0x7ffe3c10"));
});

describe("bits", () => {
  it("results match C for unsigned char", () => {
    expect(bitOp("and", 12, 10, 0)).toBe(8); expect(bitOp("or", 12, 10, 0)).toBe(14); expect(bitOp("xor", 12, 10, 0)).toBe(6);
    expect(bitOp("not", 12, 0, 0)).toBe(243); expect(bitOp("shl", 12, 0, 2)).toBe(48); expect(bitOp("shl", 200, 0, 2)).toBe(32); expect(bitOp("shr", 200, 0, 3)).toBe(25);
  });
  it("XOR swap identity", () => { for (const [a, b] of [[170, 85], [3, 200], [0, 0]]) expect(bitOp("xor", bitOp("xor", a, b, 0), b, 0)).toBe(a); });
  it("formatting and hints", () => {
    expect(bin8(12)).toBe("0000 1100"); expect(hex2(10)).toBe("0x0A"); expect(bitHint("and", 5, 1, 0)).toContain("odd"); expect(bitHint("shl", 200, 0, 2)).toContain("lost");
  });
});

describe("struct layout", () => {
  it("char,int,char,double is 24 bytes with 10 bytes of padding", () => {
    const L = structLayout(["char", "int", "char", "double"]);
    expect(L.offsets).toEqual([0, 4, 8, 16]); expect(L.size).toBe(24); expect(L.padding).toBe(10);
  });
  it("sorting largest first gives 16 bytes", () => {
    const t = ["char", "int", "char", "double"] as const, o = sortedOrder(t);
    expect(structLayout(o.map((i) => t[i])).size).toBe(16);
  });
  it("size is a multiple of the largest alignment and never less than the data", () => {
    const rnd = mulberry32(5), names = Object.keys(CTYPE) as (keyof typeof CTYPE)[];
    for (let k = 0; k < 200; k++) {
      const t = Array.from({ length: 1 + Math.floor(rnd() * 6) }, () => names[Math.floor(rnd() * names.length)]);
      const L = structLayout(t), data = t.reduce((s, x) => s + CTYPE[x][0], 0);
      expect(L.size % L.align).toBe(0); expect(L.size).toBeGreaterThanOrEqual(data); expect(L.size - data).toBe(L.padding);
      expect(structLayout(sortedOrder(t).map((i) => t[i])).size).toBeLessThanOrEqual(L.size);
    }
  });
  it("union size is the largest member rounded up to the strictest alignment", () => { expect(unionSize(["char", "int", "double"])).toBe(8); expect(unionSize(["char", "short"])).toBe(2); });
});
