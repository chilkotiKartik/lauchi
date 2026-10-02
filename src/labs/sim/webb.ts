/** Maths for the Web Development 301 and 401 labs. Pure functions, no React. Assumptions are named in the lab notes. */

// ---------- WD-301 u1: which components re-render? ----------
/** A full tree stored level by level: node k of level l has parent floor(k / branch) on level l−1. */
export function rerender(depth: number, branch: number, level: number, memo: boolean) {
  const lv = Math.min(level, depth), mask: boolean[] = [];
  let total = 0, rendered = 0;
  for (let l = 0; l <= depth; l++) {
    const count = branch ** l, sub = l >= lv ? branch ** (l - lv) : 0; // descendants of node 0 of level lv, on level l
    for (let k = 0; k < count; k++) {
      const hit = l === lv ? k === 0 : l > lv && k < sub && !memo;
      mask.push(hit); total++; if (hit) rendered++;
    }
  }
  return { total, rendered, mask, savedPct: total ? (1 - rendered / total) * 100 : 0 };
}

// ---------- WD-301 u2: state updates in one click ----------
export function stateBatch(clicks: number, sets: number, updater: boolean, batched: boolean) {
  const count = updater ? clicks * sets : clicks; // setCount(count + 1) reads the same stale count each time
  const renders = batched ? clicks : clicks * sets;
  const perClick = updater ? sets : 1;
  return { count, renders, perClick, lost: clicks * sets - count };
}

// ---------- WD-301 u3: how often does an effect run? ----------
export type DepsMode = "none" | "empty" | "dep" | "object";
export function effectRuns(renders: number, every: number, mode: DepsMode) {
  const runs: boolean[] = [];
  let last = -1;
  for (let i = 0; i < renders; i++) {
    const v = Math.floor(i / every);
    let run: boolean;
    if (mode === "none" || mode === "object") run = true;
    else if (mode === "empty") run = i === 0;
    else run = v !== last;
    last = v;
    runs.push(run);
  }
  const count = runs.filter(Boolean).length;
  return { runs, count, cleanups: Math.max(0, count - 1), skipped: renders - count };
}

// ---------- WD-301 u4: client-side routing and paging ----------
export function matchRoute(pattern: string, path: string): { ok: boolean; params: Record<string, string>; why: string } {
  const P = pattern.split("/").filter(Boolean), U = path.split("?")[0].split("/").filter(Boolean), params: Record<string, string> = {};
  for (let i = 0; i < P.length; i++) {
    if (P[i] === "*") { params["*"] = U.slice(i).join("/"); return U.length > i ? { ok: true, params, why: "the * segment takes the rest of the path" } : { ok: false, params: {}, why: "nothing left for the * segment" }; }
    if (i >= U.length) return { ok: false, params: {}, why: `the path ends before "${P[i]}"` };
    if (P[i].startsWith(":")) params[P[i].slice(1)] = decodeURIComponent(U[i]);
    else if (P[i] !== U[i]) return { ok: false, params: {}, why: `"${U[i]}" is not "${P[i]}"` };
  }
  return U.length === P.length ? { ok: true, params, why: "every segment matches" } : { ok: false, params: {}, why: "the path has extra segments" };
}
export function paging(page: number, size: number, total: number) {
  const pages = Math.max(1, Math.ceil(total / size)), p = Math.min(Math.max(1, page), pages), offset = (p - 1) * size;
  return { pages, page: p, offset, shown: Math.max(0, Math.min(size, total - offset)), hasNext: p < pages, hasPrev: p > 1 };
}

// ---------- WD-301 u5: making illegal states unrepresentable ----------
export function stateSpace(bools: number, valid: number) {
  const total = 2 ** bools, ok = Math.min(valid, total);
  return { total, valid: ok, illegal: total - ok, illegalPct: ((total - ok) / total) * 100 };
}

// ---------- WD-301 u6: a reducer replays actions ----------
export type CartAction = { type: "add"; price: number } | { type: "remove" } | { type: "clear" };
export type Cart = { items: number[]; total: number };
export function actionLog(n: number, addPct: number): CartAction[] {
  return Array.from({ length: n }, (_, i) => {
    const r = (i * 37 + 11) % 100;
    if (r < addPct) return { type: "add", price: 10 + ((i * 13) % 50) } as CartAction;
    return r < addPct + (100 - addPct) * 0.8 ? ({ type: "remove" } as CartAction) : ({ type: "clear" } as CartAction);
  });
}
export function cartReducer(s: Cart, a: CartAction): Cart {
  if (a.type === "add") return { items: [...s.items, a.price], total: s.total + a.price };
  if (a.type === "remove") { if (!s.items.length) return s; const last = s.items[s.items.length - 1]; return { items: s.items.slice(0, -1), total: s.total - last }; }
  return { items: [], total: 0 };
}
export function replay(log: CartAction[], step: number) {
  let s: Cart = { items: [], total: 0 };
  const history = [{ n: 0, total: 0 }];
  for (let i = 0; i < Math.min(step, log.length); i++) { s = cartReducer(s, log[i]); history.push({ n: s.items.length, total: s.total }); }
  return { state: s, history };
}

