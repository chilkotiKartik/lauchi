"use client";
import Link from "next/link";
import { ListenButton } from "@/components/Voice";
import { VideoButton } from "@/components/Videos";
import { videoQuery } from "@/components/Coach";

const strip = (s: string) => s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

/** Read-aloud, a lecture and Ask Lochi for one reviewed answer. */
export function MistakeActions({ q, right, why, course, courseShort, unit, unitTitle, ok, mistake }: { q: string; right: string; why: string; course: string; courseShort: string; unit: number; unitTitle: string; ok: boolean; mistake?: string }) {
  const ask = `I got this ${courseShort} question wrong: "${strip(q).slice(0, 500)}". The right answer is ${strip(right)}. Explain it step by step.`;
  return (
    <div className="flex flex-wrap gap-2">
      <ListenButton text={`${q}. The answer is ${right}. ${why}`} label="Listen" />
      {!ok && <VideoButton query={videoQuery(unitTitle, courseShort, q)} label="Explainer" className="voice-btn" />}
      {!ok && <Link className="voice-btn no-underline" href={`/ask?course=${course}&unit=${unit}${mistake ? `&mistake=${encodeURIComponent(mistake)}` : ""}&q=${encodeURIComponent(ask)}`}>Ask Lochi why</Link>}
      {!ok && <Link className="voice-btn no-underline" href={`/learn/${course}/${unit}`}>Re-read Unit {unit}</Link>}
    </div>
  );
}
