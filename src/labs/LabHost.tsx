"use client";
import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LabLoader } from "./LabLoader";
import { LabParamsProvider } from "./params";
import { noteLivePreset, noteLiveReset, registerLiveReset, setLiveParams } from "./live-store";
import { encodeParams, type Params } from "./params-core";
import type { LabPreset } from "./types";
import { deleteSetup, saveSetup } from "@/app/(app)/labs/actions";

export type SavedSetup = { id: string; name: string; params: Params };

/** Wraps a lab: ready-made experiments, saved setups (in the student's account) and share links. */
export function LabHost({ id, presets, saved, initial }: { id: string; presets: LabPreset[]; saved: SavedSetup[]; initial: Params | null }) {
  const router = useRouter();
  const [run, setRun] = useState<{ key: number; values: Params | null; label: string | null }>({ key: 0, values: initial, label: initial ? "Shared setup" : null });
  const current = useRef<Params>({});
  const report = useCallback((p: Params) => { current.current = p; setLiveParams(id, p); }, [id]);
  const bus = useMemo(() => ({ onReset: () => noteLiveReset(id), register: (fn: () => void) => registerLiveReset(id, fn) }), [id]);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const load = (values: Params, label: string) => { noteLivePreset(id, label); setRun((r) => ({ key: r.key + 1, values, label })); setMsg(null); setLink(null); };
  const share = async () => {
    const url = `${location.origin}/labs/${id}?v=${encodeParams(current.current)}`;
    setLink(url);
    try { await navigator.clipboard.writeText(url); setMsg({ ok: true, text: "Link copied. Anyone signed in can open these exact values." }); }
    catch { setMsg({ ok: true, text: "Copy this link to share these exact values." }); }
  };
  const save = () => start(async () => {
    const r = await saveSetup({ lab: id, name, params: current.current });
    if (r.ok) { setNaming(false); setName(""); setMsg({ ok: true, text: "Saved to your account." }); router.refresh(); }
    else setMsg({ ok: false, text: r.error });
  });

  const toolbar = (
    <>
      <button type="button" className="btn btn-ghost" onClick={() => { setNaming(!naming); setMsg(null); }} aria-expanded={naming}>Save setup</button>
      <button type="button" className="btn btn-ghost" onClick={share}>Share</button>
      {naming && (
        <form className="flex basis-full flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <label className="sr-only" htmlFor={`setup-name-${id}`}>Setup name</label>
          <input id={`setup-name-${id}`} className="field max-w-xs flex-1" placeholder="Name this setup" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <button className="btn" disabled={pending || !name.trim()}>{pending ? "Saving…" : "Save"}</button>
        </form>
      )}
      {msg && <p role={msg.ok ? "status" : "alert"} className={`basis-full ${msg.ok ? "ok" : "err"}`}>{msg.text}</p>}
      {link && <input readOnly aria-label="Share link" className="field basis-full text-sm" value={link} onFocus={(e) => e.currentTarget.select()} />}
      {(presets.length > 0 || saved.length > 0) && (
        <div className="grid basis-full gap-3 rounded-2xl border-2 border-line bg-soft p-3">
          {presets.length > 0 && (
            <div className="grid gap-2">
              <p className="text-xs font-black uppercase tracking-wide text-muted">Try these experiments</p>
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <button key={p.name} type="button" className="pill !px-3 hover:border-blue" aria-pressed={run.label === p.name} onClick={() => load(p.values, p.name)}>{p.name}</button>
                ))}
              </div>
            </div>
          )}
          {saved.length > 0 && (
            <div className="grid gap-2">
              <p className="text-xs font-black uppercase tracking-wide text-muted">Your saved setups</p>
              <ul className="flex flex-wrap gap-2">
                {saved.map((s) => (
                  <li key={s.id} className="pill !p-0">
                    <button type="button" className="rounded-l-full py-1 pl-3 pr-2 font-black text-head" aria-pressed={run.label === s.name} onClick={() => load(s.params, s.name)}>{s.name}</button>
                    <button type="button" aria-label={`Delete setup ${s.name}`} className="rounded-r-full border-l-2 border-line px-2 py-1 text-muted hover:text-red-t"
                      onClick={() => start(async () => { await deleteSetup({ id: s.id, lab: id }); router.refresh(); })}>×</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {run.label && <p className="text-sm text-head" role="status"><b>Now showing:</b> {run.label}{presets.find((p) => p.name === run.label) ? ` — ${presets.find((p) => p.name === run.label)!.note}` : ""}</p>}
        </div>
      )}
    </>
  );

  return (
    <LabParamsProvider key={run.key} initial={run.values} report={report} toolbar={toolbar} bus={bus}>
      <LabLoader id={id} />
    </LabParamsProvider>
  );
}