// ---------- WD-301 u7: retrying an API call ----------
export function backoff(baseMs: number, factor: number, attempts: number, capMs: number, failPct: number) {
  const p = failPct / 100, waits = Array.from({ length: Math.max(0, attempts - 1) }, (_, j) => Math.min(capMs, baseMs * factor ** j));
  const pAllFail = p ** attempts;
  let expWait = 0;
  waits.forEach((w, j) => { expWait += p ** (j + 1) * w; });
  const expAttempts = p >= 1 ? attempts : (1 - p ** attempts) / (1 - p);
  return { waits, worstWait: waits.reduce((s, x) => s + x, 0), expWait, pAllFail, pSuccess: 1 - pAllFail, expAttempts };
}

// ---------- WD-301 u8: WCAG colour contrast ----------
const lin = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
export const luminance = (r: number, g: number, b: number) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
export function contrast(fg: [number, number, number], bg: [number, number, number]) {
  const a = luminance(...fg), b = luminance(...bg), hi = Math.max(a, b), lo = Math.min(a, b), ratio = (hi + 0.05) / (lo + 0.05);
  return { ratio, aa: ratio >= 4.5, aaLarge: ratio >= 3, aaa: ratio >= 7, aaaLarge: ratio >= 4.5, fgL: a, bgL: b };
}

// ---------- WD-301 u9: code splitting ----------
export function codeSplit(routes: number, routeKB: number, vendorKB: number, visited: number, mbps: number) {
  const ms = (kb: number) => (kb * 8) / mbps, v = Math.min(Math.max(1, visited), routes);
  const single = vendorKB + routes * routeKB, initial = vendorKB + routeKB, after = vendorKB + v * routeKB;
  return { single, initial, after, singleMs: ms(single), initialMs: ms(initial), savedPct: (1 - initial / single) * 100, unusedKB: single - after, visited: v };
}

// ---------- WD-401 u1: merge, squash or rebase ----------
export type Strategy = "merge" | "squash" | "rebase";
export function integrate(m0: number, f: number, m1: number, s: Strategy) {
  const base = m0 + m1;
  const commits = s === "merge" ? base + f + 1 : s === "squash" ? base + 1 : base + f;
  return { commits, mergeCommit: s === "merge", linear: s !== "merge", rewritten: s === "rebase" ? f : 0, featureVisible: s === "squash" ? 0 : f, base };
}

// ---------- WD-401 u2: what bundling removes ----------
export function bundleSize(modules: number, kbPer: number, usedPct: number, minifyPct: number, gzipPct: number) {
  const raw = modules * kbPer, shaken = raw * (usedPct / 100), minified = shaken * (minifyPct / 100), gz = minified * (gzipPct / 100);
  return { raw, shaken, minified, gz, ratio: raw / gz };
}

// ---------- WD-401 u3: source-map VLQ ----------
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
export function vlqEncode(n: number) {
  let v = n < 0 ? (-n << 1) | 1 : n << 1;
  const groups: { bits: number; char: string; more: boolean }[] = [];
  do {
    let d = v & 31; v >>>= 5;
    const more = v > 0;
    if (more) d |= 32;
    groups.push({ bits: d, char: B64[d], more });
  } while (v > 0);
  return { zigzag: n < 0 ? (-n << 1) | 1 : n << 1, groups, text: groups.map((g) => g.char).join("") };
}
export function vlqDecode(s: string): number {
  let v = 0, shift = 0;
  for (const ch of s) {
    const d = B64.indexOf(ch);
    v |= (d & 31) << shift; shift += 5;
    if (!(d & 32)) break;
  }
  return v & 1 ? -(v >> 1) : v >> 1;
}

// ---------- WD-401 u4: the test pyramid ----------
/** Assumed cost and flakiness: unit 0.02 s and 0%, integration 0.5 s and 0.2%, end-to-end 20 s and 2% per test. */
export function pyramid(unit: number, integ: number, e2e: number) {
  const t = [unit * 0.02, integ * 0.5, e2e * 20], total = t[0] + t[1] + t[2];
  const pClean = (1 - 0.002) ** integ * (1 - 0.02) ** e2e;
  return { tests: unit + integ + e2e, seconds: total, parts: t, e2eShare: total ? t[2] / total : 0, pClean };
}

