"use client";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { gcd, gcdTrace, type GcdStep } from "../sim/extra";
import { C, Floor } from "../kit";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { EXTRA_SPECS } from "../meta/extra.specs";
import { Tick } from "../Stage";

export type V3 = [number, number, number];

/** Directional 3D Arrow with metallic tube and glowing cone head */
function FlowArrow({ from, to, color = "#2ba6f5", r = 0.032, headLen = 0.22, headRadius = 0.08, active = false }: {
  from: V3; to: V3; color?: string; r?: number; headLen?: number; headRadius?: number; active?: boolean;
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
  const glow = active ? 0.9 : 0.25;

  return (
    <group position={pos} quaternion={quat}>
      <mesh position={[0, -h / 2, 0]}>
        <cylinderGeometry args={[r, r, shaftLen, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow} metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0, len / 2 - h / 2, 0]}>
        <coneGeometry args={[headRadius, h, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow * 1.4} metalness={0.7} roughness={0.2} />
      </mesh>
    </group>
  );
}

/** 3D Conduit Pipe with chrome joint rings */
function ConduitPipe({ pts, color = "#3b5364", r = 0.03, glow = 0.15 }: { pts: V3[]; color?: string; r?: number; glow?: number }) {
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
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow} metalness={0.8} roughness={0.25} />
            </mesh>
            <mesh position={s.from}>
              <sphereGeometry args={[r * 1.3, 14, 14]} />
              <meshStandardMaterial color="#8ba5b5" metalness={0.9} roughness={0.15} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/** Crisp canvas label generator for node faces */
function makeNodeLabel({
  type,
  title,
  sub,
  code,
  color,
  active,
  w = 512,
  h = 240,
}: {
  type: string;
  title: string;
  sub: string;
  code?: string;
  color: string;
  active: boolean;
  w?: number;
  h?: number;
}): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, w, h);

  // Background glass fill
  ctx.fillStyle = active ? "rgba(10, 24, 38, 0.95)" : "rgba(8, 14, 20, 0.92)";
  ctx.beginPath();
  ctx.roundRect(8, 8, w - 16, h - 16, 20);
  ctx.fill();

  // Glowing boundary
  ctx.strokeStyle = active ? color : "rgba(80, 115, 140, 0.4)";
  ctx.lineWidth = active ? 7 : 3;
  ctx.stroke();

  if (active) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  // Header pill badge
  ctx.fillStyle = active ? color : "rgba(35, 55, 70, 0.8)";
  ctx.beginPath();
  ctx.roundRect(24, 20, w - 48, 44, 10);
  ctx.fill();

  // Type Tag / Step
  ctx.fillStyle = active ? "#000000" : "#ffffff";
  ctx.font = "bold 22px 'JetBrains Mono', 'Segoe UI', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${type.toUpperCase()} • ${title}`, w / 2, 42);

  // Subtitle / High-level meaning
  ctx.fillStyle = active ? "#ffffff" : "#b0cbdb";
  ctx.font = "bold 20px 'Segoe UI', Inter, sans-serif";
  ctx.fillText(sub, w / 2, 95);

  // C Code Box
  if (code) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.beginPath();
    ctx.roundRect(32, 125, w - 64, h - 145, 10);
    ctx.fill();
    ctx.strokeStyle = active ? color : "rgba(60, 90, 110, 0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = active ? "#ffea79" : "#80d4ff";
    ctx.font = "bold 22px 'JetBrains Mono', Consolas, monospace";
    ctx.fillText(code, w / 2, 125 + (h - 145) / 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** Branch decision badge (YES / NO) */
function makeBranchTag(text: string, color: string, active: boolean): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 110;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = active ? color : "rgba(12, 22, 30, 0.9)";
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(8, 8, 240, 94, 24);
  ctx.fill();
  ctx.stroke();

  if (active) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 16;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  ctx.fillStyle = active ? "#000000" : "#ffffff";
  ctx.font = "bold 34px 'Segoe UI', Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 128, 55);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** Holographic C IDE Screen */
function makeIdeScreen(method: "mod" | "sub", node: GcdStep["node"], a: number, b: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 620;
  canvas.height = 540;
  const ctx = canvas.getContext("2d")!;

  // Frame Background
  ctx.fillStyle = "rgba(7, 13, 20, 0.95)";
  ctx.beginPath();
  ctx.roundRect(6, 6, 608, 528, 20);
  ctx.fill();
  ctx.strokeStyle = "#254152";
  ctx.lineWidth = 5;
  ctx.stroke();

  // Title bar
  ctx.fillStyle = "rgba(18, 32, 44, 0.9)";
  ctx.beginPath();
  ctx.roundRect(10, 10, 600, 50, [16, 16, 0, 0]);
  ctx.fill();

  // Traffic lights
  const dots = ["#ff5f56", "#ffbd2e", "#27c93f"];
  dots.forEach((col, i) => {
    ctx.beginPath();
    ctx.arc(32 + i * 22, 35, 7, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();
  });

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText("euclid_gcd.c — C Interactive Debugger", 340, 36);

  // Code Listing
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
  const lineH = 40;

  lines.forEach((l, idx) => {
    const y = startY + idx * lineH;
    const isNow = l.node === node;

    if (isNow) {
      ctx.fillStyle = "rgba(43, 166, 245, 0.25)";
      ctx.beginPath();
      ctx.roundRect(18, y - 26, 584, 34, 8);
      ctx.fill();

      // Execution pointer
      ctx.fillStyle = "#ffc83d";
      ctx.font = "bold 20px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText("▶", 24, y - 2);
    }

    ctx.fillStyle = isNow ? "#82b1ff" : "#436577";
    ctx.font = "16px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    ctx.fillText(l.num, 66, y - 2);

    ctx.textAlign = "left";
    ctx.font = "bold 19px 'JetBrains Mono', Consolas, monospace";
    ctx.fillStyle = isNow ? "#ffffff" : "#c0dceb";
    ctx.fillText(l.code, 82, y - 2);
  });

  // Footer status bar
  ctx.fillStyle = "rgba(14, 26, 36, 0.95)";
  ctx.beginPath();
  ctx.roundRect(10, 480, 600, 48, [0, 0, 16, 16]);
  ctx.fill();

  ctx.fillStyle = "#44c95a";
  ctx.font = "bold 17px 'JetBrains Mono', monospace";
  ctx.textAlign = "left";
  ctx.fillText(`● CPU REG: a=${a}  b=${b}  gcd=${gcd(a, b)}`, 28, 510);

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

  const photonMesh = useRef<THREE.Mesh>(null);
  const photonProgress = useRef(0);

  // Flowchart Node Positions
  const posStart: V3 = [-2.5, 2.0, 0];
  const posInput: V3 = [-2.5, 1.05, 0];
  const posTest: V3 = [-2.5, 0.05, 0];
  const posCalc: V3 = [-0.6, -0.9, 0];
  const posOutput: V3 = [-4.35, -0.9, 0];

  // Texture creations
  const texStart = useMemo(() => makeNodeLabel({
    type: "Terminal",
    title: "START",
    sub: "Entry Point",
    code: "int main()",
    color: C.green,
    active: cur.node === "start",
  }), [cur.node]);

  const texInput = useMemo(() => makeNodeLabel({
    type: "Input/Output",
    title: "INPUT",
    sub: `Read (a=${a}, b=${b})`,
    code: "scanf(\"%d %d\", &a, &b);",
    color: C.blue,
    active: cur.node === "input",
  }), [cur.node, a, b]);

  const texTest = useMemo(() => makeNodeLabel({
    type: "Decision",
    title: "CONDITION",
    sub: method === "mod" ? "Is remainder 0?" : "Are values equal?",
    code: method === "mod" ? `b == 0 ?  (b = ${cur.b})` : `a == b ?  (${cur.a} vs ${cur.b})`,
    color: C.gold,
    active: cur.node === "test",
  }), [cur.node, method, cur.a, cur.b]);

  const texCalc = useMemo(() => makeNodeLabel({
    type: "Process",
    title: "CALCULATE",
    sub: method === "mod" ? "Euclid Modulo Reduction" : "Repeated Subtraction",
    code: method === "mod"
      ? `r = ${cur.a % (cur.b || 1)}; a = ${cur.b}; b = r;`
      : cur.a > cur.b ? `a = a - b = ${cur.a - cur.b}` : `b = b - a = ${cur.b - cur.a}`,
    color: C.purple,
    active: cur.node === "calc",
  }), [cur.node, method, cur.a, cur.b]);

  const texOutput = useMemo(() => makeNodeLabel({
    type: "Terminal",
    title: "OUTPUT",
    sub: "Print Final GCD Result",
    code: `printf("GCD = %d\\n", ${cur.a});`,
    color: C.red,
    active: cur.node === "output",
  }), [cur.node, cur.a]);

  // Branch Tags
  const texYes = useMemo(() => makeBranchTag("YES (Done)", C.green, cur.node === "output"), [cur.node]);
  const texNo = useMemo(() => makeBranchTag("NO (Loop)", C.orange, cur.node === "calc"), [cur.node]);
  const texLoop = useMemo(() => makeBranchTag("LOOP ↺", C.orange, cur.node === "calc"), [cur.node]);

  // IDE Monitor Texture
  const texIde = useMemo(() => makeIdeScreen(method, cur.node, cur.a, cur.b), [method, cur.node, cur.a, cur.b]);

  // Cleanup textures
  useEffect(() => {
    return () => {
      [texStart, texInput, texTest, texCalc, texOutput, texYes, texNo, texLoop, texIde].forEach((t) => t?.dispose());
    };
  }, [texStart, texInput, texTest, texCalc, texOutput, texYes, texNo, texLoop, texIde]);

  // Flow animation tick
  const handleTick = (dt: number) => {
    if (!photonMesh.current) return;
    photonProgress.current = (photonProgress.current + Math.min(dt, 0.05) * 1.8) % 1;
    const t = photonProgress.current;

    if (cur.node === "start") {
      photonMesh.current.position.set(posStart[0], posStart[1] - t * 0.95, 0.16);
    } else if (cur.node === "input") {
      photonMesh.current.position.set(posInput[0], posInput[1] - t * 1.0, 0.16);
    } else if (cur.node === "test") {
      if (trace[i + 1]?.node === "output") {
        photonMesh.current.position.set(posTest[0] - t * 1.85, posTest[1] - t * 0.95, 0.16);
      } else {
        photonMesh.current.position.set(posTest[0] + t * 1.9, posTest[1] - t * 0.95, 0.16);
      }
    } else if (cur.node === "calc") {
      if (t < 0.2) {
        photonMesh.current.position.set(posCalc[0], posCalc[1] - 0.45 - (t / 0.2) * 0.45, 0.16);
      } else if (t < 0.6) {
        const k = (t - 0.2) / 0.4;
        photonMesh.current.position.set(posCalc[0] - k * 3.1, -1.8, 0.16);
      } else if (t < 0.85) {
        const k = (t - 0.6) / 0.25;
        photonMesh.current.position.set(-3.7, -1.8 + k * 1.85, 0.16);
      } else {
        const k = (t - 0.85) / 0.15;
        photonMesh.current.position.set(-3.7 + k * 0.85, 0.05, 0.16);
      }
    } else {
      photonMesh.current.position.set(posOutput[0], posOutput[1], 0.16);
    }
  };

  return (
    <LabFrame
      label="Interactive 3D Flowchart and C Execution Simulator for Euclid's GCD Algorithm with live directional arrows, branch logic, and CPU register columns"
      camera={[0, 0.4, 7.6]}
      animated={true}
      onReset={reset}
      scene={() => (
        <group>
          <Tick fn={handleTick} />
          <Floor size={16} y={-2.4} divisions={16} />

          {/* ========================================================================= */}
          {/* 3D FLOWCHART WORKSTATION BACKBOARD */}
          {/* ========================================================================= */}
          <group position={[-2.5, 0.35, -0.4]}>
            <mesh position={[0, 0, -0.06]}>
              <boxGeometry args={[6.8, 5.0, 0.08]} />
              <meshStandardMaterial color="#111c24" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[6.6, 4.8]} />
              <meshStandardMaterial color="#081018" metalness={0.4} roughness={0.6} />
            </mesh>
          </group>

          {/* ========================================================================= */}
          {/* 3D CONDUITS AND DIRECTIONAL ARROWHEADS */}
          {/* ========================================================================= */}
          {/* Start -> Input */}
          <ConduitPipe pts={[[posStart[0], posStart[1] - 0.35, 0], [posInput[0], posInput[1] + 0.35, 0]]} color={C.green} glow={cur.node === "start" ? 0.7 : 0.15} />
          <FlowArrow from={[posStart[0], posStart[1] - 0.35, 0]} to={[posInput[0], posInput[1] + 0.35, 0]} color={C.green} active={cur.node === "start"} />

          {/* Input -> Test */}
          <ConduitPipe pts={[[posInput[0], posInput[1] - 0.35, 0], [posTest[0], posTest[1] + 0.45, 0]]} color={C.blue} glow={cur.node === "input" ? 0.7 : 0.15} />
          <FlowArrow from={[posInput[0], posInput[1] - 0.35, 0]} to={[posTest[0], posTest[1] + 0.45, 0]} color={C.blue} active={cur.node === "input"} />

          {/* Test -> Calc (NO Branch) */}
          <ConduitPipe
            pts={[
              [posTest[0] + 0.6, posTest[1], 0],
              [posCalc[0], posTest[1], 0],
              [posCalc[0], posCalc[1] + 0.45, 0],
            ]}
            color={C.orange}
            glow={cur.node === "test" && trace[i + 1]?.node === "calc" ? 0.8 : 0.15}
          />
          <FlowArrow
            from={[posCalc[0], posTest[1] - 0.15, 0]}
            to={[posCalc[0], posCalc[1] + 0.45, 0]}
            color={C.orange}
            active={cur.node === "test" && trace[i + 1]?.node === "calc"}
          />

          {/* Calc -> Loop Return */}
          <ConduitPipe
            pts={[
              [posCalc[0], posCalc[1] - 0.45, 0],
              [posCalc[0], -1.8, 0],
              [-3.7, -1.8, 0],
              [-3.7, posTest[1], 0],
              [posTest[0] - 0.6, posTest[1], 0],
            ]}
            color={C.gold}
            glow={cur.node === "calc" ? 0.85 : 0.2}
          />
          <FlowArrow
            from={[-3.35, posTest[1], 0]}
            to={[posTest[0] - 0.6, posTest[1], 0]}
            color={C.gold}
            active={cur.node === "calc"}
          />

          {/* Test -> Output (YES Branch) */}
          <ConduitPipe
            pts={[
              [posTest[0], posTest[1] - 0.45, 0],
              [posTest[0], posOutput[1], 0],
              [posOutput[0] + 0.85, posOutput[1], 0],
            ]}
            color={C.green}
            glow={cur.node === "test" && trace[i + 1]?.node === "output" ? 0.85 : 0.15}
          />
          <FlowArrow
            from={[posTest[0] - 0.5, posOutput[1], 0]}
            to={[posOutput[0] + 0.85, posOutput[1], 0]}
            color={C.green}
            active={cur.node === "test" && trace[i + 1]?.node === "output"}
          />

          {/* ========================================================================= */}
          {/* BRANCH DECISION BADGES */}
          {/* ========================================================================= */}
          <mesh position={[-1.0, 0.32, 0.05]}>
            <planeGeometry args={[0.75, 0.32]} />
            <meshBasicMaterial map={texNo} transparent />
          </mesh>

          <mesh position={[-3.35, -0.42, 0.05]}>
            <planeGeometry args={[0.75, 0.32]} />
            <meshBasicMaterial map={texYes} transparent />
          </mesh>

          <mesh position={[-2.1, -1.98, 0.05]}>
            <planeGeometry args={[0.8, 0.32]} />
            <meshBasicMaterial map={texLoop} transparent />
          </mesh>

          {/* ========================================================================= */}
          {/* 3D PHYSICAL FLOWCHART NODES */}
          {/* ========================================================================= */}
          {/* 1. START CAPSULE */}
          <group position={posStart}>
            <mesh position={[0, 0, -0.04]}>
              <boxGeometry args={[1.75, 0.65, 0.14]} />
              <meshStandardMaterial color={C.green} emissive={C.green} emissiveIntensity={cur.node === "start" ? 0.6 : 0.1} roughness={0.3} metalness={0.4} />
            </mesh>
            <mesh position={[0, 0, 0.04]}>
              <planeGeometry args={[1.75, 0.65]} />
              <meshBasicMaterial map={texStart} transparent />
            </mesh>
          </group>

          {/* 2. INPUT PARALLELOGRAM */}
          <group position={posInput}>
            <mesh position={[0, 0, -0.04]}>
              <boxGeometry args={[1.85, 0.68, 0.14]} />
              <meshStandardMaterial color={C.blue} emissive={C.blue} emissiveIntensity={cur.node === "input" ? 0.6 : 0.1} roughness={0.3} metalness={0.4} />
            </mesh>
            <mesh position={[0, 0, 0.04]}>
              <planeGeometry args={[1.85, 0.68]} />
              <meshBasicMaterial map={texInput} transparent />
            </mesh>
          </group>

          {/* 3. TEST DECISION DIAMOND */}
          <group position={posTest}>
            <mesh position={[0, 0, -0.06]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[1.15, 1.15, 0.15]} />
              <meshStandardMaterial color={C.gold} emissive={C.gold} emissiveIntensity={cur.node === "test" ? 0.7 : 0.15} roughness={0.25} metalness={0.6} />
            </mesh>
            <mesh position={[0, 0, 0.05]}>
              <planeGeometry args={[1.8, 0.8]} />
              <meshBasicMaterial map={texTest} transparent />
            </mesh>
          </group>

          {/* 4. CALC PROCESS BLOCK */}
          <group position={posCalc}>
            <mesh position={[0, 0, -0.04]}>
              <boxGeometry args={[1.9, 0.85, 0.14]} />
              <meshStandardMaterial color={C.purple} emissive={C.purple} emissiveIntensity={cur.node === "calc" ? 0.6 : 0.1} roughness={0.3} metalness={0.4} />
            </mesh>
            <mesh position={[0, 0, 0.04]}>
              <planeGeometry args={[1.9, 0.85]} />
              <meshBasicMaterial map={texCalc} transparent />
            </mesh>
          </group>

          {/* 5. OUTPUT & EXIT */}
          <group position={posOutput}>
            <mesh position={[0, 0, -0.04]}>
              <boxGeometry args={[1.8, 0.75, 0.14]} />
              <meshStandardMaterial color={C.red} emissive={C.red} emissiveIntensity={cur.node === "output" ? 0.6 : 0.1} roughness={0.3} metalness={0.4} />
            </mesh>
            <mesh position={[0, 0, 0.04]}>
              <planeGeometry args={[1.8, 0.75]} />
              <meshBasicMaterial map={texOutput} transparent />
            </mesh>
          </group>

          {/* ========================================================================= */}
          {/* ANIMATED EXECUTION PHOTON */}
          {/* ========================================================================= */}
          <mesh ref={photonMesh} position={[posStart[0], posStart[1], 0.16]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffff80" emissiveIntensity={1.8} />
          </mesh>

          {/* ========================================================================= */}
          {/* RIGHT WORKBENCH: C CODE IDE HUD + 3D VOLUMETRIC REGISTER TOWERS */}
          {/* ========================================================================= */}
          {/* 1. C Code IDE Window */}
          <group position={[2.8, 0.85, -0.3]}>
            <mesh position={[0, 0, 0.02]}>
              <planeGeometry args={[3.2, 2.78]} />
              <meshBasicMaterial map={texIde} transparent />
            </mesh>
          </group>

          {/* 2. Precision Volumetric Memory Register Columns */}
          <group position={[1.4, -1.2, 0]}>
            {/* Base Pedestal */}
            <mesh position={[1.4, -0.95, 0]}>
              <boxGeometry args={[3.4, 0.2, 1.4]} />
              <meshStandardMaterial color="#172733" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Variable A Register Column */}
            {(() => {
              const hA = Math.max(0.12, (cur.a / top) * 1.7);
              return (
                <group position={[0.55, -0.85, 0]}>
                  {/* Outer Glass Cylinder */}
                  <mesh position={[0, 0.85, 0]}>
                    <cylinderGeometry args={[0.42, 0.42, 1.75, 24]} />
                    <meshStandardMaterial color="#1a3a4f" transparent opacity={0.25} roughness={0.1} metalness={0.9} />
                  </mesh>
                  {/* Glowing Liquid Core */}
                  <mesh position={[0, hA / 2, 0]}>
                    <cylinderGeometry args={[0.36, 0.36, hA, 24]} />
                    <meshStandardMaterial color={C.blue} emissive={C.blue} emissiveIntensity={0.45} roughness={0.2} metalness={0.3} />
                  </mesh>
                  {/* Register Nameplate */}
                  <mesh position={[0, -0.05, 0.48]}>
                    <boxGeometry args={[0.8, 0.16, 0.04]} />
                    <meshStandardMaterial color="#0c1822" metalness={0.8} roughness={0.2} />
                  </mesh>
                </group>
              );
            })()}

            {/* Variable B Register Column */}
            {(() => {
              const hB = Math.max(0.12, (cur.b / top) * 1.7);
              return (
                <group position={[2.25, -0.85, 0]}>
                  {/* Outer Glass Cylinder */}
                  <mesh position={[0, 0.85, 0]}>
                    <cylinderGeometry args={[0.42, 0.42, 1.75, 24]} />
                    <meshStandardMaterial color="#3d2a1a" transparent opacity={0.25} roughness={0.1} metalness={0.9} />
                  </mesh>
                  {/* Glowing Liquid Core */}
                  <mesh position={[0, hB / 2, 0]}>
                    <cylinderGeometry args={[0.36, 0.36, hB, 24]} />
                    <meshStandardMaterial color={C.orange} emissive={C.orange} emissiveIntensity={0.45} roughness={0.2} metalness={0.3} />
                  </mesh>
                  {/* Register Nameplate */}
                  <mesh position={[0, -0.05, 0.48]}>
                    <boxGeometry args={[0.8, 0.16, 0.04]} />
                    <meshStandardMaterial color="#0c1822" metalness={0.8} roughness={0.2} />
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
      note={<p>A realistic 3D C Program Flowchart and CPU Register simulation of Euclid&apos;s GCD Algorithm. Green capsule: <code>START</code> / <code>main()</code>. Cyan parallelogram: <code>scanf()</code> input of variables <code>a</code> and <code>b</code>. Gold diamond: the decision condition (<code>b == 0?</code> for modulo, <code>a == b?</code> for subtraction) with labeled <strong>YES</strong> and <strong>NO</strong> branches. Purple block: calculation (<code>r = a % b; a = b; b = r;</code>) with directional 3D return arrows. Red capsule: <code>printf()</code> final output. The right-side C code monitor highlights the exact instruction running, while the memory towers display live register values.</p>}
    />
  );
}
