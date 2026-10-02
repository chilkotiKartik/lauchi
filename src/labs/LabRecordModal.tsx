"use client";
import { useState } from "react";

export interface LabObservation {
  id: string;
  time: string;
  readouts: [string, string][];
  snapshot?: string;
}

export function LabRecordModal({
  title,
  label,
  readouts,
  isOpen,
  onClose,
}: {
  title: string;
  label: string;
  readouts: [string, string][];
  isOpen: boolean;
  onClose: () => void;
}) {
  const [observations, setObservations] = useState<LabObservation[]>([]);

  const addObservation = () => {
    // Try to capture WebGL canvas snapshot if present
    let snapshot: string | undefined;
    try {
      const canvas = document.querySelector("canvas");
      if (canvas) {
        snapshot = canvas.toDataURL("image/png");
      }
    } catch {
      // ignore security origin errors
    }

    const obs: LabObservation = {
      id: Math.random().toString(36).slice(2, 9),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      readouts: [...readouts],
      snapshot,
    };
    setObservations((prev) => [...prev, obs]);
  };

  const clearObservations = () => {
    setObservations([]);
  };

  const printReport = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="card max-h-[90vh] w-full max-w-3xl overflow-y-auto border-2 border-line bg-surface p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
          <div>
            <span className="rounded-full bg-blue/10 px-3 py-1 text-xs font-black text-blue-t">UNIVERSITY PRACTICAL RECORD</span>
            <h2 className="mt-1 text-2xl font-black text-head">{title || "Virtual Experiment"}</h2>
            <p className="text-xs text-muted">{label}</p>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost text-lg">✕</button>
        </div>

        {/* Live Observation Actions */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <button type="button" onClick={addObservation} className="btn btn-blue text-sm">
              📸 Record Current Trial Reading
            </button>
            {observations.length > 0 && (
              <button type="button" onClick={clearObservations} className="btn btn-ghost text-sm text-red-t">
                Clear Readings
              </button>
            )}
          </div>
          {observations.length > 0 && (
            <button type="button" onClick={printReport} className="btn btn-green text-sm">
              🖨️ Print / Save as PDF
            </button>
          )}
        </div>

        {/* Observations Table */}
        <div className="mt-6">
          <h3 className="text-base font-black text-head">Observation Table ({observations.length} Recorded Trials)</h3>
          {observations.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
              No readings recorded yet. Adjust your sliders in the 3D lab and click <b>&ldquo;Record Current Trial Reading&rdquo;</b> to capture your experiment data.
            </div>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-soft text-xs font-black uppercase text-muted">
                  <tr>
                    <th className="p-3">Trial #</th>
                    <th className="p-3">Timestamp</th>
                    {observations[0]?.readouts.map(([k]) => (
                      <th key={k} className="p-3">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {observations.map((obs, idx) => (
                    <tr key={obs.id} className="hover:bg-soft/40">
                      <td className="p-3 font-bold text-head">{idx + 1}</td>
                      <td className="p-3 text-xs text-muted">{obs.time}</td>
                      {obs.readouts.map(([k, v]) => (
                        <td key={k} className="p-3 font-mono font-bold tabular-nums text-blue-t">{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 3D Snapshots Gallery */}
        {observations.some((o) => !!o.snapshot) && (
          <div className="mt-6">
            <h3 className="text-base font-black text-head">Experiment Apparatus Snapshots</h3>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {observations.filter((o) => !!o.snapshot).map((obs, i) => (
                <div key={obs.id} className="overflow-hidden rounded-xl border border-line bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={obs.snapshot} alt={`Trial ${i + 1}`} className="aspect-video w-full object-cover" />
                  <div className="p-2 text-center text-xs font-bold text-muted">Trial {i + 1} ({obs.time})</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t border-line pt-4">
          <button type="button" onClick={onClose} className="btn btn-ghost">Close</button>
        </div>
      </div>
    </div>
  );
}
