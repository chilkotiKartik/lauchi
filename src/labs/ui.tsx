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

/** Common lab layout: stage + play/pause + controls + readouts + humanized explanation tabs. */
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
  const [manual, setManual] = useState<boolean | null>(null);
  const [showRecord, setShowRecord] = useState(false);
  const [activeTab, setActiveTab] = useState<"physics" | "analogy" | "procedure" | "viva">("physics");
  const [openVivaIdx, setOpenVivaIdx] = useState<number | null>(null);

  const playing = animated && (manual ?? !rm);
  const toolbar = useLabToolbar();

  const defaultSteps = steps ?? [
    "Step 1: Set initial parameters using the sliders above and observe the base 3D simulation state.",
    "Step 2: Modify individual variables (wavelength, voltage, force, concentration) to see dynamic response.",
    "Step 3: Track real-time numerical telemetry in the readouts table above to verify physical equations.",
    "Step 4: Rotate the apparatus in 3D (click and drag) to inspect boundary conditions from all angles.",
    "Step 5: Generate your university practical record report using the 'Lab Record' button.",
  ];

  return (
    <div className="grid gap-4">
      {/* 3D Simulation Stage */}
      <div className="sticky top-2 z-10 lg:static">
        <Stage label={label} playing={playing} camera={camera}>{scene(playing)}</Stage>
      </div>

      {animated && rm && manual === null && (
        <p role="note" className="rounded-xl bg-soft px-3 py-2 text-sm font-semibold text-muted">
          Animation is paused because your device asks for reduced motion. Press Play to run it.
        </p>
      )}

      {/* Interactive Controls for Direct Visual Feedback */}
      <div className="card grid gap-3.5 border-2 border-line bg-surface p-4 shadow-md md:grid-cols-2">
        <div className="flex items-center justify-between border-b border-line/60 pb-2 md:col-span-2">
          <span className="text-xs font-black uppercase tracking-wider text-head flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue" />
            Live Parameters &amp; Sliders
          </span>
          <span className="text-xs font-bold text-muted">Real-time simulation feedback</span>
        </div>
        {controls}
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {animated && (
          <button type="button" className="btn btn-blue" aria-pressed={playing} onClick={() => setManual(!playing)}>
            {playing ? "Pause" : "Play"}
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={() => { onReset(); setManual(null); }}>
          Reset
        </button>
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

      {/* Numerical Telemetry Readouts */}
      <Readouts items={readouts} />

      {/* Humanized Tabbed Concept Breakdown */}
      <div className="card overflow-hidden border-2 border-line bg-surface p-0 shadow-lg">
        {/* Navigation Tabs */}
        <div className="flex border-b border-line bg-soft/50 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("physics")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider transition-colors shrink-0 ${
              activeTab === "physics"
                ? "border-b-2 border-blue bg-surface text-blue"
                : "text-muted hover:text-head"
            }`}
          >
            🔬 Physics &amp; Theory
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("analogy")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider transition-colors shrink-0 ${
              activeTab === "analogy"
                ? "border-b-2 border-blue bg-surface text-blue"
                : "text-muted hover:text-head"
            }`}
          >
            💡 Real-World Intuition
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("procedure")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider transition-colors shrink-0 ${
              activeTab === "procedure"
                ? "border-b-2 border-blue bg-surface text-blue"
                : "text-muted hover:text-head"
            }`}
          >
            📋 Practical Manual
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("viva")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider transition-colors shrink-0 ${
              activeTab === "viva"
                ? "border-b-2 border-blue bg-surface text-blue"
                : "text-muted hover:text-head"
            }`}
          >
            🎯 Viva Voce Q&amp;A
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 text-[0.95rem] leading-relaxed text-body">
          {activeTab === "physics" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-blue" />
                Underlying Engineering Principles &amp; Mathematical Model
              </div>
              <div className="leading-relaxed">{note}</div>
            </div>
          )}

          {activeTab === "analogy" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-500">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                How To Picture This In Everyday Life
              </div>
              {intuition ? (
                <div>{intuition}</div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <p>
                    Imagine this phenomenon as an everyday physical balance: when you change the inputs above, you are observing nature conserve fundamental quantities like energy, momentum, or wave phase.
                  </p>
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-head font-medium">
                    <b>💡 Real-World Takeaway:</b> In real engineering design (aerospace wings, structural bridges, electronic circuits, optical fibers), engineers simulate these exact differential equations before fabricating physical hardware to avoid costly material failure.
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "procedure" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Step-By-Step Laboratory Manual &amp; Observations
              </div>
              <ol className="flex flex-col gap-2">
                {defaultSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 rounded-xl border border-line bg-soft/60 p-3 text-xs font-medium text-head">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue font-black text-white text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="flex-1">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {activeTab === "viva" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-purple-400">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                University External Examiner Viva Voce Prep
              </div>
              <div className="flex flex-col gap-2">
                {(viva ?? [
                  [
                    "What is the main objective of this experiment?",
                    `To experimentally verify the physical laws governing ${label.toLowerCase()} and calculate key parameter coefficients using quantitative observation telemetry.`,
                  ],
                  [
                    "How do changes in the parameters affect the output?",
                    "The system responds according to standard governing equations shown in the Theory tab, causing proportional scaling or phase shifting in the simulated apparatus.",
                  ],
                  [
                    "What are the major sources of error in a physical version of this lab?",
                    "Environmental resistance, calibration inaccuracy, parallax error in reading analog scales, and thermal fluctuations in material properties.",
                  ],
                ]).map(([q, a], idx) => {
                  const isOpen = openVivaIdx === idx;
                  return (
                    <div key={idx} className="overflow-hidden rounded-xl border border-line bg-soft/50">
                      <button
                        type="button"
                        onClick={() => setOpenVivaIdx(isOpen ? null : idx)}
                        className="flex w-full items-center justify-between p-3.5 text-left text-xs font-black text-head hover:bg-soft"
                      >
                        <span>Q{idx + 1}: {q}</span>
                        <span className="text-muted ml-2">{isOpen ? "▲" : "▼"}</span>
                      </button>
                      {isOpen && (
                        <div className="border-t border-line/60 bg-surface p-3.5 text-xs text-muted leading-relaxed">
                          <b className="text-emerald-400">Answer:</b> {a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

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
