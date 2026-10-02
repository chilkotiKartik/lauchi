/** Maths for the Web Development 101 and 201 labs. Pure functions, no React. Assumptions are named in the lab notes. */

// ---------- WD-101 u1: one page load over the network ----------
export function httpJourney(rttMs: number, dnsMs: number, https: boolean, serverMs: number, sizeKB: number, mbps: number) {
  const tcp = rttMs, tls = https ? rttMs : 0, request = rttMs + serverMs;
  const download = (sizeKB * 8) / mbps; // kilobits / (megabits per second) = milliseconds
  const parts = [dnsMs, tcp, tls, request, download];
  return { dns: dnsMs, tcp, tls, request, download, ttfb: dnsMs + tcp + tls + request, total: parts.reduce((s, x) => s + x, 0), parts };
}

// ---------- WD-101 u2: the DOM tree ----------
export function domTree(depth: number, branch: number) {
  let nodes = 0, level = 1;
  const perLevel: number[] = [];
  for (let d = 0; d <= depth; d++) { perLevel.push(level); nodes += level; level *= branch; }
  return { nodes, leaves: perLevel[depth], perLevel, height: depth + 1 };
}

// ---------- WD-101 u3: CSS specificity ----------
export type Spec = [number, number, number];
export function cascade(a: Spec, b: Spec, importantA: boolean) {
  if (importantA) return { winner: "A" as const, why: "A has !important" };
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return { winner: (a[i] > b[i] ? "A" : "B") as "A" | "B", why: `${["ids", "classes", "tags"][i]} decide: ${a[i]} against ${b[i]}` };
  return { winner: "B" as const, why: "same specificity, so the later rule B wins" };
}

// ---------- WD-101 u5: numbers are 64-bit doubles ----------
export function doubleBits(x: number): number[] {
  const dv = new DataView(new ArrayBuffer(8));
  dv.setFloat64(0, x);
  const bits: number[] = [];
  for (let i = 0; i < 8; i++) { const byte = dv.getUint8(i); for (let b = 7; b >= 0; b--) bits.push((byte >> b) & 1); }
  return bits;
}
export function doubleOp(a: number, b: number, op: "add" | "sub" | "mul") {
  const r = op === "add" ? a + b : op === "sub" ? a - b : a * b;
  const clean = Number(r.toPrecision(15));
  return { r, clean, exactDecimal: r === clean, digits: r.toPrecision(21), bits: doubleBits(r), shortest: String(r) };
}
/** Does 2^n + 1 collapse back to 2^n? True from n = 53. */
export const powerCollapses = (n: number) => 2 ** n + 1 === 2 ** n;

// ---------- WD-101 u6: array pipeline ----------
export const pipelineData = (n: number): number[] => Array.from({ length: n }, (_, i) => ((i * 37 + 11) % 100) + 1);
export function pipeline(n: number, threshold: number, mult: number) {
  const data = pipelineData(n), kept = data.filter((x) => x > threshold), mapped = kept.map((x) => x * mult);
  return { data, kept, mapped, sum: mapped.reduce((s, x) => s + x, 0), keepMask: data.map((x) => x > threshold) };
}

// ---------- WD-101 u7: the call stack ----------
export type StackKind = "fact" | "fib" | "sum";
export type StackEvent = { op: "call" | "ret"; arg: number; val: number };
export function stackTrace(kind: StackKind, n: number) {
  const events: StackEvent[] = [];
  let maxDepth = 0, depth = 0, calls = 0;
  const go = (k: number): number => {
    calls++; depth++; maxDepth = Math.max(maxDepth, depth);
    events.push({ op: "call", arg: k, val: 0 });
    let v: number;
    if (kind === "fact") v = k <= 0 ? 1 : k * go(k - 1);
    else if (kind === "sum") v = k <= 0 ? 0 : k + go(k - 1);
    else v = k < 2 ? k : go(k - 1) + go(k - 2);
    events.push({ op: "ret", arg: k, val: v });
    depth--;
    return v;
  };
  const result = go(n);
  return { events, calls, maxDepth, result };
}
/** Arguments of the frames on the stack after the first `step` events. */
export function stackAt(events: StackEvent[], step: number): number[] {
  const st: number[] = [];
  for (let i = 0; i < Math.min(step, events.length); i++) { if (events[i].op === "call") st.push(events[i].arg); else st.pop(); }
  return st;
}

