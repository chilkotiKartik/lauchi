/** Pure maths for the extra MET-001 labs. */

/* ───────────── Plane truss by the method of joints (Gaussian elimination) ───────────── */
export type TrussType = "pratt" | "howe" | "warren";
export type Truss = { nodes: [number, number][]; members: [number, number][]; pin: number; roller: number; loads: { node: number; fx: number; fy: number }[] };

/** Builds a simply supported truss with `bays` panels (span × height), loads P (kN, downward) on interior bottom joints and an extra W at mid-span. */
export function buildTruss(type: TrussType, bays: number, span: number, height: number, P: number, W: number): Truss {
  const nodes: [number, number][] = [], members: [number, number][] = [];
  const dx = span / bays;
  if (type === "warren") {
    for (let i = 0; i <= bays; i++) nodes.push([i * dx, 0]);                       // bottom 0..bays
    for (let i = 0; i < bays; i++) nodes.push([(i + 0.5) * dx, height]);           // top bays+1 ..
    for (let i = 0; i < bays; i++) members.push([i, i + 1]);
    for (let i = 0; i < bays - 1; i++) members.push([bays + 1 + i, bays + 2 + i]);
    for (let i = 0; i < bays; i++) { members.push([i, bays + 1 + i]); members.push([bays + 1 + i, i + 1]); }
  } else {
    for (let i = 0; i <= bays; i++) nodes.push([i * dx, 0]);                       // bottom 0..bays
    for (let i = 1; i < bays; i++) nodes.push([i * dx, height]);                   // top over interior joints: bays+1 .. 2bays-1
    const top = (i: number) => bays + i;                                            // i = 1..bays-1
    for (let i = 0; i < bays; i++) members.push([i, i + 1]);                        // bottom chord
    for (let i = 1; i < bays - 1; i++) members.push([top(i), top(i + 1)]);          // top chord
    members.push([0, top(1)]); members.push([bays, top(bays - 1)]);                 // end rafters
    for (let i = 1; i < bays; i++) members.push([i, top(i)]);                       // verticals
    const half = bays / 2;
    for (let i = 1; i < bays - 1; i++) {                                            // diagonals in each inner panel
      const towardsCentre = i + 0.5 < half;
      const pratt = type === "pratt";
      // Pratt diagonals slope down towards the centre (tension under gravity load); Howe the other way.
      if (towardsCentre === pratt) members.push([top(i), i + 1]); else members.push([i, top(i + 1)]);
    }
  }
  const loads: Truss["loads"] = [];
  for (let i = 1; i < bays; i++) loads.push({ node: i, fx: 0, fy: -P });
  const mid = Math.round(bays / 2);
  if (W) loads.push({ node: mid, fx: 0, fy: -W });
  return { nodes, members, pin: 0, roller: bays, loads };
}

function solve(A: number[][], b: number[]): number[] | null {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    if (Math.abs(M[piv][c]) < 1e-10) return null;
    [M[c], M[piv]] = [M[piv], M[c]];
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map((r, i) => r[n] / r[i]);
}

/** Member forces (kN, + tension, − compression) and reactions. Returns null for an unstable/indeterminate layout. */
export function solveTruss(t: Truss) {
  const J = t.nodes.length, Mm = t.members.length, unknowns = Mm + 3; // pin (Rx, Ry) + roller (Ry)
  if (unknowns !== 2 * J) return null;
  const A = Array.from({ length: 2 * J }, () => new Array(unknowns).fill(0)), b = new Array(2 * J).fill(0);
  t.members.forEach(([i, j], m) => {
    const [xi, yi] = t.nodes[i], [xj, yj] = t.nodes[j], L = Math.hypot(xj - xi, yj - yi), cx = (xj - xi) / L, cy = (yj - yi) / L;
    A[2 * i][m] += cx; A[2 * i + 1][m] += cy; A[2 * j][m] -= cx; A[2 * j + 1][m] -= cy;
  });
  A[2 * t.pin][Mm] = 1; A[2 * t.pin + 1][Mm + 1] = 1; A[2 * t.roller + 1][Mm + 2] = 1;
  for (const l of t.loads) { b[2 * l.node] -= l.fx; b[2 * l.node + 1] -= l.fy; }
  const x = solve(A, b);
  if (!x) return null;
  const forces = x.slice(0, Mm).map((f) => (Math.abs(f) < 1e-9 ? 0 : f));
  return { forces, Rax: x[Mm], Ray: x[Mm + 1], Rby: x[Mm + 2] };
}

/* ───────────── Ladder friction ───────────── */
export function ladder(thetaDeg: number, L: number, W: number, Wm: number, k: number, muf: number, muw: number) {
  const th = (thetaDeg * Math.PI) / 180, c = Math.cos(th), s = Math.sin(th);
  // wall friction at its limit (helps), solve for what the floor must supply
  const Nw = ((W / 2 + Wm * k) * c) / (s + muw * c);
  const Fw = muw * Nw, Ff = Nw, Nf = W + Wm - Fw;
  const avail = muf * Nf;
  const safety = Ff > 0 ? avail / Ff : Infinity;
  const NfMin = (W + Wm) / (1 + muw * muf);
  const thMin = (Math.atan((W / 2 + Wm * k - muw * muf * NfMin) / (muf * NfMin)) * 180) / Math.PI;
  return { Nw, Fw, Ff, Nf, avail, safety, slips: safety < 1, thMin, L };
}

