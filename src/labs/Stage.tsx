"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
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

/** Catches anything thrown while the 3D view starts (no GPU context, a chunk that failed to load) so one lab can never take the page down. */
export class Guard extends Component<{ children: ReactNode; what?: string }, { failed: boolean; tries: number; msg: string }> {
  state = { failed: false, tries: 0, msg: "" };
  static getDerivedStateFromError(e: unknown) { return { failed: true, msg: e instanceof Error ? e.message : String(e) }; }
  render() {
    if (!this.state.failed) return <div key={this.state.tries} className="contents">{this.props.children}</div>;
    return (
      <Fallback>
        <div className="grid max-w-md gap-3">
          <p className="text-lg text-head">The 3D view couldn&apos;t start.</p>
          <p className="text-sm font-semibold">{this.props.what ?? "The controls and numbers below still work."} Usually this is your browser&apos;s graphics acceleration: turn on <b>hardware acceleration</b> in the browser settings (Chrome: Settings → System), close other heavy tabs, then try again.</p>
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

/** Labs are framed for a wide screen; on a tall phone screen the sides get cut off, so pull the camera back to fit. */
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

/** Canvas that pauses when off-screen, stops looping when paused, and caps DPR. */
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
    <div ref={host} role="img" aria-label={label} className={variant === "hero" ? (size === "big" ? "relative h-full w-full" : "relative h-56 w-56") : "relative h-[52vh] min-h-72 w-full overflow-hidden rounded-2xl border-2 border-line bg-[#0f1a20] md:h-[62vh]"} data-testid="lab-stage" data-visible={visible} data-playing={playing}>
      {cap === null ? (
        <Fallback>Loading 3D…</Fallback>
      ) : cap === "none" ? (
        <Fallback>Your browser can&apos;t run WebGL, so the live 3D view is unavailable. The controls and numbers below still work in a browser with WebGL.</Fallback>
      ) : (
        <Q.Provider value={quality}>
          <Guard>
          <Canvas
            onCreated={({ gl, invalidate }) => {
              gl.domElement.addEventListener("webglcontextlost", (e) => { e.preventDefault(); setLost(true); });
              gl.domElement.addEventListener("webglcontextrestored", () => { setLost(false); invalidate(); });
            }}
            frameloop={!visible ? "never" : playing ? "always" : "demand"}
            dpr={quality === "low" ? 1 : [1, 1.5]}
            camera={{ position: camera, fov: 45 }}
            gl={{ antialias: quality === "high", powerPreference: "default", preserveDrawingBuffer: true }}
          >
            <ambientLight intensity={0.8} />
            <directionalLight position={[4, 6, 3]} intensity={1.4} />
            {variant === "lab" && <OrbitControls enableDamping={false} makeDefault />}
            {variant === "lab" && <Fit base={camera} />}
            {children}
          </Canvas>
          </Guard>
          {lost && <div role="status" className="absolute inset-0 grid place-items-center bg-[#0f1a20]/90 p-6 text-center font-bold text-white">Your graphics driver reset the 3D view. It will come back on its own in a moment.</div>}
        </Q.Provider>
      )}
    </div>
  );
}

/** Per-frame callback; must be rendered inside the Canvas (inside a LabFrame `scene`). */
export function Tick({ fn }: { fn: (dt: number) => void }) {
  const r = useRef(fn);
  useLayoutEffect(() => { r.current = fn; });
  useFrame((_, dt) => r.current(dt));
  return null;
}
