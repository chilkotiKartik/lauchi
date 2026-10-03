"use client";
import { useId, useState, type ReactNode } from "react";
import { Stage, useReducedMotion } from "./Stage";
import { useLabGuide, useLabToolbar } from "./params";
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

export interface LabFrameProps {
  label: string;
  camera?: [number, number, number];
  scene: (playing: boolean) => ReactNode;
  controls: ReactNode;
  readouts: [string, string][];
  note: ReactNode;
  onReset: () => void;
  animated?: boolean;
  intuition?: ReactNode;
  steps?: string[];
  viva?: [string, string][];
}

type Tab = "theory" | "intuition" | "procedure" | "viva";

/** A practical manual written from this lab's own experiments and readouts (never generic filler). */
export function buildSteps(o: { presets: { name: string; note: string }[]; readouts: string[]; animated: boolean; topics?: string[] }): string[] {
  const shown = o.readouts.slice(0, 4).join(", ");
  const steps = [`Start from the default setup and write down the readouts${shown ? ` (${shown})` : ""} as your first observation.`];
  if (o.presets.length) {
    o.presets.forEach((p, i) => steps.push(`Experiment ${i + 1}: press “${p.name}” under Try these experiments. ${p.note.replace(/\s*$/, "")}${/[.!?]$/.test(p.note.trim()) ? "" : "."} Note how each readout changed.`));
  } else {
    steps.push("Change one control at a time across its full range, keeping the others fixed, and note which readouts move and in which direction.");
  }
  if (o.topics?.length) steps.push(`Link what you saw to the syllabus: ${o.topics.slice(0, 3).join("; ")}.`);
  steps.push(o.animated ? "Pause the animation at an interesting moment and drag to view the apparatus from the side and from above." : "Drag to view the apparatus from the side and from above.");
  steps.push("Open Lab Record to copy your final readings into your practical file.");
  return steps;
}

/** Common lab layout: stage + play/pause + controls + readouts + explanation tabs that only show real, lab-specific content. */
export function LabFrame({
  label,
  camera,
  scene,
  controls,
  readouts,
  note,
  onReset,
  animated = true,
  intuition,
  steps,
  viva,
}: LabFrameProps) {
  const rm = useReducedMotion();
  const guide = useLabGuide();
  const [manual, setManual] = useState<boolean | null>(null);
  const [showRecord, setShowRecord] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("theory");
  const [openVivaIdx, setOpenVivaIdx] = useState<number | null>(null);

  const playing = animated && (manual ?? !rm);
  const toolbar = useLabToolbar();
  const manualSteps = steps ?? buildSteps({ presets: guide?.presets ?? [], readouts: readouts.map(([k]) => k), animated, topics: guide?.topics });
  const tabs: [Tab, string][] = [["theory", "Theory"], ...(intuition ? [["intuition", "Intuition"] as [Tab, string]] : []), ["procedure", "Procedure"], ...(viva?.length ? [["viva", "Viva"] as [Tab, string]] : [])];

  return (
    <div className="grid gap-4">
      <div className="sticky top-2 z-10 lg:static">
        <Stage label={label} playing={playing} camera={camera}>{scene(playing)}</Stage>
      </div>

      {animated && rm && manual === null && (
        <p role="note" className="rounded-xl bg-soft px-3 py-2 text-sm font-semibold text-muted">
          Animation is paused because your device asks for reduced motion. Press Play to run it.
        </p>
      )}

      <div className="card grid gap-3.5 border-2 border-line bg-surface p-4 md:grid-cols-2">
        <p className="border-b border-line/60 pb-2 text-xs font-black uppercase tracking-wider text-muted md:col-span-2">Controls</p>
        {controls}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {animated && (
          <button type="button" className="btn btn-blue" aria-pressed={playing} onClick={() => setManual(!playing)}>
            {playing ? "Pause" : "Play"}
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={() => { onReset(); setManual(null); }}>
          Reset
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setShowRecord(true)} title="Write these readings up as a practical record">
          Lab Record
        </button>
        {toolbar}
      </div>

      <Readouts items={readouts} />

      <div className="card overflow-hidden border-2 border-line bg-surface p-0">
        <div role="tablist" aria-label="About this lab" className="flex overflow-x-auto border-b border-line bg-soft/50">
          {tabs.map(([id, name]) => (
            <button key={id} type="button" role="tab" aria-selected={activeTab === id} onClick={() => setActiveTab(id)}
              className={`shrink-0 px-4 py-3 text-xs font-black uppercase tracking-wider transition-colors ${activeTab === id ? "border-b-2 border-blue bg-surface text-blue" : "text-muted hover:text-head"}`}>
              {name}
            </button>
          ))}
        </div>

        <div role="tabpanel" className="p-5 text-[0.95rem] leading-relaxed text-body">
          {activeTab === "theory" && <div className="grid gap-3 leading-relaxed">{note}</div>}
          {activeTab === "intuition" && intuition && <div>{intuition}</div>}
          {activeTab === "procedure" && (
            <ol className="grid gap-2">
              {manualSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2.5 rounded-xl border border-line bg-soft/60 p-3 text-sm font-medium text-head">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue text-[10px] font-black text-white">{idx + 1}</span>
                  <span className="flex-1">{step}</span>
                </li>
              ))}
            </ol>
          )}
          {activeTab === "viva" && viva && (
            <div className="grid gap-2">
              {viva.map(([q, a], idx) => {
                const isOpen = openVivaIdx === idx;
                return (
                  <div key={idx} className="overflow-hidden rounded-xl border border-line bg-soft/50">
                    <button type="button" aria-expanded={isOpen} onClick={() => setOpenVivaIdx(isOpen ? null : idx)}
                      className="flex w-full items-center justify-between p-3.5 text-left text-sm font-black text-head hover:bg-soft">
                      <span>Q{idx + 1}. {q}</span>
                      <span className="ml-2 text-muted" aria-hidden>{isOpen ? "▲" : "▼"}</span>
                    </button>
                    {isOpen && <div className="border-t border-line/60 bg-surface p-3.5 text-sm leading-relaxed text-muted"><b className="text-head">Answer:</b> {a}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <LabRecordModal
        title={guide?.title || "Practical record"}
        label={label}
        readouts={readouts}
        isOpen={showRecord}
        onClose={() => setShowRecord(false)}
      />
    </div>
  );
}