/* ───────────── Simply supported beam: SFD, BMD, deflection ───────────── */
export function beam(L: number, W: number, a: number, w: number, u1: number, u2: number) {
  const lo = Math.min(u1, u2), hi = Math.max(u1, u2), len = Math.max(0, Math.min(hi, L) - Math.max(lo, 0));
  const Wu = w * len, xu = Math.max(lo, 0) + len / 2;
  const RB = (W * a + Wu * xu) / L, RA = W + Wu - RB;
  const V = (x: number) => RA - (x > a ? W : 0) - w * Math.max(0, Math.min(x, hi) - Math.max(lo, 0)) * (x > lo ? 1 : 0);
  const M = (x: number) => {
    const covered = Math.max(0, Math.min(x, hi) - Math.max(lo, 0));
    const arm = x - (Math.max(lo, 0) + covered / 2);
    return RA * x - (x > a ? W * (x - a) : 0) - (x > lo ? w * covered * arm : 0);
  };
  let Mmax = 0, xM = 0, Vmax = 0;
  const n = 400;
  for (let i = 0; i <= n; i++) { const x = (L * i) / n, m = M(x), v = Math.abs(V(x)); if (Math.abs(m) > Math.abs(Mmax)) { Mmax = m; xM = x; } if (v > Vmax) Vmax = v; }
  // deflection shape (EI = 1): integrate M twice, then remove the straight line so y(0) = y(L) = 0
  const ys: number[] = new Array(n + 1).fill(0), slope: number[] = new Array(n + 1).fill(0), h = L / n;
  for (let i = 1; i <= n; i++) { slope[i] = slope[i - 1] + 0.5 * (M((i - 1) * h) + M(i * h)) * h; ys[i] = ys[i - 1] + 0.5 * (slope[i - 1] + slope[i]) * h; }
  const yL = ys[n];
  const defl = ys.map((y, i) => y - (yL * i) / n);
  const maxDefl = Math.max(...defl.map(Math.abs)) || 1;
  return { RA, RB, V, M, Mmax, xM, Vmax, defl: defl.map((y) => y / maxDefl), n };
}
export const bendStress = (MkNm: number, bMm: number, dMm: number) => (Math.abs(MkNm) * 1e6 * (dMm / 2)) / ((bMm * dMm ** 3) / 12);

/* ───────────── Pelton wheel ───────────── */
export function pelton(H: number, dMm: number, Dm: number, rpm: number, deflDeg = 165, k = 0.95, Cv = 0.98) {
  const g = 9.81, V = Cv * Math.sqrt(2 * g * H), A = (Math.PI / 4) * (dMm / 1000) ** 2, Q = A * V;
  const u = (Math.PI * Dm * rpm) / 60, beta = ((180 - deflDeg) * Math.PI) / 180;
  const P = 1000 * Q * (V - u) * (1 + k * Math.cos(beta)) * u;        // W
  const etaH = (2 * (V - u) * (1 + k * Math.cos(beta)) * u) / (V * V);
  const rpmBest = (V / 2) * 60 / (Math.PI * Dm);
  return { V, Q, u, ratio: u / V, P: Math.max(0, P), etaH: Math.max(0, etaH), rpmBest, Pin: 1000 * g * Q * H, jetRatio: (Dm * 1000) / dMm };
}
export const peltonEta = (ratio: number, deflDeg = 165, k = 0.95) => Math.max(0, 2 * (1 - ratio) * ratio * (1 + k * Math.cos(((180 - deflDeg) * Math.PI) / 180)));

/* ───────────── Boundary work in a piston–cylinder ───────────── */
export type Proc = "isobaric" | "isochoric" | "isothermal" | "adiabatic" | "polytropic";
/** Ideal-gas (air) closed-system process. p in kPa, V in m³, T in K, energies in kJ. For isochoric heating `qin` (kJ) is added. */
export function pv(proc: Proc, p1: number, V1: number, V2: number, n: number, T1: number, qin = 50, gamma = 1.4, R = 0.287) {
  const m = (p1 * V1) / (R * T1), cv = R / (gamma - 1);
  if (proc === "isochoric") {
    const T2 = T1 + qin / (m * cv), p2 = p1 * (T2 / T1);
    return { m, p2, V2: V1, T2, W: 0, dU: qin, Q: qin, idx: Infinity, p: () => p1 };
  }
  const idx = proc === "isobaric" ? 0 : proc === "isothermal" ? 1 : proc === "adiabatic" ? gamma : n;
  const p = (V: number) => p1 * Math.pow(V1 / V, idx);
  const p2 = p(V2);
  const W = Math.abs(idx - 1) < 1e-9 ? p1 * V1 * Math.log(V2 / V1) : idx === 0 ? p1 * (V2 - V1) : (p1 * V1 - p2 * V2) / (idx - 1);
  const T2 = (p2 * V2) / (m * R), dU = m * cv * (T2 - T1);
  return { m, p2, V2, T2, W, dU, Q: dU + W, idx, p };
}

