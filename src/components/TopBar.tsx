import { CountUp } from "@/components/motion";
import { ArtBolt, ArtFlame, ArtTarget } from "@/components/art";

export function TopBar({ streak, xp, goalPct, level }: { streak: number; xp: number; goalPct: number; level: number }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2" aria-label="Your stats" role="group">
      <span className="pill" title="Day streak"><ArtFlame size={26} /><CountUp value={streak} /><span className="sr-only"> day streak</span></span>
      <span className="pill" title="Total XP"><ArtBolt size={26} /><CountUp value={xp} /><span className="sr-only"> total XP</span></span>
      <span className="pill" title="Level"><span className="grid h-[26px] min-w-[26px] place-items-center rounded-full bg-[#7a3fd6] px-1 text-[11px] font-black text-white">L{level}</span><span className="sr-only">Level {level}</span></span>
      <span className="pill" title="Today's goal"><ArtTarget size={26} />{goalPct}%<span className="sr-only"> of today&apos;s goal</span></span>
    </div>
  );
}
