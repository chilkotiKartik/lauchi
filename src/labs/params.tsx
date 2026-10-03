"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { clampParams, type ParamSpec, type Params, type Values } from "./params-core";
import type { Readout, SliderInfo } from "./challenge";

export { num, opt, flag, clampParams } from "./params-core";
export type { ParamSpec, Params, Values } from "./params-core";

/** What the page knows about the lab: used to write a lab-specific practical manual instead of generic text. */
export type LabGuide = { title: string; topics: string[]; presets: { name: string; note: string }[] };
type Ctx = { initial: Params | null; report: (p: Params) => void; toolbar?: ReactNode; guide?: LabGuide; /** Lets the experiment panel see Reset presses and trigger a reset. */ bus?: LabBus };
/** How a running lab talks to the page around it: Reset presses, and what it shows (for the in-lab tasks). */
export type LabBus = { onReset: () => void; register: (fn: () => void) => () => void; readouts?: (r: Readout[]) => void; slider?: (s: SliderInfo) => void };
const LabParamsCtx = createContext<Ctx>({ initial: null, report: () => {} });
/** Extra buttons (save, share) the lab host puts next to Play / Reset. */
export const useLabToolbar = () => useContext(LabParamsCtx).toolbar ?? null;
export const useLabGuide = () => useContext(LabParamsCtx).guide ?? null;
export const useLabBus = () => useContext(LabParamsCtx).bus ?? null;

export function LabParamsProvider({ initial, report, toolbar, guide, bus, children }: Ctx & { children: ReactNode }) {
  return <LabParamsCtx.Provider value={{ initial, report, toolbar, guide, bus }}>{children}</LabParamsCtx.Provider>;
}

/**
 * A lab's adjustable values. Starts from the page's preset / saved setup / share link (validated and clamped
 * against the spec, so a crafted link cannot pass absurd values), and reports every change to the lab host.
 */
export function useLabParams<S extends ParamSpec>(spec: S): [Values<S>, <K extends keyof S>(k: K, v: Values<S>[K]) => void, () => void] {
  const ctx = useContext(LabParamsCtx);
  const specRef = useRef(spec);
  const [p, setP] = useState<Values<S>>(() => clampParams(spec, ctx.initial));
  const { report, bus } = ctx;
  useEffect(() => { report(p as Params); }, [p, report]);
  useEffect(() => bus?.register(() => setP(clampParams(specRef.current, null))), [bus]);
  const set = <K extends keyof S>(k: K, v: Values<S>[K]) => setP((old) => clampParams(specRef.current, { ...(old as Params), [k]: v as Params[string] }));
  const reset = () => { bus?.onReset(); setP(clampParams(specRef.current, null)); };
  return [p, set, reset];
}
