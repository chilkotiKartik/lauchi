"use client";
/** Shared building blocks of the BCA labs: 7-segment digits made of glowing bars, travelling data packets, gliding nodes, bit rows and pointers. Plain geometry only. */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Tick } from "../Stage";
import { Bench, C, cyc, Glass, Led, Rail, Slab, Token, type V3 } from "./cstx-kit";

export { Bench, C, cyc, Glass, Led, Rail, Slab, Token };
export type { V3 };

const SEG: Record<string, string> = {
  "0": "abcdef", "1": "bc", "2": "abdeg", "3": "abcdg", "4": "bcfg", "5": "acdfg", "6": "acdefg", "7": "abc", "8": "abcdefg", "9": "abcdfg",
  A: "abcefg", b: "cdefg", C: "adef", d: "bcdeg", E: "adefg", F: "aefg", "-": "g", H: "bcefg", L: "def", P: "abefg", S: "acdfg", U: "bcdef",
  n: "ceg", o: "cdeg", r: "eg", t: "defg", u: "cde", I: "ef", Y: "bcdfg", _: "d", X: "bcefg", G: "acdef", J: "bcde", O: "abcdef", T: "defg", N: "ceg", R: "eg", D: "bcdeg", B: "cdefg", M: "ceg", W: "cde", K: "bcefg", Q: "abcfg", V: "cde", Z: "abdeg", "?": "abeg", "+": "bcg", "=": "dg", "/": "bg", "*": "abfg", "'": "f",
};

/** Boxes (as [x, y, w, h]) for one seven-segment character `ch`, h tall, centred at x0. */
function segBoxes(ch: string, x0: number, h: number): [number, number, number, number][] {
  const on = SEG[ch] ?? "", w = h * 0.55, t = h * 0.13, hl = w * 0.92, vl = h * 0.46;
  return on.split("").map((s) => {
    const horiz = s === "a" || s === "d" || s === "g";
    const x = s === "b" || s === "c" ? w / 2 : s === "e" || s === "f" ? -w / 2 : 0;
    const y = s === "a" ? h / 2 : s === "d" ? -h / 2 : s === "g" ? 0 : s === "b" || s === "f" ? h / 4 : -h / 4;
    return horiz ? [x0 + x, y, hl, t] : [x0 + x, y, t, vl];
  });
}

/** All segments of a string merged into ONE geometry, so a number costs one draw call instead of one per segment. */
function useSegGeometry(str: string, h: number) {
  const geo = useMemo(() => {
    const t = h * 0.13, sp = h * 0.8, parts: THREE.BufferGeometry[] = [];
    str.split("").forEach((ch, i) => segBoxes(ch, (i - (str.length - 1) / 2) * sp, h).forEach(([x, y, w, hh]) => parts.push(new THREE.BoxGeometry(w, hh, t).translate(x, y, 0))));
    const g = parts.length ? mergeGeometries(parts) : null;
    parts.forEach((q) => q.dispose());
    return g;
  }, [str, h]);
  useEffect(() => () => geo?.dispose(), [geo]);
  return geo;
}

/** One glowing seven-segment character, h tall, facing +z. Unknown characters are blank. */
export function Digit({ p, ch, h = 0.4, c = C.gold, glow = 1 }: { p: V3; ch: string; h?: number; c?: string; glow?: number }) {
  return <Txt p={p} s={ch.slice(0, 1)} h={h} c={c} glow={glow} />;
}

/** A short text or number written with seven-segment digits, centred on p (a single mesh). */
export function Txt({ p, s, h = 0.4, c = C.gold, glow = 1 }: { p: V3; s: string | number; h?: number; c?: string; glow?: number }) {
  const geo = useSegGeometry(String(s), h);
  if (!geo) return null;
  return (
    <mesh position={p} geometry={geo}>
      <meshStandardMaterial color={c} emissive={c} emissiveIntensity={glow} roughness={0.4} />
    </mesh>
  );
}

/** A slab with a number or word written on its front face. */
export function Cell({ p, s = [0.9, 0.7, 0.4], c = C.blue, glow = 0.15, v, tc = "#ffffff", th, o = 1 }: { p: V3; s?: V3; c?: string; glow?: number; v?: string | number; tc?: string; th?: number; o?: number }) {
  return (
    <group position={p}>
      <Slab p={[0, 0, 0]} s={s} c={c} glow={glow} o={o} />
      {v !== undefined && v !== "" && <Txt p={[0, 0, s[2] / 2 + 0.02]} s={v} h={th ?? Math.min(s[1] * 0.62, s[0] / (String(v).length * 0.8 + 0.3))} c={tc} glow={0.9} />}
    </group>
  );
}

/** A sphere node with a number on its front. */
export function Node3({ p, r = 0.38, c = C.blue, glow = 0.3, v, tc = "#ffffff" }: { p: V3; r?: number; c?: string; glow?: number; v?: string | number; tc?: string }) {
  return (
    <group position={p}>
      <mesh><sphereGeometry args={[r, 18, 18]} /><meshStandardMaterial color={c} emissive={c} emissiveIntensity={glow} roughness={0.35} metalness={0.2} /></mesh>
      {v !== undefined && <Txt p={[0, 0, r + 0.02]} s={v} h={r * (String(v).length > 2 ? 0.7 : 0.95)} c={tc} glow={1} />}
    </group>
  );
}

