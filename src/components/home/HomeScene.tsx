"use client";
import dynamic from "next/dynamic";
import { Suspense, useEffect, useRef, useState } from "react";
import { useCapability, useReducedMotion } from "@/labs/capability";
import { SceneFallback } from "./SceneFallback";
import { litOrbs } from "./data";
import "@/components/home3d.css";

const Scene = dynamic(() => import("./HomeScene3D"), { ssr: false });

export interface HomeSceneProps {
  week: number[];
  names: string[];
  todayXp: number;
  goal: number;
  streak: number;
  level: number;
  levelInto: number;
  levelSpan: number;
  quote: string;
}

const SLOTS = 10;

/**
 * The lock-in scene. Server-rendered as a flat illustration (so first paint is plain markup);
 * the 3D scene is fetched only after the card scrolls into view and the page has settled.
 * Stays flat for reduced motion or when WebGL is unavailable. Pauses when off-screen or the tab is hidden.
 */
export function HomeScene(p: HomeSceneProps) {
  const cap = useCapability();
  const reduced = useReducedMotion();
  const host = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [seen, setSeen] = useState(false);
  const [tabOn, setTabOn] = useState(true);

  useEffect(() => {
    const el = host.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => {
      setInView(e.isIntersecting);
      if (e.isIntersecting) setSeen(true);
    }, { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const on = () => setTabOn(!document.hidden);
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);

  const lit = litOrbs(p.todayXp, p.goal, SLOTS);
  const pct = p.levelSpan > 0 ? Math.min(1, p.levelInto / p.levelSpan) : 0;
  const live = (cap === "ok-high" || cap === "ok-low") && !reduced && seen;
  const label = `3D scene of your progress. ${lit} of ${SLOTS} orbs are lit for today's goal of ${p.goal} XP. The ring shows ${Math.round(pct * 100)}% of the way to level ${p.level + 1}. Blocks show XP for the last 7 days: ${p.names.map((n, i) => `${n} ${p.week[i]}`).join(", ")}.`;
  const flat = <SceneFallback week={p.week} names={p.names} lit={lit} slots={SLOTS} />;

  return (
    <section className="h3d-card" aria-label="Your lock-in scene">
      <div ref={host} role="img" aria-label={label} className="h3d-stage" data-testid="home3d" data-mode={live ? "live" : "static"}>
        {live ? (
          <Suspense fallback={flat}>
            <Scene data={{ week: p.week, lit, slots: SLOTS, levelPct: pct }} active={inView && tabOn} quality={cap === "ok-low" ? 0 : 1} />
          </Suspense>
        ) : flat}
      </div>
      <div className="h3d-caption">
        <div className="min-w-0 flex-1 basis-60">
          <p className="h3d-eyebrow">Your lock-in scene</p>
          <p className="h3d-quote">“{p.quote}”</p>
        </div>
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          <li className="h3d-chip">Streak <b>{p.streak}</b></li>
          <li className="h3d-chip">Goal <b>{p.todayXp}/{p.goal}</b> XP</li>
          <li className="h3d-chip">Level <b>{p.level}</b></li>
        </ul>
      </div>
    </section>
  );
}
