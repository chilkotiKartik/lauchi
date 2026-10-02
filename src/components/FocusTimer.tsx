"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Lochi } from "@/components/Lochi";
import { Confetti } from "@/components/motion";
import { useLocalJson } from "@/lib/local-store";
import { readPrefs } from "@/lib/prefs";
import { sfx, speak } from "@/lib/voice";
import { BOOSTS } from "@/lib/motivation";

type Mode = "focus" | "short" | "long";
const MODES: { id: Mode; label: string; min: number }[] = [{ id: "focus", label: "Focus", min: 25 }, { id: "short", label: "Short break", min: 5 }, { id: "long", label: "Long break", min: 15 }];
type Log = Record<string, { n: number; min: number }>;
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const fmt = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; };

/** Brown noise made on the fly (no audio file): a gentle "rain/fan" background. */
function useNoise() {
  const ref = useRef<{ ctx: AudioContext; src: AudioBufferSourceNode; gain: GainNode } | null>(null);
  const stop = () => { if (ref.current) { try { ref.current.src.stop(); void ref.current.ctx.close(); } catch { /* already stopped */ } ref.current = null; } };
  const start = () => {
    stop();
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return false;
    const ctx = new AC(), len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900;
    const gain = ctx.createGain(); gain.gain.value = 0.35;
    src.connect(lp).connect(gain).connect(ctx.destination); src.start();
    ref.current = { ctx, src, gain };
    return true;
  };
  useEffect(() => stop, []);
  return { start, stop };
}

