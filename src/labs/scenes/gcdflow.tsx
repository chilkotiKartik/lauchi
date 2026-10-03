"use client";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { gcd, gcdTrace, type GcdStep } from "../sim/extra";
import { C, Floor, Panel } from "../kit";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { EXTRA_SPECS } from "../meta/extra.specs";
import { Tick } from "../Stage";

export type V3 = [number, number, number];

/** Directional 3D arrow with cylinder shaft and cone head. */
function Arrow3D({ from, to, color = "#9db0ba", r = 0.035, headLen = 0.22, headRadius = 0.09, glow = 0.2 }: {
  from: V3; to: V3; color?: string; r?: number; headLen?: number; headRadius?: number; glow?: number;
}) {
  const { pos, quat, len } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const dir = b.clone().sub(a);
    const l = Math.max(1e-4, dir.length());
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return { pos: mid, quat: q, len: l };
  }, [from, to]);

  const h = Math.min(headLen, len * 0.45);
  const shaftLen = Math.max(0.001, len - h);

  return (
    <group position={pos} quaternion={quat}>
      <mesh position={[0, -h / 2, 0]}>
        <cylinderGeometry args={[r, r, shaftLen, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow} metalness={0.4} roughness={0.3} />
      </mesh>
      <mesh position={[0, len / 2 - h / 2, 0]}>
        <coneGeometry args={[headRadius, h, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow * 1.5} metalness={0.4} roughness={0.3} />
      </mesh>
    </group>
  );
}

/** 3D conduit pipe between multiple waypoints. */
function Conduit({ pts, color = "#7a8f9d", r = 0.03, glow = 0.1 }: { pts: V3[]; color?: string; r?: number; glow?: number }) {
  const segments = useMemo(() => {
    const list: { from: V3; to: V3 }[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      list.push({ from: pts[i], to: pts[i + 1] });
    }
    return list;
  }, [pts]);

  return (
    <group>
      {segments.map((s, idx) => {
        const a = new THREE.Vector3(...s.from);
        const b = new THREE.Vector3(...s.to);
        const dir = b.clone().sub(a);
        const l = dir.length();
        if (l < 1e-4) return null;
        const mid = a.clone().add(b).multiplyScalar(0.5);
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
        return (
          <group key={idx}>
            <mesh position={mid} quaternion={q}>
              <cylinderGeometry args={[r, r, l, 16]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow} metalness={0.5} roughness={0.25} />
            </mesh>
            <mesh position={s.from}>
              <sphereGeometry args={[r * 1.25, 12, 12]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow} metalness={0.5} roughness={0.25} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/** Creates a crisp HTML5 Canvas texture for flowchart blocks with C code styling. */
function createCardTexture({
  title,
  subtitle,
  code,
  accentColor,
  active,
  shape = "rect",
  w = 512,
  h = 256,
}: {
  title: string;
  subtitle?: string;
  code?: string[];
  accentColor: string;
  active: boolean;
  shape?: "rect" | "diamond" | "capsule" | "parallelogram";
  w?: number;
  h?: number;
}): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, w, h);

  // Background Box
  ctx.fillStyle = active ? "#0f2333" : "#0a131a";
  ctx.strokeStyle = active ? accentColor : "#243742";
  ctx.lineWidth = active ? 8 : 4;

  const pad = 12;
  ctx.beginPath();
  if (shape === "capsule") {
    ctx.roundRect(pad, pad, w - pad * 2, h - pad * 2, (h - pad * 2) / 2);
  } else if (shape === "diamond") {
    ctx.moveTo(w / 2, pad);
    ctx.lineTo(w - pad, h / 2);
    ctx.lineTo(w / 2, h - pad);
    ctx.lineTo(pad, h / 2);
    ctx.closePath();
  } else if (shape === "parallelogram") {
    const slant = 40;
    ctx.moveTo(pad + slant, pad);
    ctx.lineTo(w - pad, pad);
    ctx.lineTo(w - pad - slant, h - pad);
    ctx.lineTo(pad, h - pad);
    ctx.closePath();
  } else {
    ctx.roundRect(pad, pad, w - pad * 2, h - pad * 2, 20);
  }
  ctx.fill();
  ctx.stroke();

  // Glow halo if active
  if (active) {
    ctx.save();
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 24;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
  }

  // Header Banner
  const headerH = 48;
  const headerY = shape === "diamond" ? 44 : 20;
  ctx.fillStyle = active ? accentColor : "#182a36";
  ctx.beginPath();
  if (shape === "diamond") {
    ctx.roundRect(w / 2 - 130, headerY, 260, 36, 12);
  } else {
    ctx.roundRect(36, headerY, w - 72, headerH, 10);
  }
  ctx.fill();

  // Title text
  ctx.fillStyle = active ? "#000000" : "#ffffff";
  ctx.font = "bold 26px 'Segoe UI', Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(title, w / 2, shape === "diamond" ? headerY + 18 : headerY + headerH / 2);

  // Subtitle / C Code Body
  ctx.textAlign = "center";
  if (subtitle) {
    ctx.fillStyle = active ? "#e2f2ff" : "#89a3b2";
    ctx.font = "bold 20px 'JetBrains Mono', Consolas, monospace";
    ctx.fillText(subtitle, w / 2, headerY + (shape === "diamond" ? 54 : 76));
  }

  if (code && code.length > 0) {
    const startY = headerY + (shape === "diamond" ? 76 : 94);
    const lineSpacing = 32;
    code.forEach((line, idx) => {
      ctx.font = "bold 22px 'JetBrains Mono', Consolas, monospace";
      ctx.fillStyle = active ? "#ffeb99" : "#b0cddb";
      ctx.fillText(line, w / 2, startY + idx * lineSpacing);
    });
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** Floating badge texture for YES/NO/LOOP labels. */
function createBadgeTexture(text: string, color: string, active: boolean): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = active ? color : "#13232c";
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(10, 16, 236, 96, 28);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = active ? "#000000" : "#ffffff";
  ctx.font = "bold 38px 'Segoe UI', Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 128, 64);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** C Code HUD Monitor Panel. */
function createCodeHudTexture(method: "mod" | "sub", node: GcdStep["node"], a: number, b: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  // IDE Background Window
  ctx.fillStyle = "#081017";
  ctx.beginPath();
  ctx.roundRect(8, 8, 624, 496, 24);
  ctx.fill();
  ctx.strokeStyle = "#1b303d";
  ctx.lineWidth = 6;
  ctx.stroke();

  // Window Top Bar
  ctx.fillStyle = "#0e1b24";
  ctx.beginPath();
  ctx.roundRect(12, 12, 616, 52, [18, 18, 0, 0]);
  ctx.fill();

  // Window Controls (Red, Yellow, Green dots)
  const dots = ["#ff5f56", "#ffbd2e", "#27c93f"];
  dots.forEach((col, i) => {
    ctx.beginPath();
    ctx.arc(36 + i * 24, 38, 8, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();
  });

  // Filename tab
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px 'JetBrains Mono', Consolas, monospace";
  ctx.textAlign = "center";
  ctx.fillText("euclid_gcd.c — GCC 14.2", 360, 39);

  // Code Lines
  const linesMod = [
    { num: "1", code: "int gcd(int a, int b) {", node: "start" },
    { num: "2", code: "  scanf(\"%d %d\", &a, &b);", node: "input" },
    { num: "3", code: "  while (b != 0) {", node: "test" },
    { num: "4", code: "    int r = a % b;", node: "calc" },
    { num: "5", code: "    a = b;  b = r;", node: "calc" },
    { num: "6", code: "  }", node: "" },
    { num: "7", code: "  printf(\"GCD = %d\\n\", a);", node: "output" },
    { num: "8", code: "  return a;", node: "output" },
    { num: "9", code: "}", node: "" },
  ];

  const linesSub = [
    { num: "1", code: "int gcd_sub(int a, int b) {", node: "start" },
    { num: "2", code: "  scanf(\"%d %d\", &a, &b);", node: "input" },
    { num: "3", code: "  while (a != b) {", node: "test" },
    { num: "4", code: "    if (a > b) a -= b;", node: "calc" },
    { num: "5", code: "    else b -= a;", node: "calc" },
    { num: "6", code: "  }", node: "" },
    { num: "7", code: "  printf(\"GCD = %d\\n\", a);", node: "output" },
    { num: "8", code: "  return a;", node: "output" },
    { num: "9", code: "}", node: "" },
  ];

  const lines = method === "mod" ? linesMod : linesSub;
  const startY = 100;
  const lineH = 38;

  lines.forEach((l, idx) => {
    const y = startY + idx * lineH;
    const isCurrent = l.node === node;

    if (isCurrent) {
      ctx.fillStyle = "#1e3a4e";
      ctx.beginPath();
      ctx.roundRect(20, y - 24, 600, 34, 8);
      ctx.fill();

      // Current Execution Arrow Indicator
      ctx.fillStyle = "#ffc83d";
      ctx.font = "bold 20px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText("▶", 24, y);
    }

    // Line number
    ctx.fillStyle = isCurrent ? "#82b1ff" : "#405d6e";
    ctx.font = "18px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    ctx.fillText(l.num, 68, y);

    // Code text syntax highlighting
    ctx.textAlign = "left";
    ctx.font = "bold 20px 'JetBrains Mono', Consolas, monospace";
    ctx.fillStyle = isCurrent ? "#ffffff" : "#c6dce8";
    ctx.fillText(l.code, 84, y);
  });

  // Bottom Status Bar
  ctx.fillStyle = "#0e1b24";
  ctx.beginPath();
  ctx.roundRect(12, 452, 616, 48, [0, 0, 18, 18]);
  ctx.fill();

  ctx.fillStyle = "#44c95a";
  ctx.font = "bold 18px 'JetBrains Mono', monospace";
  ctx.textAlign = "left";
  ctx.fillText(`● CPU REGISTERS:  A = ${a}   B = ${b}`, 32, 482);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export default function GcdFlowLab() {
  const [P, set, reset] = useLabParams(EXTRA_SPECS.gcdflow);
  const { a, b, method, step } = P;
  const trace = gcdTrace(a, b, method);
  const i = Math.min(Math.round(step), trace.length - 1);
  const cur = trace[i];
  const top = Math.max(a, b, 1);
  const loops = trace.filter((s) => s.node === "calc").length;

  // Animated data flow pulse
  const pulseMesh = useRef<THREE.Mesh>(null);
  const pulseProgress = useRef(0);

  // Coordinates for the flowchart nodes
  const nodeStart: V3 = [-2.4, 2.0, 0];
  const nodeInput: V3 = [-2.4, 1.15, 0];
  const nodeTest: V3 = [-2.4, 0.15, 0];
  const nodeCalc: V3 = [-0.5, -0.75, 0];
  const nodeOutput: V3 = [-4.3, -0.9, 0];

  // Textures for each node
  const texStart = useMemo(() => createCardTexture({
    title: "1. START",
    subtitle: "int main()",
    accentColor: C.green,
    active: cur.node === "start",
    shape: "capsule",
  }), [cur.node]);

  const texInput = useMemo(() => createCardTexture({
    title: "2. INPUT I/O",
    subtitle: "scanf(\"%d %d\", &a, &b);",
    code: [`a = ${a},  b = ${b}`],
    accentColor: C.blue,
    active: cur.node === "input",
    shape: "parallelogram",
  }), [cur.node, a, b]);

  const texTest = useMemo(() => createCardTexture({
    title: "3. DECISION",
    subtitle: method === "mod" ? "while (b != 0)" : "while (a != b)",
    code: [method === "mod" ? `Is ${cur.b} == 0 ?` : `Is ${cur.a} == ${cur.b} ?`],
    accentColor: C.gold,
    active: cur.node === "test",
    shape: "diamond",
  }), [cur.node, method, cur.a, cur.b]);

  const texCalc = useMemo(() => createCardTexture({
    title: "4. COMPUTE",
    subtitle: method === "mod" ? "r = a % b; a = b; b = r;" : "if (a > b) a -= b; else b -= a;",
    code: method === "mod"
      ? [`r = ${cur.a} % ${cur.b} = ${cur.b !== 0 ? cur.a % cur.b : 0}`, `a = ${cur.b};  b = ${cur.b !== 0 ? cur.a % cur.b : 0}`]
      : [cur.a > cur.b ? `a = ${cur.a} - ${cur.b} = ${cur.a - cur.b}` : `b = ${cur.b} - ${cur.a} = ${cur.b - cur.a}`],
    accentColor: C.purple,
    active: cur.node === "calc",
    shape: "rect",
  }), [cur.node, method, cur.a, cur.b]);

  const texOutput = useMemo(() => createCardTexture({
    title: "5. OUTPUT & EXIT",
    subtitle: `printf("GCD = %d\\n", a);`,
    code: [`Result GCD = ${cur.a}`, "return 0;"],
    accentColor: C.red,
    active: cur.node === "output",
    shape: "capsule",
  }), [cur.node, cur.a]);

  // Branch Decision Badges
  const texYes = useMemo(() => createBadgeTexture("YES (Done)", C.green, cur.node === "output"), [cur.node]);
  const texNo = useMemo(() => createBadgeTexture("NO (Loop)", C.orange, cur.node === "calc"), [cur.node]);
  const texLoopBack = useMemo(() => createBadgeTexture("REPEAT ↺", C.orange, cur.node === "calc"), [cur.node]);

  // C Code HUD Texture
  const texCodeHud = useMemo(() => createCodeHudTexture(method, cur.node, cur.a, cur.b), [method, cur.node, cur.a, cur.b]);

  // Texture cleanup on unmount
  useEffect(() => {
    return () => {
      [texStart, texInput, texTest, texCalc, texOutput, texYes, texNo, texLoopBack, texCodeHud].forEach((t) => t?.dispose());
    };
  }, [texStart, texInput, texTest, texCalc, texOutput, texYes, texNo, texLoopBack, texCodeHud]);

  // Animation tick for glowing pulse along active path
  const handleTick = (dt: number) => {
    if (!pulseMesh.current) return;
    pulseProgress.current = (pulseProgress.current + Math.min(dt, 0.05) * 1.5) % 1;
    const t = pulseProgress.current;

    // Place pulse at active node or active branch
    if (cur.node === "start") {
      pulseMesh.current.position.set(nodeStart[0], nodeStart[1] - t * 0.85, 0.18);
    } else if (cur.node === "input") {
      pulseMesh.current.position.set(nodeInput[0], nodeInput[1] - t * 1.0, 0.18);
    } else if (cur.node === "test") {
      // heading towards calc or output
      if (trace[i + 1]?.node === "output") {
        pulseMesh.current.position.set(nodeTest[0] - t * 1.9, nodeTest[1] - t * 1.05, 0.18);
      } else {
        pulseMesh.current.position.set(nodeTest[0] + t * 1.9, nodeTest[1] - t * 0.9, 0.18);
      }
    } else if (cur.node === "calc") {
      // Loopback conduit animation
      if (t < 0.25) {
        pulseMesh.current.position.set(nodeCalc[0], nodeCalc[1] - 0.45 - (t / 0.25) * 0.35, 0.18);
      } else if (t < 0.65) {
        const k = (t - 0.25) / 0.4;
        pulseMesh.current.position.set(nodeCalc[0] - k * 3.1, -1.55, 0.18);
      } else if (t < 0.9) {
        const k = (t - 0.65) / 0.25;
        pulseMesh.current.position.set(-3.6, -1.55 + k * 1.7, 0.18);
      } else {
        const k = (t - 0.9) / 0.1;
        pulseMesh.current.position.set(-3.6 + k * 0.8, 0.15, 0.18);
      }
    } else {
      pulseMesh.current.position.set(nodeOutput[0], nodeOutput[1], 0.18);
    }
  };

  return (
    <LabFrame
      label="A realistic 3D C Program Flowchart and CPU Register Rack simulating Euclid's GCD algorithm step-by-step with live arrows, branch logic, and C execution code"
      camera={[0, 0.6, 7.2]}
      animated={true}
      onReset={reset}
      scene={() => (
        <group>
          <Tick fn={handleTick} />
          <Floor size={14} y={-2.2} divisions={14} />

          {/* ========================================================================= */}
          {/* FLOWCHART BACKDROP BOARD WITH INDUSTRIAL CHASSIS */}
          {/* ========================================================================= */}
          <group position={[-2.4, 0.35, -0.45]}>
            {/* Outer metallic bevel */}
            <mesh position={[0, 0, -0.05]}>
              <boxGeometry args={[6.6, 4.8, 0.08]} />
              <meshStandardMaterial color="#1a2730" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Inner high-tech glass backing */}
            <Panel p={[0, 0, 0]} w={6.4} h={4.6} c="#081118" o={0.96} />

            {/* Title Engraving */}
            <mesh position={[0, 2.1, 0.02]}>
              <planeGeometry args={[4.2, 0.35]} />
              <meshBasicMaterial transparent opacity={0.85} color="#2ba6f5" />
            </mesh>
          </group>

          {/* ========================================================================= */}
          {/* 3D CONDUITS & DIRECTIONAL ARROWS */}
          {/* ========================================================================= */}
          {/* 1. START -> INPUT */}
          <Conduit pts={[[nodeStart[0], nodeStart[1] - 0.3, 0], [nodeInput[0], nodeInput[1] + 0.35, 0]]} color={C.green} glow={cur.node === "start" ? 0.6 : 0.1} />
          <Arrow3D from={[nodeStart[0], nodeStart[1] - 0.3, 0]} to={[nodeInput[0], nodeInput[1] + 0.35, 0]} color={C.green} glow={cur.node === "start" ? 0.9 : 0.2} />

          {/* 2. INPUT -> TEST DECISION */}
          <Conduit pts={[[nodeInput[0], nodeInput[1] - 0.35, 0], [nodeTest[0], nodeTest[1] + 0.45, 0]]} color={C.blue} glow={cur.node === "input" ? 0.6 : 0.1} />
          <Arrow3D from={[nodeInput[0], nodeInput[1] - 0.35, 0]} to={[nodeTest[0], nodeTest[1] + 0.45, 0]} color={C.blue} glow={cur.node === "input" ? 0.9 : 0.2} />

          {/* 3. TEST -> CALCULATION (NO / FALSE BRANCH) */}
          <Conduit
            pts={[
              [nodeTest[0] + 0.55, nodeTest[1], 0],
              [nodeCalc[0], nodeTest[1], 0],
              [nodeCalc[0], nodeCalc[1] + 0.45, 0],
            ]}
            color={C.orange}
            glow={cur.node === "test" && trace[i + 1]?.node === "calc" ? 0.8 : 0.15}
          />
          <Arrow3D
            from={[nodeCalc[0], nodeTest[1] - 0.2, 0]}
            to={[nodeCalc[0], nodeCalc[1] + 0.45, 0]}
            color={C.orange}
            glow={cur.node === "test" && trace[i + 1]?.node === "calc" ? 0.9 : 0.2}
          />

          {/* 4. CALCULATION -> LOOPBACK TO DECISION */}
          <Conduit
            pts={[
              [nodeCalc[0], nodeCalc[1] - 0.45, 0],
              [nodeCalc[0], -1.55, 0],
              [-3.6, -1.55, 0],
              [-3.6, nodeTest[1], 0],
              [nodeTest[0] - 0.55, nodeTest[1], 0],
            ]}
            color={C.gold}
            glow={cur.node === "calc" ? 0.8 : 0.15}
          />
          <Arrow3D
            from={[-3.3, nodeTest[1], 0]}
            to={[nodeTest[0] - 0.55, nodeTest[1], 0]}
            color={C.gold}
            glow={cur.node === "calc" ? 0.9 : 0.2}
          />

          {/* 5. TEST -> OUTPUT (YES / TRUE / EXIT BRANCH) */}
          <Conduit
            pts={[
              [nodeTest[0], nodeTest[1] - 0.45, 0],
              [nodeTest[0], nodeOutput[1], 0],
              [nodeOutput[0] + 0.85, nodeOutput[1], 0],
            ]}
            color={C.green}
            glow={cur.node === "test" && trace[i + 1]?.node === "output" ? 0.8 : 0.15}
          />
          <Arrow3D
            from={[nodeTest[0] - 0.5, nodeOutput[1], 0]}
            to={[nodeOutput[0] + 0.85, nodeOutput[1], 0]}
            color={C.green}
            glow={cur.node === "test" && trace[i + 1]?.node === "output" ? 0.9 : 0.2}
          />

          {/* ========================================================================= */}
          {/* BRANCH DECISION BADGES & LABELS */}
          {/* ========================================================================= */}
          {/* "NO / LOOP" Badge */}
          <mesh position={[-0.95, 0.4, 0.05]}>
            <planeGeometry args={[0.7, 0.35]} />
            <meshBasicMaterial map={texNo} transparent />
          </mesh>

          {/* "YES / DONE" Badge */}
          <mesh position={[-3.2, -0.4, 0.05]}>
            <planeGeometry args={[0.7, 0.35]} />
            <meshBasicMaterial map={texYes} transparent />
          </mesh>

          {/* "LOOP BACK" Return Badge */}
          <mesh position={[-2.0, -1.75, 0.05]}>
            <planeGeometry args={[0.9, 0.35]} />
            <meshBasicMaterial map={texLoopBack} transparent />
          </mesh>

          {/* ========================================================================= */}
          {/* FLOWCHART 3D CARDS & NODES */}
          {/* ========================================================================= */}
          {/* Node 1: START */}
          <group position={nodeStart}>
            <mesh position={[0, 0, -0.05]}>
              <boxGeometry args={[1.7, 0.65, 0.15]} />
              <meshStandardMaterial color="#0c1d14" roughness={0.3} metalness={0.5} />
            </mesh>
            <mesh position={[0, 0, 0.05]}>
              <planeGeometry args={[1.7, 0.65]} />
              <meshBasicMaterial map={texStart} transparent />
            </mesh>
          </group>

          {/* Node 2: INPUT */}
          <group position={nodeInput}>
            <mesh position={[0, 0, -0.05]}>
              <boxGeometry args={[1.8, 0.7, 0.15]} />
              <meshStandardMaterial color="#0d1b2a" roughness={0.3} metalness={0.5} />
            </mesh>
            <mesh position={[0, 0, 0.05]}>
              <planeGeometry args={[1.8, 0.7]} />
              <meshBasicMaterial map={texInput} transparent />
            </mesh>
          </group>

          {/* Node 3: TEST (DECISION DIAMOND) */}
          <group position={nodeTest}>
            <mesh position={[0, 0, -0.06]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[1.1, 1.1, 0.16]} />
              <meshStandardMaterial color="#2b2308" emissive={cur.node === "test" ? "#ffc83d" : "#000000"} emissiveIntensity={cur.node === "test" ? 0.3 : 0} roughness={0.3} metalness={0.6} />
            </mesh>
            <mesh position={[0, 0, 0.06]}>
              <planeGeometry args={[1.6, 1.6]} />
              <meshBasicMaterial map={texTest} transparent />
            </mesh>
          </group>

          {/* Node 4: CALC (PROCESS BLOCK) */}
          <group position={nodeCalc}>
            <mesh position={[0, 0, -0.05]}>
              <boxGeometry args={[1.9, 0.9, 0.15]} />
              <meshStandardMaterial color="#1e1330" roughness={0.3} metalness={0.5} />
            </mesh>
            <mesh position={[0, 0, 0.05]}>
              <planeGeometry args={[1.9, 0.9]} />
              <meshBasicMaterial map={texCalc} transparent />
            </mesh>
          </group>

          {/* Node 5: OUTPUT & EXIT */}
          <group position={nodeOutput}>
            <mesh position={[0, 0, -0.05]}>
              <boxGeometry args={[1.8, 0.75, 0.15]} />
              <meshStandardMaterial color="#2b0e12" roughness={0.3} metalness={0.5} />
            </mesh>
            <mesh position={[0, 0, 0.05]}>
              <planeGeometry args={[1.8, 0.75]} />
              <meshBasicMaterial map={texOutput} transparent />
            </mesh>
          </group>

          {/* ========================================================================= */}
          {/* ANIMATED EXECUTION PULSE GLIDER */}
          {/* ========================================================================= */}
          <mesh ref={pulseMesh} position={[nodeStart[0], nodeStart[1], 0.18]}>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffea75" emissiveIntensity={1.5} roughness={0.1} />
          </mesh>

          {/* ========================================================================= */}
          {/* RIGHT SIDE: C SOURCE CODE HUD MONITOR + VARIABLE MEMORY REGISTER TOWERS */}
          {/* ========================================================================= */}
          {/* 1. C Code IDE HUD Monitor */}
          <group position={[2.7, 0.85, -0.3]}>
            <mesh position={[0, 0, 0.02]}>
              <planeGeometry args={[3.2, 2.56]} />
              <meshBasicMaterial map={texCodeHud} transparent />
            </mesh>
          </group>

          {/* 2. CPU Variable Memory Register Towers */}
          <group position={[1.4, -1.1, 0]}>
            {/* Memory Base Pedestal */}
            <mesh position={[1.3, -1.05, 0]}>
              <boxGeometry args={[3.4, 0.22, 1.4]} />
              <meshStandardMaterial color="#16252f" metalness={0.7} roughness={0.3} />
            </mesh>

            {/* Register A Tower */}
            {(() => {
              const hA = Math.max(0.12, (cur.a / top) * 1.8);
              return (
                <group position={[0.45, -0.95, 0]}>
                  {/* Tower Column */}
                  <mesh position={[0, hA / 2, 0]}>
                    <boxGeometry args={[0.7, hA, 0.7]} />
                    <meshStandardMaterial color={C.blue} emissive={C.blue} emissiveIntensity={0.35} metalness={0.4} roughness={0.25} />
                  </mesh>
                  {/* Glowing Top Cap */}
                  <mesh position={[0, hA + 0.02, 0]}>
                    <boxGeometry args={[0.66, 0.04, 0.66]} />
                    <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} />
                  </mesh>
                  {/* Register Base Nameplate */}
                  <mesh position={[0, -0.05, 0.42]}>
                    <boxGeometry args={[0.8, 0.14, 0.05]} />
                    <meshStandardMaterial color="#0b1b24" metalness={0.8} roughness={0.2} />
                  </mesh>
                </group>
              );
            })()}

            {/* Register B Tower */}
            {(() => {
              const hB = Math.max(0.12, (cur.b / top) * 1.8);
              return (
                <group position={[2.15, -0.95, 0]}>
                  {/* Tower Column */}
                  <mesh position={[0, hB / 2, 0]}>
                    <boxGeometry args={[0.7, hB, 0.7]} />
                    <meshStandardMaterial color={C.orange} emissive={C.orange} emissiveIntensity={0.35} metalness={0.4} roughness={0.25} />
                  </mesh>
                  {/* Glowing Top Cap */}
                  <mesh position={[0, hB + 0.02, 0]}>
                    <boxGeometry args={[0.66, 0.04, 0.66]} />
                    <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} />
                  </mesh>
                  {/* Register Base Nameplate */}
                  <mesh position={[0, -0.05, 0.42]}>
                    <boxGeometry args={[0.8, 0.14, 0.05]} />
                    <meshStandardMaterial color="#0b1b24" metalness={0.8} roughness={0.2} />
                  </mesh>
                </group>
              );
            })()}
          </group>
        </group>
      )}
      readouts={[
        ["gcd(a, b)", String(gcd(a, b))],
        ["Loop passes to finish", String(loops)],
        ["Active C Step", cur.note],
        ["Register A", String(cur.a)],
        ["Register B", String(cur.b)],
        ["Trace Progress", `Step ${i + 1} of ${trace.length}`],
      ]}
      controls={<>
        <Slider label="Number a" value={a} min={1} max={999} step={1} digits={0} onChange={(x) => set("a", Math.round(x))} />
        <Slider label="Number b" value={b} min={1} max={999} step={1} digits={0} onChange={(x) => set("b", Math.round(x))} />
        <Pick label="Method" value={method} options={[{ id: "mod", label: "Euclidean Remainder (a % b)" }, { id: "sub", label: "Repeated Subtraction" }]} onChange={(v) => set("method", v)} />
        <Slider label="Step through Execution" value={i} min={0} max={trace.length - 1} step={1} digits={0} onChange={(x) => set("step", Math.round(x))} />
      </>}
      note={<p>A fully realistic 3D C Program Flowchart and Memory Register simulation of Euclid&apos;s GCD Algorithm. Green capsule: <code>START</code> / <code>main()</code>. Cyan parallelogram: <code>scanf()</code> input of variables <code>a</code> and <code>b</code>. Gold diamond: the decision condition (<code>b == 0?</code> for modulo, <code>a == b?</code> for subtraction) with labeled <strong>YES</strong> and <strong>NO</strong> branches. Purple block: calculation (<code>r = a % b; a = b; b = r;</code>) with directional 3D return arrows. Red capsule: <code>printf()</code> final output. The right-side C code monitor highlights the exact instruction running, while the memory towers display live register values.</p>}
    />
  );
}
