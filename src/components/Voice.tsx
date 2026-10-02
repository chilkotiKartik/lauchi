"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { canListen, canSpeak, recognitionCtor, speak, stopSpeaking, type Rec } from "@/lib/voice";
import { readPrefs } from "@/lib/prefs";

const noop = () => () => {};
/** True only in the browser, after hydration, when the feature exists (so server and client markup agree). */
function useSupported(test: () => boolean) {
  return useSyncExternalStore(noop, test, () => false);
}

function Speaker({ on }: { on: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" stroke="none" />
      {on ? <><path d="M16 9a4 4 0 0 1 0 6" className="wave1" /><path d="M18.5 6.5a8 8 0 0 1 0 11" className="wave2" /></> : <path d="M16 9a4 4 0 0 1 0 6" />}
    </svg>
  );
}

/** "Listen" button: reads the given text aloud (question, answer, lesson, PYQ). Hidden where the browser can't speak. */
export function ListenButton({ text, label = "Listen", className = "" }: { text: string; label?: string; className?: string }) {
  const ok = useSupported(canSpeak);
  const [on, setOn] = useState(false);
  useEffect(() => () => { if (on) stopSpeaking(); }, [on]);
  if (!ok) return null;
  return (
    <button type="button" className={`voice-btn ${on ? "is-on" : ""} ${className}`} aria-pressed={on} aria-label={on ? "Stop reading" : `${label}: read aloud`}
      onClick={() => { if (on) { stopSpeaking(); setOn(false); } else { setOn(speak(text, { onEnd: () => setOn(false) })); } }}>
      <Speaker on={on} /><span>{on ? "Stop" : label}</span>
    </button>
  );
}

function Mic() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" stroke="none" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}

/** Microphone button: speech → text. Chrome and Edge send the audio to their own speech service; we say so in the tooltip. */
export function MicButton({ onText, label = "Speak", className = "", lang }: { onText: (t: string) => void; label?: string; className?: string; lang?: string }) {
  const ok = useSupported(canListen);
  const [state, setState] = useState<"idle" | "listening" | "error">("idle");
  const [msg, setMsg] = useState("");
  const rec = useRef<Rec | null>(null);
  useEffect(() => () => rec.current?.abort(), []);
  if (!ok) return null;
  function start() {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    if (state === "listening") { rec.current?.stop(); return; }
    const r = new Ctor();
    r.lang = lang ?? readPrefs().lang; r.interimResults = false; r.maxAlternatives = 1; r.continuous = false;
    r.onresult = (e) => { const t = e.results[0]?.[0]?.transcript ?? ""; if (t) onText(t.trim()); };
    r.onerror = (e) => { setState("error"); setMsg(e.error === "not-allowed" ? "Microphone blocked. Allow it in your browser's site settings." : e.error === "no-speech" ? "Didn't hear anything. Try again." : "Voice input isn't available right now."); };
    r.onend = () => setState((s) => (s === "error" ? s : "idle"));
    rec.current = r;
    setMsg(""); setState("listening");
    try { r.start(); } catch { setState("error"); setMsg("Voice input isn't available right now."); }
  }
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" onClick={start} className={`voice-btn ${state === "listening" ? "is-on is-rec" : ""} ${className}`} aria-pressed={state === "listening"}
        aria-label={state === "listening" ? "Stop listening" : `${label}: answer by voice`} title="Uses your browser's speech service">
        <Mic /><span>{state === "listening" ? "Listening…" : label}</span>
      </button>
      {msg && <span role="status" className="text-xs font-bold text-red-t">{msg}</span>}
    </span>
  );
}
