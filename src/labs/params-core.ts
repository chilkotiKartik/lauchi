/** Server-safe lab parameter specs. Used by the scenes, the registry presets and the saved-setup validation. */
export type NumSpec = { kind: "num"; d: number; min: number; max: number };
export type OptSpec<T extends string = string> = { kind: "opt"; d: T; options: readonly T[] };
export type FlagSpec = { kind: "flag"; d: boolean };
export type ParamSpec = Record<string, NumSpec | OptSpec | FlagSpec>;
export type Params = Record<string, number | string | boolean>;
export type Values<S extends ParamSpec> = { [K in keyof S]: S[K] extends NumSpec ? number : S[K] extends OptSpec<infer T> ? T : boolean };

export const num = (d: number, min: number, max: number): NumSpec => ({ kind: "num", d, min, max });
export const opt = <T extends string>(d: NoInfer<T>, options: readonly T[]): OptSpec<T> => ({ kind: "opt", d, options });
export const flag = (d: boolean): FlagSpec => ({ kind: "flag", d });

/** Defaults overlaid with any valid values from `input`: unknown keys dropped, wrong types ignored, numbers clamped. */
export function clampParams<S extends ParamSpec>(spec: S, input: unknown): Values<S> {
  const src = input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
  const out: Params = {};
  for (const [k, s] of Object.entries(spec)) {
    const v = Object.prototype.hasOwnProperty.call(src, k) ? src[k] : undefined;
    if (s.kind === "num") out[k] = typeof v === "number" && Number.isFinite(v) ? Math.min(s.max, Math.max(s.min, v)) : s.d;
    else if (s.kind === "opt") out[k] = typeof v === "string" && s.options.includes(v) ? v : s.d;
    else out[k] = typeof v === "boolean" ? v : s.d;
  }
  return out as Values<S>;
}

/** Share links carry the values as base64url JSON. Returns null for anything malformed or oversized. */
export function decodeParams(s: string | undefined | null): Params | null {
  if (!s || s.length > 1200 || !/^[A-Za-z0-9_-]+$/.test(s)) return null;
  try {
    const b = s.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b);
    const json = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
    const v = JSON.parse(json);
    if (!v || typeof v !== "object" || Array.isArray(v)) return null;
    const out: Params = {};
    for (const [k, x] of Object.entries(v)) if (/^[a-zA-Z][a-zA-Z0-9]{0,23}$/.test(k) && (typeof x === "number" || typeof x === "boolean" || (typeof x === "string" && x.length <= 24))) out[k] = x;
    return out;
  } catch { return null; }
}
export function encodeParams(p: Params): string {
  const json = JSON.stringify(p);
  const b = btoa(Array.from(new TextEncoder().encode(json), (x) => String.fromCharCode(x)).join(""));
  return b.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