// ---------- WD-101 u8: how big is the request body? ----------
export function formSize(fields: number, keyLen: number, valLen: number, specialPct: number, fileKB: number) {
  const sp = Math.round((valLen * specialPct) / 100); // characters per value that need escaping
  const fileB = fileKB * 1024;
  const urlencoded = fields === 0 ? 0 : fields * (keyLen + 1 + valLen + 2 * sp) + (fields - 1) + (fileB > 0 ? 4 + Math.ceil(fileB) * 3 : 0);
  const b64 = Math.ceil(fileB / 3) * 4;
  const json = 2 + fields * (keyLen + valLen + sp + 6) + Math.max(0, fields - 1) + (fileB > 0 ? 9 + b64 : 0);
  const B = 40;
  const multipart = fields * (B + 49 + keyLen + valLen + sp) + (fileB > 0 ? B + 100 + fileB : 0) + B + 6;
  return { urlencoded, json, multipart };
}

// ---------- WD-201 u1: the Node.js event loop ----------
export type LoopItem = { label: string; kind: "sync" | "tick" | "promise" | "timer" };
export function eventLoop(ticks: number, promises: number, delays: number[]): LoopItem[] {
  const out: LoopItem[] = [{ label: "start", kind: "sync" }, { label: "end", kind: "sync" }];
  for (let i = 1; i <= ticks; i++) out.push({ label: `nextTick ${i}`, kind: "tick" });
  for (let i = 1; i <= promises; i++) out.push({ label: `promise ${i}`, kind: "promise" });
  const t = delays.map((d, i) => ({ i: i + 1, d: Math.max(1, Math.round(d)) })).sort((x, y) => x.d - y.d || x.i - y.i);
  for (const x of t) out.push({ label: `timer ${x.i} (${x.d} ms)`, kind: "timer" });
  return out;
}

// ---------- WD-201 u2: semantic version ranges ----------
export type RangeKind = "caret" | "tilde" | "exact" | "gte";
export type Ver = [number, number, number];
const cmp = (a: Ver, b: Ver) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
export function satisfies(v: Ver, kind: RangeKind, base: Ver): boolean {
  if (kind === "exact") return cmp(v, base) === 0;
  if (kind === "gte") return cmp(v, base) >= 0;
  if (cmp(v, base) < 0) return false;
  if (kind === "tilde") return v[0] === base[0] && v[1] === base[1];
  if (base[0] > 0) return v[0] === base[0];
  if (base[1] > 0) return v[0] === 0 && v[1] === base[1];
  return v[0] === 0 && v[1] === 0 && v[2] === base[2];
}
/** All published versions in the model: majors 0–3, minors 0–4, patches 0–4. */
export const VERSIONS: Ver[] = (() => { const o: Ver[] = []; for (let a = 0; a < 4; a++) for (let b = 0; b < 5; b++) for (let c = 0; c < 5; c++) o.push([a, b, c]); return o; })();
export function semver(kind: RangeKind, base: Ver) {
  const match = VERSIONS.map((v) => satisfies(v, kind, base));
  const list = VERSIONS.filter((_, i) => match[i]);
  return { match, count: list.length, highest: list.length ? list[list.length - 1] : null, lowest: list.length ? list[0] : null };
}

// ---------- WD-201 u3: closures keep private state ----------
export function counters(n: number, calls: number, mode: "closure" | "global") {
  const values = Array.from({ length: n }, (_, i) => (mode === "global" ? calls : Math.floor((calls + n - 1 - i) / n)));
  return { values, total: mode === "global" ? calls : values.reduce((s, x) => s + x, 0) };
}

// ---------- WD-201 u4: test coverage and bugs ----------
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function coverage(branches: number, tests: number, per: number, bugs: number) {
  const rng = mulberry32(branches * 977 + per * 31), covered = new Array<boolean>(branches).fill(false);
  let wasted = 0;
  for (let t = 0; t < tests; t++) {
    let fresh = false;
    for (let k = 0; k < per; k++) { const b = Math.floor(rng() * branches); if (!covered[b]) { covered[b] = true; fresh = true; } }
    if (!fresh) wasted++;
  }
  const rb = mulberry32(branches * 131 + 7), pool = Array.from({ length: branches }, (_, i) => i), bug = new Array<boolean>(branches).fill(false);
  for (let k = 0; k < Math.min(bugs, branches); k++) { const j = k + Math.floor(rb() * (pool.length - k)); [pool[k], pool[j]] = [pool[j], pool[k]]; bug[pool[k]] = true; }
  const n = covered.filter(Boolean).length, found = bug.filter((b, i) => b && covered[i]).length;
  return { covered, bug, count: n, pct: (n / branches) * 100, found, bugs: Math.min(bugs, branches), wasted };
}

