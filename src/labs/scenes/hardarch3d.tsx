"use client";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useLabParams } from "../params";
import { BCAY_SPECS } from "../meta/bcay.specs";
import { LabFrame, Pick, Slider } from "../ui";
import { Flow } from "../kit2";
import type { V3 } from "../kit";
import { Tick } from "../Stage";
import { busMetrics, DDR, type DdrGen } from "../sim/bcay";

const BOARD_Y = -1.1, TOP = BOARD_Y + 0.06;
const CPU: V3 = [-1.0, TOP, -0.7];
const SLOT_X = [0.75, 1.05, 1.35, 1.65]; // A1, A2, B1, B2
/** Board vendors' fill order: A2, then B2, then A1, B1. */
const FILL = [1, 3, 0, 2];
/** Physical slot length (scene units) for each PCIe width. */
const SLOT_LEN: Record<number, number> = { 1: 0.55, 2: 0.8, 4: 1.1, 8: 1.8, 16: 3.0 };

function Part({ p, s, c, metal = 0.15, rough = 0.55, glow = 0 }: { p: V3; s: V3; c: string; metal?: number; rough?: number; glow?: number }) {
  return (
    <mesh position={p}>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} metalness={metal} roughness={rough} emissive={glow ? c : "#000000"} emissiveIntensity={glow} />
    </mesh>
  );
}

/** CPU: socket frame, gold-edged substrate and a nickel-plated heat spreader whose glow pulses with the clock (slowed 10⁹×). */
function Cpu({ ghz }: { ghz: number }) {
  const mat = useRef<THREE.MeshStandardMaterial>(null), t = useRef(0);
  return (
    <group position={CPU}>
      <Tick fn={(dt) => { t.current += Math.min(dt, 0.05) * ghz; if (mat.current) mat.current.emissiveIntensity = 0.15 + 0.35 * (0.5 + 0.5 * Math.sin(t.current * Math.PI * 2)); }} />
      <Part p={[0, 0.03, 0]} s={[1.25, 0.06, 1.25]} c="#2b2f33" />
      <Part p={[0, 0.08, 0]} s={[1.0, 0.04, 1.0]} c="#1f6b45" />
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.82, 0.1, 0.82]} />
        <meshStandardMaterial ref={mat} color="#c9ced3" metalness={0.95} roughness={0.22} emissive="#5fb8ff" emissiveIntensity={0.2} />
      </mesh>
      {/* retention lever */}
      <Part p={[0.68, 0.08, 0]} s={[0.04, 0.04, 1.1]} c="#9aa3ab" metal={0.8} rough={0.3} />
    </group>
  );
}

/** One DIMM slot with latches; a populated slot holds a module with eight DRAM chips per side. */
function Dimm({ x, filled, gen }: { x: number; filled: boolean; gen: DdrGen }) {
  return (
    <group position={[x, TOP, -0.55]}>
      <Part p={[0, 0.06, 0]} s={[0.12, 0.12, 2.5]} c="#16181b" />
      <Part p={[0, 0.1, 1.3]} s={[0.1, 0.14, 0.08]} c="#e7e9ec" />
      <Part p={[0, 0.1, -1.3]} s={[0.1, 0.14, 0.08]} c="#e7e9ec" />
      {filled && (
        <group position={[0, 0.5, 0]}>
          <Part p={[0, 0, 0]} s={[0.035, 0.7, 2.3]} c="#0f5132" />
          {Array.from({ length: 8 }, (_, i) => <Part key={i} p={[0.03, 0.05, -1.0 + i * 0.285]} s={[0.03, 0.32, 0.22]} c="#121417" rough={0.4} />)}
          {/* DDR5 modules carry their own power chip (PMIC) and usually a heat spreader */}
          {gen === "5" && <Part p={[-0.04, 0.02, 0]} s={[0.03, 0.62, 2.2]} c="#3a3f45" metal={0.8} rough={0.35} />}
          <Part p={[0, -0.36, 0]} s={[0.04, 0.04, 2.2]} c="#d9a441" metal={0.9} rough={0.25} />
        </group>
      )}
    </group>
  );
}

