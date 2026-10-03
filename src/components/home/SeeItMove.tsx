"use client";
import dynamic from "next/dynamic";
import { Suspense, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { CountUp } from "@/components/motion";
import { useCapability, useReducedMotion } from "@/labs/capability";
import type { WaveControl } from "./WaveSurface3D";
import "@/components/home3d.css";

const Surface = dynamic(() => import("./WaveSurface3D"), { ssr: false });

function Flat() {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 bg-gradient-to-br from-green/5 via-blue/5 to-purple/5">
      <svg className="h-full w-full max-h-60" viewBox="0 0 300 200" aria-hidden data-testid="sim-fallback">
        <defs>
          <linearGradient id="waveGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#58cc02" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#1cb0f6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ffc83d" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        {[18, 36, 54, 72, 90].map((r, i) => (
          <ellipse key={r} cx="150" cy="100" rx={r * 1.55} ry={r * 0.75} fill="none" stroke="url(#waveGrad)" strokeWidth="3" strokeOpacity={1 - i * 0.16} />
        ))}
        <circle cx="150" cy="100" r="7" fill="#ffd24d" />
      </svg>
    </div>
  );
}

export interface Stat { label: string; value: number }

/** Landing section: a real ripple surface you can turn and re-tune, plus counts read from the app's own registries. */
export function SeeItMove({ stats }: { stats: Stat[] }) {
  const cap = useCapability();
  const reduced = useReducedMotion();
  const host = useRef<HTMLDivElement>(null);
  const control = useRef<WaveControl>({ k: 3, yaw: 0.5 });
  const drag = useRef<number | null>(null);
  const [k, setK] = useState(3);
  const [inView, setInView] = useState(true);
  const [seen, setSeen] = useState(false);
  const [tabOn, setTabOn] = useState(true);

  useEffect(() => {
    setSeen(true);
    const el = host.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => { setInView(e.isIntersecting); }, { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    const on = () => setTabOn(!document.hidden);
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);

  const live = (cap === "ok-high" || cap === "ok-low") && !reduced && seen;
  const down = (e: PointerEvent) => { drag.current = e.clientX; e.currentTarget.setPointerCapture(e.pointerId); };
  const move = (e: PointerEvent) => { if (drag.current === null) return; control.current.yaw += (e.clientX - drag.current) * 0.012; drag.current = e.clientX; };
  const up = () => { drag.current = null; };
  const key = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") { control.current.yaw -= 0.2; e.preventDefault(); }
    if (e.key === "ArrowRight") { control.current.yaw += 0.2; e.preventDefault(); }
  };

  return (
    <section className="mx-auto max-w-6xl px-5 py-10" aria-labelledby="move-h">
      <div className="h3d-card grid gap-6 p-5 sm:p-8 md:grid-cols-2 md:items-center">
        <div className="flex flex-col gap-4">
          <p className="h3d-eyebrow">Try it right here</p>
          <h2 id="move-h" className="text-3xl text-head sm:text-4xl">See it move</h2>
          <p className="text-muted leading-relaxed">
            Formulas stop being scary when you can turn them around. This ripple is drawn from <b className="text-head font-extrabold font-mono bg-soft px-1.5 py-0.5 rounded-lg border border-line">z = sin(k·r − 2t) / (1 + 0.35·r)</b>. Change k and the waves tighten. Every lab in lockin. works the same way.
          </p>
          {live && (
            <label className="flex flex-col gap-1 text-sm font-extrabold text-head">
              <span>Wave number k: <output className="text-[#58cc02]" data-testid="sim-k">{k.toFixed(1)}</output></span>
              <input type="range" aria-label="Wave number k" min={1} max={6} step={0.1} value={k} className="w-full max-w-xs accent-[#58cc02]"
                onChange={(e) => { const v = Number(e.target.value); control.current.k = v; setK(v); }} />
            </label>
          )}
          <ul className="m-0 grid list-none grid-cols-3 gap-3 p-0" aria-label="What is inside">
            {stats.map((s) => (
              <li key={s.label} className="rounded-2xl border-2 border-line bg-soft p-3">
                <p className="stat-big text-head"><CountUp value={s.value} /></p>
                <p className="mt-1 text-xs font-black text-muted">{s.label}</p>
              </li>
            ))}
          </ul>
        </div>
        <div ref={host} role="group" tabIndex={live ? 0 : -1} aria-label={live ? "Interactive 3D ripple surface. Drag sideways or use the left and right arrow keys to turn it." : "Ripple surface picture"}
          className={`h3d-stage sim-drag rounded-2xl border-2 border-line bg-soft/50 ${live ? "" : "pointer-events-none"}`} data-testid="sim" data-mode={live ? "live" : "static"}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key}>
          {live ? (
            <Suspense fallback={<Flat />}><Surface control={control} active={inView && tabOn} quality={cap === "ok-low" ? 0 : 1} /></Suspense>
          ) : <Flat />}
        </div>
      </div>
    </section>
  );
}