/* ───────────── Four-stroke engine kinematics ───────────── */
export function slider(crankDeg: number, r: number, l: number) {
  const th = (crankDeg * Math.PI) / 180;
  return r * Math.cos(th) + Math.sqrt(l * l - (r * Math.sin(th)) ** 2); // distance from crank centre to piston pin
}
export function strokeOf(crankDeg: number): "suction" | "compression" | "power" | "exhaust" {
  const a = ((crankDeg % 720) + 720) % 720;
  return a < 180 ? "suction" : a < 360 ? "compression" : a < 540 ? "power" : "exhaust";
}
export function engine(boreMm: number, strokeMm: number, r: number, rpm: number, ci: boolean) {
  const Vs = (Math.PI / 4) * (boreMm / 10) ** 2 * (strokeMm / 10);   // cm³
  const Vc = Vs / (r - 1);
  const g = 1.4;
  const eta = ci ? (1 - (1 / (g * r ** (g - 1))) * ((2 ** g - 1) / (2 - 1))) * 100 : (1 - 1 / r ** (g - 1)) * 100; // CI: Diesel with ρ = 2
  const pistonSpeed = (2 * (strokeMm / 1000) * rpm) / 60;
  return { Vs, Vc, eta, pistonSpeed, powerStrokesPerS: rpm / 120 };
}
/** Cylinder volume (fraction of Vs + Vc) at a crank angle. */
export function cylVolume(crankDeg: number, r: number, rodRatio = 3.5) {
  const rr = 0.5, l = rodRatio * rr * 2 / 2;
  const top = rr + l, x = slider(crankDeg, rr, l);
  const sweptFrac = (top - x) / (2 * rr);                           // 0 at TDC … 1 at BDC
  return 1 / (r - 1) + sweptFrac;                                  // in units of Vs
}

/* ───────────── Otto vs Diesel vs Dual at the same r and heat input ───────────── */
export function cycles(r: number, q: number, rp: number, T1 = 300, p1 = 100, g = 1.4, cv = 0.718) {
  const cp = cv * g, R = cp - cv, v1 = (R * T1) / p1;
  const T2 = T1 * r ** (g - 1), p2 = p1 * r ** g, v2 = v1 / r;
  const out = (name: "Otto" | "Diesel" | "Dual", T3: number, p3: number, T4: number, v4: number) => {
    const T5 = T4 * (v4 / v1) ** (g - 1), qout = cv * (T5 - T1);
    const eta = 1 - qout / q, W = q - qout, mep = W / (v1 - v2);
    const p5 = p1 * (T5 / T1);
    return { name, eta: eta * 100, mep, pmax: Math.max(p3, p2), Tmax: T4, pts: { p2, p3, v4, p5, T3, T4 } };
  };
  // Otto: all heat at constant volume
  const To = T2 + q / cv;
  const otto = out("Otto", To, p2 * (To / T2), To, v2);
  // Diesel: all heat at constant pressure
  const Td = T2 + q / cp;
  const diesel = out("Diesel", T2, p2, Td, v2 * (Td / T2));
  // Dual: pressure ratio rp at constant volume, the rest at constant pressure
  const q1 = Math.min(q, cv * T2 * (rp - 1)), T3 = T2 + q1 / cv, p3 = p2 * (T3 / T2), T4 = T3 + (q - q1) / cp;
  const dual = out("Dual", T3, p3, T4, v2 * (T4 / T3));
  return { otto, diesel, dual, T2, p2, v1, v2 };
}
/** P–V polyline of a cycle for plotting (v as fraction of v1, p in kPa). */
export function cyclePath(kind: "Otto" | "Diesel" | "Dual", r: number, q: number, rp: number, T1 = 300, p1 = 100, g = 1.4, cv = 0.718) {
  const c = cycles(r, q, rp, T1, p1, g, cv), v1 = c.v1, v2 = c.v2;
  const cyc = kind === "Otto" ? c.otto : kind === "Diesel" ? c.diesel : c.dual;
  const pts: [number, number][] = [];
  const N = 40;
  for (let i = 0; i <= N; i++) { const v = v1 + ((v2 - v1) * i) / N; pts.push([v / v1, p1 * (v1 / v) ** g]); }       // compression
  const p3 = kind === "Diesel" ? c.p2 : cyc.pts.p3;
  pts.push([v2 / v1, p3]);                                                                                            // constant-volume heat
  const v4 = cyc.pts.v4;
  pts.push([v4 / v1, p3]);                                                                                            // constant-pressure heat
  for (let i = 1; i <= N; i++) { const v = v4 + ((v1 - v4) * i) / N; pts.push([v / v1, p3 * (v4 / v) ** g]); }        // expansion
  pts.push([1, p1]);
  return pts;
}