// ---------- WD-401 u5: a CI pipeline ----------
export type Stage = { name: string; min: number; fail: number };
export function pipelineStats(e2eMin: number, unitFailPct: number, e2eFailPct: number, cache: boolean, parallel: boolean) {
  const stages: Stage[] = [
    { name: "lint", min: 0.5, fail: 0.03 },
    { name: "unit tests", min: 2, fail: unitFailPct / 100 },
    { name: "build", min: cache ? 1 : 3, fail: 0.02 },
    { name: "end-to-end", min: e2eMin, fail: e2eFailPct / 100 },
    { name: "deploy", min: 1, fail: 0.01 },
  ];
  const pGreen = stages.reduce((p, s) => p * (1 - s.fail), 1);
  let cleanMin: number, expMin: number;
  if (parallel) {
    const first = Math.max(stages[0].min, stages[1].min, stages[2].min), pFirst = (1 - stages[0].fail) * (1 - stages[1].fail) * (1 - stages[2].fail);
    cleanMin = first + stages[3].min + stages[4].min;
    expMin = first + pFirst * stages[3].min + pFirst * (1 - stages[3].fail) * stages[4].min;
  } else {
    cleanMin = stages.reduce((s, x) => s + x.min, 0);
    let reach = 1; expMin = 0;
    for (const s of stages) { expMin += reach * s.min; reach *= 1 - s.fail; }
  }
  return { stages, pGreen, cleanMin, expMin };
}

// ---------- WD-401 u6: staged rollout ----------
export function rollout(rps: number, rolloutPct: number, badErrPct: number, detectMin: number, stagingCatchPct: number) {
  const failed = rps * 60 * detectMin * (rolloutPct / 100) * (badErrPct / 100);
  const bigBang = rps * 60 * detectMin * (badErrPct / 100);
  const reachProd = 1 - stagingCatchPct / 100;
  return { failed, bigBang, saved: bigBang > 0 ? (1 - failed / bigBang) * 100 : 0, expected: failed * reachProd, expectedBig: bigBang * reachProd, reachProd };
}

// ---------- WD-401 u7: Docker image layers ----------
export type Changed = "app" | "deps" | "base";
export function layers(base: number, tools: number, deps: number, app: number, changed: Changed, multistage: boolean) {
  const L = [{ name: "base image", mb: base, final: true }, { name: "build tools", mb: tools, final: !multistage }, { name: "dependencies", mb: deps, final: true }, { name: "application", mb: app, final: true }];
  const from = changed === "base" ? 0 : changed === "deps" ? 2 : 3;
  const rebuilt = L.map((_, i) => i >= from);
  const finalMB = L.filter((l) => l.final).reduce((s, l) => s + l.mb, 0);
  const pushed = L.reduce((s, l, i) => s + (rebuilt[i] && l.final ? l.mb : 0), 0);
  return { layers: L, rebuilt, finalMB, pushed, reusedPct: finalMB ? (1 - pushed / finalMB) * 100 : 0, count: rebuilt.filter(Boolean).length };
}

// ---------- WD-401 u8: plural categories (CLDR rules for whole numbers) ----------
export type Lang = "en" | "fr" | "ru" | "pl" | "ar" | "ja";
export type Cat = "zero" | "one" | "two" | "few" | "many" | "other";
export function pluralCategory(lang: Lang, n: number): Cat {
  switch (lang) {
    case "en": return n === 1 ? "one" : "other";
    case "fr": return n === 0 || n === 1 ? "one" : n !== 0 && n % 1000000 === 0 ? "many" : "other";
    case "ja": return "other";
    case "ru": { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? "one" : a >= 2 && a <= 4 && !(b >= 12 && b <= 14) ? "few" : "many"; }
    case "pl": { const a = n % 10, b = n % 100; return n === 1 ? "one" : a >= 2 && a <= 4 && !(b >= 12 && b <= 14) ? "few" : "many"; }
    case "ar": { const b = n % 100; return n === 0 ? "zero" : n === 1 ? "one" : n === 2 ? "two" : b >= 3 && b <= 10 ? "few" : b >= 11 ? "many" : "other"; }
  }
}
export function pluralSummary(lang: Lang, n: number) {
  const cats = Array.from({ length: 101 }, (_, i) => pluralCategory(lang, i)), cat = cats[n] ?? pluralCategory(lang, n);
  const used = [...new Set(cats)];
  let next = -1;
  for (let i = n + 1; i <= 100; i++) if (cats[i] !== cat) { next = i; break; }
  return { cats, cat, used, inCat: cats.filter((c) => c === cat).length, next };
}