// ---------- WD-201 u5: index against a full scan ----------
export function dbIndex(exp: number, fanout: number) {
  const rows = Math.round(10 ** exp), levels = Math.max(1, Math.ceil(Math.log(rows) / Math.log(fanout) - 1e-9));
  const indexReads = levels + 1; // tree levels plus one read of the row itself
  return { rows, levels, scanAvg: rows / 2, scanWorst: rows, indexReads, speedup: rows / 2 / indexReads };
}

// ---------- WD-201 u6: a server with c workers (M/M/c queue) ----------
export function queue(lambda: number, mu: number, c: number) {
  const a = lambda / mu, rho = a / c;
  if (rho >= 1) return { stable: false as const, rho, a };
  let sum = 0, term = 1;
  for (let k = 0; k < c; k++) { if (k > 0) term *= a / k; sum += term; }
  const last = (term * a) / c / (1 - rho); // a^c / c! / (1 − ρ), with `term` = a^(c−1)/(c−1)!
  const pWait = last / (sum + last), lq = (pWait * rho) / (1 - rho), wq = lq / lambda;
  return { stable: true as const, rho, a, pWait, lq, wq, w: wq + 1 / mu };
}

// ---------- WD-201 u7: flexbox on one axis ----------
export function flexLayout(W: number, n: number, basis: number, grow: number, shrink: number, gap: number, wrap: boolean) {
  const lines: number[][] = [];
  if (wrap) {
    const per = Math.max(1, Math.floor((W + gap) / (basis + gap)));
    for (let i = 0; i < n; i += per) {
      const k = Math.min(per, n - i), free = W - k * basis - (k - 1) * gap;
      const w = grow > 0 ? basis + Math.max(0, free) / k : basis;
      lines.push(Array.from({ length: k }, () => w));
    }
  } else {
    const free = W - n * basis - (n - 1) * gap;
    const w = free >= 0 ? (grow > 0 ? basis + free / n : basis) : shrink > 0 ? Math.max(0, basis + free / n) : basis;
    lines.push(Array.from({ length: n }, () => w));
  }
  const used = lines.map((l) => l.reduce((s, x) => s + x, 0) + (l.length - 1) * gap);
  return { lines, overflow: Math.max(0, ...used.map((u) => u - W)), free: W - n * basis - (n - 1) * gap };
}

// ---------- WD-201 u8: server rendering against client rendering ----------
export function renderTimes(rtt: number, mbps: number, htmlKB: number, jsKB: number, serverMs: number, apiMs: number, cpu: number) {
  const dl = (kb: number) => (kb * 8) / mbps, connect = 2 * rtt; // TCP + TLS 1.3
  const exec = jsKB * cpu; // assumed 1 ms of parse + run per KB on a 1× CPU
  const ssrContent = connect + rtt + serverMs + dl(htmlKB);
  const ssrReady = ssrContent + dl(jsKB) + exec;
  const csrContent = connect + rtt + dl(2) + dl(jsKB) + exec + rtt + apiMs;
  return { ssrContent, ssrReady, csrContent, csrReady: csrContent };
}

// ---------- WD-201 u9: guessing a CSRF token ----------
export function csrfGuess(bytes: number, perSec: number, lifeMin: number) {
  const bits = bytes * 8, space = 2 ** bits, attempts = perSec * lifeMin * 60;
  return { bits, space, attempts, p: Math.min(1, attempts / space), halfSeconds: space / 2 / perSec, log2Attempts: Math.log2(Math.max(1, attempts)) };
}

// ---------- WD-201 u10: how long a password hash holds out ----------
export const CHARSETS = { digits: 10, lower: 26, alnum: 62, full: 95 } as const;
export type Charset = keyof typeof CHARSETS;
export type Scheme = "md5" | "sha256" | "bcrypt";
/** Rough guesses per second for one high-end GPU: MD5 1.6×10¹¹, SHA-256 2.2×10¹⁰, bcrypt 1.84×10⁵ at cost 5 and half as fast for each cost step. */
export const guessRate = (scheme: Scheme, cost: number) => (scheme === "md5" ? 1.6e11 : scheme === "sha256" ? 2.2e10 : 184000 * 2 ** (5 - cost));
export function passwordCrack(length: number, cs: Charset, scheme: Scheme, cost: number, salted: boolean) {
  const space = CHARSETS[cs] ** length, rate = guessRate(scheme, cost);
  return { space, rate, avgSeconds: space / 2 / rate, worstSeconds: space / rate, sameHash: !(salted || scheme === "bcrypt") };
}