/** A PCIe slot cut to the trained width, with a card in it (x8/x16: a graphics card with a cooler shroud). */
function Pcie({ width }: { width: number }) {
  const len = SLOT_LEN[width] ?? 3, x = -2.3 + len / 2;
  const big = width >= 8;
  return (
    <group position={[x, TOP, 1.55]}>
      <Part p={[0, 0.06, 0]} s={[len, 0.12, 0.14]} c="#16181b" />
      <group position={[0, big ? 0.55 : 0.35, 0]}>
        <Part p={[0, 0, 0]} s={[Math.max(len, big ? 3.2 : 1.0), big ? 0.9 : 0.5, 0.04]} c="#174e36" />
        {big && <Part p={[0, 0.02, 0.17]} s={[3.2, 0.82, 0.3]} c="#2d3339" metal={0.6} rough={0.35} />}
        {big && [-0.8, 0.8].map((fx) => (
          <mesh key={fx} position={[fx, 0.02, 0.33]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.34, 0.34, 0.03, 28]} />
            <meshStandardMaterial color="#111417" metalness={0.3} roughness={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** A copper trace on the board between two points (laid out as two straight runs, like routed tracks). */
function trace(a: V3, b: V3): V3[] { const y = TOP + 0.005; return [[a[0], y, a[2]], [b[0], y, a[2]], [b[0], y, b[2]]]; }
function Trace({ path }: { path: V3[] }) {
  return (
    <>
      {path.slice(1).map((b, i) => {
        const a = path[i], len = Math.hypot(b[0] - a[0], b[2] - a[2]);
        if (len < 1e-3) return null;
        return (
          <mesh key={i} position={[(a[0] + b[0]) / 2, a[1], (a[2] + b[2]) / 2]} rotation={[0, -Math.atan2(b[2] - a[2], b[0] - a[0]), 0]}>
            <boxGeometry args={[len, 0.008, 0.035]} />
            <meshStandardMaterial color="#b87333" metalness={0.85} roughness={0.35} />
          </mesh>
        );
      })}
    </>
  );
}

export default function HardArch3DLab() {
  const [P, set, reset] = useLabParams(BCAY_SPECS.hardarch3d);
  const { cpuGhz, ddrGen, channels, pcieGen, pcieLanes } = P;
  const m = busMetrics(cpuGhz, ddrGen, channels, pcieGen, pcieLanes);
  const ch = Math.round(channels);
  const filled = useMemo(() => new Set(FILL.slice(0, ch)), [ch]);
  const memPaths = useMemo(() => FILL.slice(0, ch).map((s) => trace([CPU[0] + 0.5, 0, CPU[2] + (s - 1.5) * 0.12], [SLOT_X[s], 0, -0.2])), [ch]);
  const pciePath = useMemo(() => trace([CPU[0], 0, CPU[2] + 0.6], [-2.3 + (SLOT_LEN[m.width] ?? 3) / 2, 0, 1.55]), [m.width]);
  // dots move at a speed proportional to the real bandwidth of that bus (slowed down hugely so the eye can follow)
  const memSpeed = Math.min(2.2, m.perChannel / 25), pcieSpeed = Math.min(2.2, m.pcieGBs / 25);

  return (
    <LabFrame
      label="Desktop motherboard: CPU socket, memory channels and a PCIe slot, with data moving on each bus at a rate proportional to its bandwidth"
      camera={[1.2, 4.2, 6.2]}
      onReset={reset}
      scene={(playing) => (
        <group>
          {/* 6-layer FR-4 board with mounting holes */}
          <Part p={[0, BOARD_Y, 0]} s={[6.2, 0.1, 4.8]} c="#0d3b2a" rough={0.75} />
          {[[-2.9, -2.2], [2.9, -2.2], [-2.9, 2.2], [2.9, 2.2]].map(([x, z]) => <Part key={`${x}${z}`} p={[x, TOP, z]} s={[0.14, 0.01, 0.14]} c="#c9a227" metal={0.9} rough={0.3} />)}
          {/* VRM chokes and heatsink feeding the CPU */}
          {Array.from({ length: 6 }, (_, i) => <Part key={i} p={[-2.15, TOP + 0.09, -1.45 + i * 0.3]} s={[0.22, 0.18, 0.22]} c="#4a4f55" metal={0.5} rough={0.4} />)}
          <Part p={[-1.0, TOP + 0.18, -1.75]} s={[1.6, 0.36, 0.3]} c="#5d6670" metal={0.85} rough={0.3} />
          {/* chipset under its heatsink, linked to the CPU */}
          <Part p={[1.3, TOP + 0.08, 1.0]} s={[0.8, 0.16, 0.8]} c="#69737d" metal={0.85} rough={0.3} />
          <Cpu ghz={playing ? cpuGhz : 0} />
          {SLOT_X.map((x, i) => <Dimm key={i} x={x} filled={filled.has(i)} gen={ddrGen} />)}
          <Pcie width={m.width} />
          {memPaths.map((p, i) => <Trace key={i} path={p} />)}
          <Trace path={pciePath} />
          {memPaths.map((p, i) => <Flow key={`f${i}-${ddrGen}`} path={p} n={6} speed={memSpeed} color="#7fd3ff" r={0.045} />)}
          {<Flow path={pciePath} n={Math.max(2, Math.round(m.width / 2))} speed={pcieSpeed} color="#ffc83d" r={0.05} />}
        </group>
      )}
      readouts={[
        ["CPU cycle time", `${m.cycleNs.toFixed(3)} ns`],
        ["Memory bandwidth", `${m.ramGBs.toFixed(1)} GB/s (${ch} × ${m.perChannel.toFixed(1)})`],
        ["DRAM CAS latency", `${m.casNs.toFixed(1)} ns = ${m.casCycles} CPU cycles`],
        [`PCIe ${pcieGen}.0 x${m.width}`, `${m.pcieGBs.toFixed(1)} GB/s each way`],
      ]}
      controls={
        <>
          <Slider label="CPU clock" value={cpuGhz} min={1} max={5.5} step={0.1} digits={1} unit=" GHz" onChange={(v) => set("cpuGhz", v)} />
          <Pick label="Memory" value={ddrGen} onChange={(v) => set("ddrGen", v)} options={(["3", "4", "5"] as const).map((g) => ({ id: g, label: DDR[g].label }))} />
          <Slider label="Memory channels (DIMMs)" value={channels} min={1} max={4} step={1} digits={0} onChange={(v) => set("channels", v)} />
          <Pick label="PCIe generation" value={pcieGen} onChange={(v) => set("pcieGen", v)} options={[{ id: "3", label: "PCIe 3.0 (8 GT/s)" }, { id: "4", label: "PCIe 4.0 (16 GT/s)" }, { id: "5", label: "PCIe 5.0 (32 GT/s)" }]} />
          <Slider label="PCIe lanes available" value={pcieLanes} min={1} max={16} step={1} digits={0} onChange={(v) => set("pcieLanes", v)} />
        </>
      }
      note={
        <>
          <p><b>Memory bandwidth</b> = transfers per second × 8 bytes (a 64-bit channel) × number of channels. {DDR[ddrGen].label} does {DDR[ddrGen].mts} million transfers a second, so one channel moves {m.perChannel.toFixed(1)} GB/s. Desktop boards have two channels; filling both (one DIMM each) doubles bandwidth.</p>
          <p><b>Latency is not bandwidth.</b> CAS latency in ns = CL × 2000 ÷ MT/s, about 10–14 ns for every generation, because the DRAM cells themselves have not got faster. At {cpuGhz.toFixed(1)} GHz one cycle is {m.cycleNs.toFixed(2)} ns, so the core would wait {m.casCycles} cycles for the column access alone (a full random access is several times longer). That gap is why CPUs have L1/L2/L3 caches.</p>
          <p><b>PCIe</b> sends data over independent serial lanes. Each lane gives {pcieGen === "3" ? "0.985" : pcieGen === "4" ? "1.969" : "3.938"} GB/s per direction after 128b/130b encoding, and a link trains to a standard width (x1, x2, x4, x8 or x16): {Math.round(pcieLanes)} lanes give an x{m.width} link.</p>
        </>
      }
      viva={[
        ["Why does dual-channel memory help?", "The memory controller can use two independent 64-bit channels at once, so peak bandwidth doubles (e.g. DDR4-3200: 25.6 → 51.2 GB/s)."],
        ["What is the difference between latency and bandwidth?", "Latency is how long one access takes to start returning data; bandwidth is how many bytes per second flow once it does. DDR generations raised bandwidth a lot but latency has stayed around 10–15 ns."],
        ["What does CL16 mean?", "The CAS latency: 16 memory-clock cycles between a column read command and the data. For DDR4-3200 (1600 MHz clock) that is 16 / 1.6 GHz = 10 ns."],
        ["Why is PCIe serial and not parallel?", "At GHz speeds the wires of a wide parallel bus arrive at slightly different times (skew). Independent serial lanes with embedded clocks scale better; you add lanes for more bandwidth."],
      ]}
    />
  );
}
