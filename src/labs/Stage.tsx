"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
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

/** Studio 3D Canvas with realistic radial gradient backdrop, studio lighting, and smooth orbit controls */
export function Stage({ label, playing, camera = [5, 4, 6], variant = "lab", size = "small", children }: StageProps) {
  const cap = useCapability();
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [lost, setLost] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const quality: Quality = cap === "ok-low" ? "low" : "high";

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
              onCreated={({ gl, invalidate }) => {
                gl.toneMapping = THREE.ACESFilmicToneMapping;
                gl.toneMappingExposure = 1.18;
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

              {/* Laboratory Studio Lighting Setup */}
              <ambientLight color="#e2f1fa" intensity={variant === "hero" ? 1.0 : 0.85} />
              {/* Main Key Light */}
              <directionalLight position={[8, 14, 8]} intensity={variant === "hero" ? 1.8 : 1.5} color="#ffffff" castShadow={false} />
              {/* Cool Blue Fill Light */}
              <directionalLight position={[-8, 6, -6]} intensity={0.65} color="#7dd3fc" />
              {/* Warm Rim Light */}
              <directionalLight position={[0, -6, -8]} intensity={0.35} color="#fef08a" />
              {/* Center Specular Accent */}
              <pointLight position={[0, 9, 0]} intensity={0.45} color="#38bdf8" distance={24} />

              {/* Precision Laboratory Floor Grid */}
              {variant === "lab" && (
                <gridHelper args={[36, 36, "#38bdf8", "#162b38"]} position={[0, -0.01, 0]} />
              )}

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

            {/* Premium HUD Overlay Pill */}
            {variant === "lab" && (
              <div className="pointer-events-none absolute bottom-3.5 left-3.5 flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/75 px-3 py-1.5 text-xs font-extrabold text-slate-200 backdrop-blur-md shadow-lg">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                <span>360° Studio Orbit · Scroll to Zoom</span>
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
