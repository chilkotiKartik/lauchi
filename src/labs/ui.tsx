"use client";
import { useId, useState, type ReactNode } from "react";
import { Stage, useReducedMotion } from "./Stage";
import { useLabToolbar } from "./params";
import { LabRecordModal } from "./LabRecordModal";

export function Slider({ label, value, min, max, step = 0.01, onChange, unit = "", digits = 2 }: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string; digits?: number;
  onChange: (v: number) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const v = parseFloat(draft.replace("−", "-"));
    if (Number.isFinite(v)) onChange(Math.min(max, Math.max(min, v)));
    setDraft(null);
  };
  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-extrabold text-head">{label}</label>
        <span className="flex items-center gap-1 text-sm font-black text-blue-t">
          <input type="text" inputMode="decimal" aria-label={`${label}: type an exact value (${min} to ${max})`} title={`${min} to ${max}`}
            className="w-20 rounded-lg border-2 border-line bg-soft px-2 py-1 text-right tabular-nums text-head focus:border-blue focus:outline-none"
            value={draft ?? String(Number(value.toFixed(digits)))}
            onChange={(e) => setDraft(e.target.value)} onBlur={commit}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(); } if (e.key === "Escape") setDraft(null); }} />
          {unit && <span aria-hidden>{unit.trim()}</span>}
        </span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-8 w-full accent-[#1476b8]" />
    </div>
  );
}

export function Pick<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  const id = useId();
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="text-sm font-extrabold text-head">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)} className="field min-h-11">
        {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-11 items-center gap-3 text-sm font-extrabold text-head">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-[#1476b8]" />{label}
    </label>
  );
}

export function Readouts({ items }: { items: [string, string][] }) {
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3" data-testid="readouts">
      {items.map(([k, v]) => (
        <div key={k} className="card p-3">
          <dt className="text-xs font-extrabold uppercase tracking-wide text-muted">{k}</dt>
          <dd className="text-lg font-black tabular-nums text-head">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Common lab layout: stage + play/pause + controls + readouts + explanation. */
export function LabFrame({ label, camera, scene, controls, readouts, note, onReset, animated = true }: {
  label: string; camera?: [number, number, number]; scene: (playing: boolean) => ReactNode;
  controls: ReactNode; readouts: [string, string][]; note: ReactNode; onReset: () => void; animated?: boolean;
}) {
  const rm = useReducedMotion();
  const [manual, setManual] = useState<boolean | null>(null);
  const [showRecord, setShowRecord] = useState(false);
  const playing = animated && (manual ?? !rm);
  const toolbar = useLabToolbar();
  return (
    <div className="grid gap-4">
      <Stage label={label} playing={playing} camera={camera}>{scene(playing)}</Stage>
      {animated && rm && manual === null && <p role="note" className="rounded-xl bg-soft px-3 py-2 text-sm font-semibold text-muted">Animation is paused because your device asks for reduced motion. Press Play to run it.</p>}
      <div className="flex flex-wrap items-center gap-2">
        {animated && (
          <button type="button" className="btn btn-blue" aria-pressed={playing} onClick={() => setManual(!playing)}>{playing ? "Pause" : "Play"}</button>
        )}
        <button type="button" className="btn btn-ghost" onClick={() => { onReset(); setManual(null); }}>Reset</button>
        <button
          type="button"
          className="btn btn-ghost border border-line bg-surface text-head hover:bg-soft"
          onClick={() => setShowRecord(true)}
          title="Open University Practical Record & PDF Report Generator"
        >
          📑 Lab Record / Report
        </button>
        {toolbar}
      </div>
      <Readouts items={readouts} />
      <div className="card grid gap-3 p-4 md:grid-cols-2">{controls}</div>
      <div className="card p-4 text-[0.95rem] leading-relaxed text-body">{note}</div>

      <LabRecordModal
        title="Engineering & Science Practical Record"
        label={label}
        readouts={readouts}
        isOpen={showRecord}
        onClose={() => setShowRecord(false)}
      />
    </div>
  );
}
