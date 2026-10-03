"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls, PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { useCapability } from "./capability";
import { Component, createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

export type Quality = "high" | "low";
const Q = createContext<Quality>("high");
/** Scenes read this to reduce geometry counts on weak devices. */
export const useQuality = () => useContext(Q);

export { useCapability, useReducedMotion } from "./capability";

export function Fallback({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="grid h-full place-items-center p-6 text-center font-bold text-muted">
      {children}
    </div>
  );
}

/** Catches anything thrown while the 3D view starts so one lab can never take the page down. */
export class Guard extends Component<{ children: ReactNode; what?: string }, { failed: boolean; tries: number; msg: string }> {
  state = { failed: false, tries: 0, msg: "" };
  static getDerivedStateFromError(e: unknown) { return { failed: true, msg: e instanceof Error ? e.message : String(e) }; }
  render() {
    if (!this.state.failed) return <div key={this.state.tries} className="contents">{this.props.children}</div>;
    return (
      <Fallback>
        <div className="grid max-w-md gap-3">
          <p className="text-lg text-head">The 3D view couldn&apos;t start.</p>
          <p className="text-sm font-semibold">{this.props.what ?? "The controls and numbers below still work."} Turn on <b>hardware acceleration</b> in browser settings, close heavy tabs, then try again.</p>
          <p className="break-words text-xs opacity-70">{this.state.msg.slice(0, 160)}</p>
          <button type="button" className="btn btn-blue mx-auto" onClick={() => this.setState((s) => ({ failed: false, tries: s.tries + 1, msg: "" }))}>Try again</button>
        </div>
      </Fallback>
    );
  }
}

interface StageProps {
  label: string;
  playing: boolean;
  camera?: [number, number, number];
  variant?: "lab" | "hero";
  size?: "small" | "big";
  children: ReactNode;
}

/** Fits the camera smoothly on mobile/narrow viewports */
function Fit({ base }: { base: [number, number, number] }) {
  const { camera, size, invalidate } = useThree();
  const controls = useThree((st) => st.controls) as { update?: () => void } | null;
  const factor = Math.min(2.4, Math.max(1, 1.3 / (size.width / Math.max(1, size.height))));
  const [bx, by, bz] = base;
  useEffect(() => {
    camera.position.set(bx * factor, by * factor, bz * factor);
    controls?.update?.();
    invalidate();
  }, [camera, controls, factor, bx, by, bz, invalidate]);
  return null;
}

// ------------------------------------------------------------------ snapshots
const capturers = new WeakMap<HTMLCanvasElement, () => string>();
/** A JPEG of the canvas as it looks now. The drawing buffer is not preserved (faster), so a fresh frame is rendered first. */
export function captureCanvas(canvas: HTMLCanvasElement | null): string | undefined {
  const f = canvas ? capturers.get(canvas) : undefined;
  try { return f ? f() : undefined; } catch { return undefined; }
}

// ------------------------------------------------------------------ lag guard
// If a device can't hold a smooth frame rate while a lab animates, every canvas drops to the light mode (DPR 1, no soft
// shadows, no reflection map) for the rest of the visit, instead of stuttering. Remembered for the browser session.
let slowDevice: boolean | null = null;
function isSlow() {
  if (slowDevice === null) { try { slowDevice = sessionStorage.getItem("lockin-3d-light") === "1"; } catch { slowDevice = false; } }
  return slowDevice;
}
function markSlow() { slowDevice = true; try { sessionStorage.setItem("lockin-3d-light", "1"); } catch { /* private mode */ } }

// ------------------------------------------------------------------ studio environment
/** Image-based lighting from a procedurally built studio room (three's RoomEnvironment): metals, glass and plastics get
 * real reflections and soft fill light. Built once per canvas on the GPU, no files or network, so it is cheap and CSP-safe. */
function StudioEnvironment({ intensity }: { intensity: number }) {
  const get = useThree((st) => st.get);
  useEffect(() => {
    const { gl, scene, invalidate } = get();
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const target = pmrem.fromScene(room, 0.04);
    scene.environment = target.texture;
    scene.environmentIntensity = intensity;
    invalidate();
    return () => {
      if (scene.environment === target.texture) scene.environment = null;
      target.dispose();
      room.traverse((o) => { const m = o as THREE.Mesh; m.geometry?.dispose(); (m.material as THREE.Material | undefined)?.dispose?.(); });
      pmrem.dispose();
    };
  }, [get, intensity]);
  return null;
}

/** The lab bench under every apparatus: a matte top that catches soft contact shadows, with a faint measuring grid. */
const BENCH_Y = -2.85;
function Bench({ shadows }: { shadows: boolean }) {
  return (
    <group position={[0, BENCH_Y, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        {/* far larger than the fog distance, so its edge is never seen */}
        <circleGeometry args={[90, 64]} />
        <meshStandardMaterial color="#0a1419" roughness={0.95} metalness={0} />
      </mesh>
      <gridHelper args={[24, 24, "#1a3342", "#112029"]} position={[0, 0.002, 0]} />
      {shadows && <ContactShadows position={[0, 0.006, 0]} scale={22} resolution={256} blur={2.2} far={9} opacity={0.5} color="#000000" />}
    </group>
  );
}

/** Studio 3D canvas: image-based lighting, a key light, soft contact shadows on a bench, and smooth orbit controls. */
export function Stage({ label, playing, camera = [5, 4, 6], variant = "lab", size = "small", children }: StageProps) {
  const cap = useCapability();
  const host = useRef<HTMLDivElement>(null);
  // Render only while the canvas is on screen AND the tab is in front (two separate signals; either one pauses it).
  const [inView, setInView] = useState(true);
  const [tabShown, setTabShown] = useState(true);
  const visible = inView && tabShown;
  const [lost, setLost] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const onVis = () => setTabShown(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const [degraded, setDegraded] = useState(isSlow);
  const quality: Quality = cap === "ok-low" || degraded ? "low" : "high";

  return (
    <div
      ref={host}
      role="img"
      aria-label={label}
      className={
        variant === "hero"
          ? size === "big"
            ? "relative h-full w-full"
            : "relative h-56 w-56"
          : "relative h-[54vh] min-h-[340px] w-full overflow-hidden rounded-3xl border-2 border-line bg-gradient-to-b from-[#14232c] via-[#0b141a] to-[#04080c] shadow-2xl md:h-[64vh]"
      }
      data-testid="lab-stage"
      data-visible={visible}
      data-playing={playing}
    >
      {/* Top Studio Illumination Vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(56,189,248,0.12),transparent_70%)]" />

      {cap === null ? (
        <Fallback>Loading 3D Laboratory…</Fallback>
      ) : cap === "none" ? (
        <Fallback>Your browser can&apos;t run WebGL. The interactive controls and real-time readouts below remain fully functional.</Fallback>
      ) : (
        <Q.Provider value={quality}>
          <Guard>
            <Canvas
              onCreated={({ gl, invalidate, get }) => {
                gl.toneMapping = THREE.ACESFilmicToneMapping;
                gl.toneMappingExposure = 1.1;
                capturers.set(gl.domElement, () => { const st = get(); gl.render(st.scene, st.camera); return gl.domElement.toDataURL("image/jpeg", 0.85); });
                gl.domElement.addEventListener("webglcontextlost", (e) => {
                  e.preventDefault();
                  setLost(true);
                });
                gl.domElement.addEventListener("webglcontextrestored", () => {
                  setLost(false);
                  invalidate();
                });
              }}
              frameloop={!visible ? "never" : playing ? "always" : "demand"}
              dpr={quality === "low" ? 1 : [1, 1.25]}
              camera={{ position: camera, fov: 45 }}
              gl={{
                antialias: quality === "high",
                powerPreference: "high-performance",
                preserveDrawingBuffer: false,
                stencil: false,
                alpha: true,
              }}
            >
              {/* Atmospheric Studio Horizon Fog for realistic depth */}
              <fog attach="fog" args={["#081016", 12, 36]} />

              {/* Watch the real frame rate only while animating (an on-demand canvas renders too rarely to measure) */}
              {playing && visible && quality === "high" && (
                <PerformanceMonitor flipflops={2} onDecline={() => { markSlow(); setDegraded(true); }} onFallback={() => { markSlow(); setDegraded(true); }} />
              )}
              {/* Lighting: image-based studio fill (high quality) + one warm key light + a cool rim, like a real photo studio */}
              {quality === "high" && <StudioEnvironment intensity={variant === "hero" ? 0.7 : 0.55} />}
              <ambientLight color="#e2f1fa" intensity={quality === "high" ? 0.35 : 0.85} />
              <directionalLight position={[8, 14, 8]} intensity={variant === "hero" ? 1.6 : 1.35} color="#fff6ea" />
              <directionalLight position={[-8, 6, -6]} intensity={0.5} color="#9fd8ff" />
              {quality === "low" && <directionalLight position={[0, -6, -8]} intensity={0.3} color="#fef08a" />}

              {variant === "lab" && <Bench shadows={quality === "high"} />}

              {/* Orbit Controls */}
              {variant === "lab" && (
                <OrbitControls
                  enableDamping
                  dampingFactor={0.08}
                  makeDefault
                  minDistance={2}
                  maxDistance={30}
                />
              )}
              {variant === "lab" && <Fit base={camera} />}
              {children}
            </Canvas>

            {variant === "lab" && (
              <div className="pointer-events-none absolute bottom-3 left-3 rounded-xl bg-slate-950/70 px-2.5 py-1 text-[11px] font-bold text-slate-300">
                Drag to rotate · scroll or pinch to zoom
              </div>
            )}
          </Guard>
          {lost && (
            <div role="status" className="absolute inset-0 grid place-items-center bg-[#091118]/90 p-6 text-center font-bold text-white">
              Graphics driver reset the 3D context. Reconnecting…
            </div>
          )}
        </Q.Provider>
      )}
    </div>
  );
}

/** Per-frame callback inside Canvas scene */
export function Tick({ fn }: { fn: (dt: number) => void }) {
  const r = useRef(fn);
  useLayoutEffect(() => {
    r.current = fn;
  });
  useFrame((_, dt) => r.current(dt));
  return null;
}
