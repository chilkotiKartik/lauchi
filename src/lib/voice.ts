"use client";
/** Browser-only voice and sound: speech synthesis, speech recognition and tiny synthesised sound effects (no audio files). */
import { readPrefs } from "@/lib/prefs";
import { speakable } from "@/lib/speech-text";

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";

function voiceFor(lang: string): SpeechSynthesisVoice | undefined {
  const all = window.speechSynthesis.getVoices();
  return all.find((v) => v.lang === lang) ?? all.find((v) => v.lang.replace("_", "-").startsWith(lang.slice(0, 2)));
}

/** Reads text out loud with the student's speed and accent. Returns false when the browser has no speech engine. */
export function speak(text: string, opts: { onEnd?: () => void; force?: boolean } = {}): boolean {
  if (!canSpeak()) return false;
  const p = readPrefs();
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(speakable(text).slice(0, 4000));
  u.lang = p.lang; u.rate = p.rate; u.pitch = 1.05;
  const v = voiceFor(p.lang);
  if (v) u.voice = v;
  u.onend = () => opts.onEnd?.();
  u.onerror = () => opts.onEnd?.();
  synth.speak(u);
  return true;
}
export function stopSpeaking() { if (canSpeak()) window.speechSynthesis.cancel(); }

/** Short spoken reactions, only when the student switched voice on. */
const LINES = {
  correct: ["Correct!", "Nice one!", "Spot on!", "Shabash!", "That's it!"],
  wrong: ["Not quite. Let's see why.", "Close! Read the working.", "Almost. Check the steps."],
  combo: ["You're on fire!", "Three in a row!", "Unstoppable!"],
  done: ["Quiz finished. Well done for showing up!"],
  levelup: ["Level up! Keep going!"],
} as const;
export function sayReaction(kind: keyof typeof LINES, n = 0) {
  if (!readPrefs().voice) return;
  const l = LINES[kind];
  speak(l[n % l.length]);
}

// ---------------------------------------------------------------- sound effects

let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  try { ctx ??= new AC(); } catch { return null; }
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  return ctx;
}
function tone(a: AudioContext, freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.12) {
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, a.currentTime + start);
  g.gain.setValueAtTime(0.0001, a.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, a.currentTime + start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
  o.connect(g).connect(a.destination);
  o.start(a.currentTime + start); o.stop(a.currentTime + start + dur + 0.02);
}
export type Sfx = "correct" | "wrong" | "combo" | "levelup" | "tap" | "finish" | "tick";
/** Plays a short synthesised effect if the student has sound on. Never throws. */
export function sfx(kind: Sfx) {
  if (!readPrefs().sound) return;
  const a = audio();
  if (!a) return;
  try {
    switch (kind) {
      case "correct": tone(a, 660, 0, 0.12, "triangle"); tone(a, 990, 0.09, 0.22, "triangle"); break;
      case "wrong": tone(a, 220, 0, 0.18, "sine", 0.1); tone(a, 185, 0.12, 0.26, "sine", 0.08); break;
      case "combo": [523, 659, 784, 1047].forEach((f, i) => tone(a, f, i * 0.07, 0.16, "triangle", 0.1)); break;
      case "levelup": [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(a, f, i * 0.08, 0.22, "square", 0.05)); break;
      case "finish": [523, 784, 1047].forEach((f, i) => tone(a, f, i * 0.12, 0.3, "triangle", 0.1)); break;
      case "tick": tone(a, 1200, 0, 0.04, "square", 0.03); break;
      default: tone(a, 880, 0, 0.05, "sine", 0.06);
    }
  } catch { /* audio is a nice-to-have */ }
}

// ---------------------------------------------------------------- speech recognition

export type Rec = { lang: string; interimResults: boolean; maxAlternatives: number; continuous: boolean; start(): void; stop(): void; abort(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null; onend: (() => void) | null };
type RecCtor = new () => Rec;
export function recognitionCtor(): RecCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecCtor; webkitSpeechRecognition?: RecCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}
export const canListen = () => recognitionCtor() !== null;