/** A row of bit cubes, most significant first. A 1 glows in colour c, a 0 is dark. */
export function Bits({ p, bits, s = 0.34, gap = 0.08, c = C.green, cols, hl = -1 }: { p: V3; bits: readonly number[]; s?: number; gap?: number; c?: string; cols?: readonly string[]; hl?: number }) {
  const n = bits.length, step = s + gap;
  return (
    <group position={p}>
      {bits.map((b, i) => {
        const col = cols ? cols[i] : c;
        return (
          <group key={i} position={[(i - (n - 1) / 2) * step, 0, 0]}>
            <Slab p={[0, 0, 0]} s={[s, s, s]} c={b ? col : "#43555f"} glow={b ? 0.85 : 0.02} metal={0.2} />
            {i === hl && <mesh position={[0, s * 0.7, 0]}><coneGeometry args={[s * 0.3, s * 0.5, 8]} /><meshStandardMaterial color={C.gold} emissive={C.gold} emissiveIntensity={1} /></mesh>}
            <Txt p={[0, 0, s / 2 + 0.01]} s={b ? "1" : "0"} h={s * 0.62} c={b ? "#06260f" : "#7f929c"} glow={b ? 0.2 : 0.3} />
          </group>
        );
      })}
    </group>
  );
}

/** A downward pointing marker (cone) above a cell. */
export function Pointer({ p, c = C.gold, s = 0.22 }: { p: V3; c?: string; s?: number }) {
  return (
    <mesh position={p} rotation={[Math.PI, 0, 0]}>
      <coneGeometry args={[s, s * 2, 12]} />
      <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.9} />
    </mesh>
  );
}

/** A glowing wire with an arrow head from a to b. */
export function Arrow({ a, b, c = C.blue, on = true, r = 0.04 }: { a: V3; b: V3; c?: string; on?: boolean; r?: number }) {
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), len = d.length() || 1e-3;
  const tip = new THREE.Vector3(...b), dir = d.clone().normalize();
  const head = tip.clone().addScaledVector(dir, -0.14);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  const mid: V3 = [(a[0] + head.x) / 2, (a[1] + head.y) / 2, (a[2] + head.z) / 2];
  const shaft = Math.max(1e-3, len - 0.28);
  const col = on ? c : "#566a75";
  return (
    <group>
      <mesh position={mid} quaternion={q}><cylinderGeometry args={[r, r, shaft, 8]} /><meshStandardMaterial color={col} emissive={c} emissiveIntensity={on ? 0.9 : 0.03} /></mesh>
      <mesh position={head.toArray() as V3} quaternion={q}><coneGeometry args={[r * 3, 0.28, 10]} /><meshStandardMaterial color={col} emissive={c} emissiveIntensity={on ? 1 : 0.03} /></mesh>
    </group>
  );
}

function place(m: THREE.Object3D, path: readonly V3[], u: number) {
  const n = path.length - 1;
  if (n < 1) { if (path[0]) m.position.set(path[0][0], path[0][1], path[0][2]); return; }
  const f = Math.min(Math.max(u, 0), 0.9999) * n, i = Math.floor(f), k = f - i, a = path[i], b = path[i + 1];
  m.position.set(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k);
}

/** A glowing data packet that runs along a polyline again and again while the scene plays. */
export function Packet({ path, c = C.gold, r = 0.13, speed = 0.3, phase = 0, on = true }: { path: readonly V3[]; c?: string; r?: number; speed?: number; phase?: number; on?: boolean }) {
  const m = useRef<THREE.Group>(null), t = useRef(phase);
  const [start] = useState<V3>(path[0] ?? [0, 0, 0]);
  return (
    <group ref={m} position={start} visible={on}>
      <Tick fn={(dt) => { t.current = (t.current + Math.min(dt, 0.05) * speed) % 1; if (m.current) place(m.current, path, t.current); }} />
      <mesh><sphereGeometry args={[r, 14, 14]} /><meshStandardMaterial color={c} emissive={c} emissiveIntensity={1.6} /></mesh>
      <mesh><sphereGeometry args={[r * 1.9, 12, 12]} /><meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.5} transparent opacity={0.18} depthWrite={false} /></mesh>
    </group>
  );
}

/** A group that glides to `to` while the scene plays, and jumps there when paused. */
export function Glide({ to, from, playing, rate = 7, children }: { to: V3; from?: V3; playing: boolean; rate?: number; children: ReactNode }) {
  const g = useRef<THREE.Group>(null);
  const [start] = useState<V3>(from ?? to);
  useLayoutEffect(() => { if (!playing) g.current?.position.set(to[0], to[1], to[2]); }, [to, playing]);
  return (
    <group ref={g} position={start}>
      <Tick fn={(dt) => {
        const o = g.current; if (!o) return;
        const k = 1 - Math.exp(-Math.min(dt, 0.05) * rate);
        o.position.set(o.position.x + (to[0] - o.position.x) * k, o.position.y + (to[1] - o.position.y) * k, o.position.z + (to[2] - o.position.z) * k);
      }} />
      {children}
    </group>
  );
}

/** A flat pulsing ring around a point, to say "look here". */
export function Halo({ p, r = 0.5, c = C.gold }: { p: V3; r?: number; c?: string }) {
  const m = useRef<THREE.Mesh>(null), t = useRef(0);
  return (
    <mesh ref={m} position={p}>
      <Tick fn={(dt) => { t.current += Math.min(dt, 0.05) * 3; m.current?.scale.setScalar(1 + 0.12 * Math.sin(t.current)); }} />
      <torusGeometry args={[r, r * 0.07, 8, 28]} />
      <meshStandardMaterial color={c} emissive={c} emissiveIntensity={1.1} />
    </mesh>
  );
}

/** Sequence of alternating colours for a stage / group index. */
export const stageColour = (i: number) => cyc(i);

/** Bits of v, most significant first, n of them. */
export const bitsOfN = (v: number, n: number): number[] => Array.from({ length: n }, (_, i) => (v >> (n - 1 - i)) & 1);
