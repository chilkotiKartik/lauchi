"use client";
import Link from "next/link";
import { VideoButton } from "@/components/Videos";
import { Lochi } from "@/components/Lochi";

/** What the coach can point to for this quiz's unit (computed on the server). */
export type CoachInfo = { course: string; courseName: string; unit: number; unitTitle: string; labs: { id: string; title: string }[]; pyq: boolean };

const TIPS = [
  "Mistakes are where the marks hide. Fixing this one now is worth more than three easy right answers.",
  "Read the working once, then try the next one without looking. That's how it sticks.",
  "Slow is smooth, smooth is fast. Write the formula first, then put numbers in.",
  "Toppers get questions wrong too. They just come back to them.",
  "Check units and powers of ten first. Half of all numerical slips live there.",
];
const strip = (s: string) => s.replace(/<[^>]*>/g, " ").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();
/** A short search phrase: the unit title plus the first meaningful words of the question. */
export function videoQuery(unitTitle: string, courseName: string, q: string) {
  const words = strip(q).replace(/[^\p{L}\p{N}\s'-]/gu, " ").split(/\s+/).filter((w) => w.length > 3 && !/^\d/.test(w)).slice(0, 6).join(" ");
  return `${unitTitle} ${words} ${courseName}`.replace(/\s+/g, " ").trim().slice(0, 110);
}

/** Shown after a wrong answer: one encouraging line and four ways to fix the gap right now. */
export function Coach({ info, question, right, mistake }: { info: CoachInfo; question: string; right: string; mistake?: string }) {
  const tip = TIPS[strip(question).length % TIPS.length];
  const ask = `I got this ${info.courseName} question wrong: "${strip(question).slice(0, 500)}". The right answer is ${strip(right)}. Explain it step by step, and tell me the common mistake.`;
  return (
    <div className="coach" aria-label="Fix it now">
      <div className="coach-tip"><Lochi mood="thinking" size={40} /><span>{tip}</span></div>
      <p className="text-xs font-black uppercase tracking-wide text-muted">Fix it now</p>
      <div className="coach-row">
        <VideoButton query={videoQuery(info.unitTitle, info.courseName, question)} label="Watch an explainer" className="voice-btn" />
        <Link className="voice-btn no-underline" href={`/learn/${info.course}/${info.unit}`}>Re-read Unit {info.unit}</Link>
        {info.labs.slice(0, 1).map((l) => <Link key={l.id} className="voice-btn no-underline" href={`/labs/${l.id}`}>See it in 3D: {l.title}</Link>)}
        {info.pyq && <Link className="voice-btn no-underline" href={`/pyq?course=${info.course}&unit=${info.unit}`}>Exam PYQs on this</Link>}
        <Link className="voice-btn no-underline" href={`/ask?course=${info.course}&unit=${info.unit}${mistake ? `&mistake=${encodeURIComponent(mistake)}` : ""}&q=${encodeURIComponent(ask)}`}>Ask Lochi why</Link>
      </div>
    </div>
  );
}
