"use client";
import { useSyncExternalStore } from "react";
import type { Params } from "./params-core";
import type { Readout, SliderInfo } from "./challenge";

/** The running lab's live state, published by useLabParams / LabHost and read by the experiment panel. */
export type LiveLab = { params: Params | null; resets: number; presets: number; lastPreset: string | null; readouts: Readout[]; sliders: SliderInfo[] };
const EMPTY: LiveLab = { params: null, resets: 0, presets: 0, lastPreset: null, readouts: [], sliders: [] };

const state = new Map<string, LiveLab>();
const resetFns = new Map<string, () => void>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const patch = (id: string, p: Partial<LiveLab>) => { state.set(id, { ...(state.get(id) ?? EMPTY), ...p }); emit(); };

export const setLiveParams = (id: string, params: Params) => patch(id, { params });
/** What the lab is showing right now (published by LabFrame), so tasks can compare before and after a change. */
export function setLiveReadouts(id: string, readouts: Readout[]) {
  const old = (state.get(id) ?? EMPTY).readouts;
  if (old.length === readouts.length && old.every(([k, v], i) => k === readouts[i][0] && v === readouts[i][1])) return;
  patch(id, { readouts });
}
/** A slider's label, range and value (published by each Slider), in the order the lab shows them. */
export function setLiveSlider(id: string, s: SliderInfo) {
  const list = (state.get(id) ?? EMPTY).sliders;
  const i = list.findIndex((x) => x.label === s.label);
  const old = list[i];
  if (old && old.value === s.value && old.min === s.min && old.max === s.max && old.step === s.step) { old.set = s.set; return; } // keep the newest setter, no re-render
  patch(id, { sliders: i < 0 ? [...list, s] : list.map((x, j) => (j === i ? s : x)) });
}
export const noteLiveReset = (id: string) => patch(id, { resets: (state.get(id) ?? EMPTY).resets + 1 });
export const noteLivePreset = (id: string, name: string) => patch(id, { presets: (state.get(id) ?? EMPTY).presets + 1, lastPreset: name });
/** The running lab registers a function that puts its values back to the defaults (without counting as a student Reset). */
export const registerLiveReset = (id: string, fn: () => void) => { resetFns.set(id, fn); return () => { if (resetFns.get(id) === fn) resetFns.delete(id); }; };
/** Reset the running lab to its defaults. Returns false when no lab is mounted. */
export function requestLiveReset(id: string): boolean { const f = resetFns.get(id); if (!f) return false; f(); return true; }

const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };
export const useLiveLab = (id: string): LiveLab => useSyncExternalStore(subscribe, () => state.get(id) ?? EMPTY, () => EMPTY);
