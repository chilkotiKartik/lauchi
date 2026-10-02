import { describe, expect, it } from "vitest";
import { clampParams, decodeParams, encodeParams, flag, num, opt } from "./params-core";

const spec = { R: num(20, 1, 200), mode: opt("half", ["half", "full"] as const), on: flag(false) };

describe("lab params", () => {
  it("fills defaults", () => expect(clampParams(spec, null)).toEqual({ R: 20, mode: "half", on: false }));
  it("clamps numbers and rejects wrong types and unknown keys", () => {
    expect(clampParams(spec, { R: 1e9, mode: "evil", on: "yes", x: 5 })).toEqual({ R: 200, mode: "half", on: false });
    expect(clampParams(spec, { R: -4, mode: "full", on: true })).toEqual({ R: 1, mode: "full", on: true });
    expect(clampParams(spec, { R: Number.NaN })).toEqual({ R: 20, mode: "half", on: false });
    expect(clampParams(spec, [1, 2])).toEqual({ R: 20, mode: "half", on: false });
  });
  it("round-trips share links", () => {
    const p = { R: 12.5, mode: "full", on: true, λ: 1 };
    const back = decodeParams(encodeParams(p));
    expect(back).toEqual({ R: 12.5, mode: "full", on: true }); // non-ASCII key dropped
  });
  it("rejects malformed or oversized links", () => {
    expect(decodeParams("!!!")).toBeNull();
    expect(decodeParams("a".repeat(2000))).toBeNull();
    expect(decodeParams(encodeParams({ a: 1 }).slice(0, 3))).toBeNull();
    expect(decodeParams(null)).toBeNull();
    expect(decodeParams(encodeParams({ s: "x".repeat(40) } as never))).toEqual({});
  });
  it("does not let __proto__ through", () => {
    const evil = btoa('{"__proto__":{"polluted":1},"R":3}').replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
    const d = decodeParams(evil);
    expect(clampParams(spec, d).R).toBe(3);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});