export function FocusTimer() {
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<Mode>("focus");
  const [mins, setMins] = useState(25);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [left, setLeft] = useState(25 * 60_000);
  const [goal, setGoal] = useState("");
  const [noise, setNoise] = useState(false);
  const [celebrate, setCelebrate] = useState(0);
  const [log, setLog] = useLocalJson<Log>("lockin.focus", {});
  const n = useNoise();
  const total = mins * 60_000;
  const running = endAt !== null;
  const quote = BOOSTS[(celebrate * 7 + mins) % BOOSTS.length];

  useEffect(() => {
    if (endAt === null) return;
    const id = setInterval(() => {
      const ms = endAt - Date.now();
      setLeft(ms);
      if (ms <= 0) {
        clearInterval(id);
        setEndAt(null); setLeft(0);
        sfx("finish");
        if (mode === "focus") {
          const d = today(), cur = log[d] ?? { n: 0, min: 0 };
          setLog({ ...log, [d]: { n: cur.n + 1, min: cur.min + mins } });
          setCelebrate((c) => c + 1);
          if (readPrefs().voice || readPrefs().sound) speak("Great focus session! Take a five minute break. You earned it.");
        } else if (readPrefs().voice) speak("Break's over. Let's lock in again.");
      }
    }, 250);
    return () => clearInterval(id);
  }, [endAt, mode, mins, log, setLog]);

  useEffect(() => {
    const base = "Focus · lockin.";
    document.title = running ? `${fmt(left)} ${mode === "focus" ? "focus" : "break"} · lockin.` : base;
    return () => { document.title = base; };
  }, [left, running, mode]);

  function pickMode(m: Mode) { const x = MODES.find((y) => y.id === m)!; setMode(m); setMins(x.min); setEndAt(null); setLeft(x.min * 60_000); }
  function toggle() {
    sfx("tap");
    if (running) { setLeft(endAt - Date.now()); setEndAt(null); }
    else setEndAt(Date.now() + (left > 0 ? left : total));
  }
  function reset() { setEndAt(null); setLeft(total); }

  const frac = Math.min(1, Math.max(0, 1 - left / total));
  const R = 118, Cc = 2 * Math.PI * R;
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; return { k, label: d.toLocaleDateString("en-IN", { weekday: "short" }), v: log[k]?.min ?? 0 }; });
  const maxDay = Math.max(25, ...days.map((d) => d.v));
  const t = log[today()] ?? { n: 0, min: 0 };
  const color = mode === "focus" ? "#44c95a" : mode === "short" ? "#2ba6f5" : "#a970ff";

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      {celebrate > 0 && <Confetti key={celebrate} pieces={36} />}
      <section className="card flex flex-col items-center gap-5 text-center" aria-label="Timer">
        <div role="radiogroup" aria-label="Timer mode" className="flex flex-wrap justify-center gap-2">
          {MODES.map((m) => <button key={m.id} type="button" role="radio" aria-checked={mode === m.id} className={`seg ${mode === m.id ? "is-on" : ""}`} onClick={() => pickMode(m.id)}>{m.label}</button>)}
        </div>
        <div className={`relative grid place-items-center ${running && !reduce ? "breathe" : ""}`}>
          <svg width="280" height="280" viewBox="0 0 280 280" className="focus-ring" aria-hidden>
            <circle cx="140" cy="140" r={R} fill="none" stroke="var(--line)" strokeWidth="16" />
            <circle cx="140" cy="140" r={R} fill="none" stroke={color} strokeWidth="16" strokeLinecap="round" strokeDasharray={Cc} strokeDashoffset={Cc * (1 - frac)} />
          </svg>
          <div className="absolute flex flex-col items-center gap-1">
            <Lochi mood={left <= 0 ? "celebrate" : running ? (mode === "focus" ? "thinking" : "sleep") : "idle"} size={74} />
            <p className="text-5xl font-black tabular-nums text-head" role="timer" aria-live="off" aria-label="Time left">{fmt(left)}</p>
            <p className="text-sm font-extrabold uppercase tracking-wide text-muted">{mode === "focus" ? "Focus" : "Break"}</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" className="btn min-w-36" onClick={toggle}>{running ? "Pause" : left < total && left > 0 ? "Resume" : "Start"}</button>
          <button type="button" className="btn btn-ghost" onClick={reset}>Reset</button>
          <button type="button" className={`voice-btn ${noise ? "is-on" : ""}`} aria-pressed={noise} onClick={() => { if (noise) { n.stop(); setNoise(false); } else setNoise(n.start()); }}>{noise ? "Calm sound on" : "Calm sound"}</button>
        </div>
        {!running && (
          <label className="grid w-full max-w-sm gap-1 text-left">
            <span className="text-sm font-extrabold text-head">Length: {mins} minutes</span>
            <input type="range" min={5} max={60} step={5} value={mins} onChange={(e) => { const v = Number(e.target.value); setMins(v); setLeft(v * 60_000); }} className="h-11 accent-[#1476b8]" />
          </label>
        )}
        <label className="grid w-full max-w-sm gap-1 text-left">
          <span className="text-sm font-extrabold text-head">This session I will…</span>
          <input className="field" value={goal} maxLength={120} placeholder="e.g. finish Unit 2 numericals" onChange={(e) => setGoal(e.target.value)} />
        </label>
        <AnimatePresence mode="wait">
          <motion.blockquote key={quote} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-md text-lg font-black text-head">“{quote}”</motion.blockquote>
        </AnimatePresence>
      </section>
      <aside className="flex flex-col gap-4">
        <section className="card flex flex-col gap-2" aria-label="Today">
          <h2 className="text-lg">Today</h2>
          <p className="text-3xl font-black text-head">{t.min} <span className="text-base text-muted">minutes</span></p>
          <p className="text-muted">{t.n} focus {t.n === 1 ? "session" : "sessions"} finished</p>
        </section>
        <section className="card" aria-label="Last 7 days">
          <h2 className="mb-3 text-lg">Last 7 days</h2>
          <ul className="flex h-36 items-end gap-2">
            {days.map((d) => (
              <li key={d.k} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[11px] font-black tabular-nums text-muted">{d.v || ""}</span>
                <span className="w-full rounded-t-lg" style={{ height: `${Math.max(4, (d.v / maxDay) * 100)}px`, background: d.v ? "linear-gradient(180deg,#44c95a,#2fa046)" : "var(--line)" }} />
                <span className="text-[11px] font-bold text-muted">{d.label}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="card text-sm text-muted">The timer keeps going if you switch tabs. Focus minutes are saved on this device only and don&apos;t earn XP, so nobody can farm them.</section>
      </aside>
    </div>
  );
}
