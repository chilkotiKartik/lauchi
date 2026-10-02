"use client";
import { usePrefs, type Prefs } from "@/lib/prefs";
import { useState } from "react";
import { sfx, speak } from "@/lib/voice";

function Toggle({ label, hint, on, onChange }: { label: string; hint: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-12 items-center justify-between gap-4 rounded-2xl bg-soft p-3">
      <span><b className="block text-head">{label}</b><span className="text-sm text-muted">{hint}</span></span>
      <input type="checkbox" role="switch" checked={on} onChange={(e) => onChange(e.target.checked)} className="h-6 w-6 shrink-0 accent-[#1476b8]" />
    </label>
  );
}

const LANGS: { id: Prefs["lang"]; label: string }[] = [
  { id: "en-IN", label: "English (India)" }, { id: "hi-IN", label: "Hindi voice (हिन्दी)" }, { id: "en-US", label: "English (US)" }, { id: "en-GB", label: "English (UK)" },
];

/** Sound, voice and motion preferences (saved on this device). */
export function VoiceSettings() {
  const [p, set] = usePrefs();
  const [msg, setMsg] = useState("");
  return (
    <div className="grid gap-3">
      <Toggle label="Sound effects" hint="Little chimes for right answers, combos and level-ups." on={p.sound} onChange={(v) => { set({ sound: v }); if (v) setTimeout(() => sfx("correct"), 50); }} />
      <Toggle label="Lochi talks" hint="Lochi says &quot;Correct!&quot; or cheers you on out loud during quizzes." on={p.voice} onChange={(v) => set({ voice: v })} />
      <Toggle label="Calm mode" hint="Stops the moving background and bouncing icons." on={p.motion === "calm"} onChange={(v) => set({ motion: v ? "calm" : "full" })} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-sm font-extrabold text-head">Reading voice</span>
          <select className="field min-h-11" value={p.lang} onChange={(e) => set({ lang: e.target.value as Prefs["lang"] })}>
            {LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-sm font-extrabold text-head">Reading speed: {p.rate.toFixed(1)}×</span>
          <input type="range" min={0.6} max={1.6} step={0.1} value={p.rate} onChange={(e) => set({ rate: Number(e.target.value) })} className="h-11 accent-[#1476b8]" />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-ghost w-fit" onClick={() => setMsg(speak("Hi! I'm Lochi. Let's lock in and study.") ? "" : "This browser can't read aloud.")}>Test the voice</button>
        {msg && <span role="status" className="text-sm font-bold text-red-t">{msg}</span>}
      </div>
      <p className="text-xs text-muted">Read-aloud uses your device&apos;s own voices. Voice typing uses your browser&apos;s speech service (in Chrome and Edge that sends the audio to Google or Microsoft).</p>
    </div>
  );
}
