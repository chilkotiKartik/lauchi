import { Lochi } from "@/components/Lochi";
import { towerHeights } from "./data";

/** Flat version of the lock-in scene: same real numbers (lit orbs, 7-day bars), no WebGL. Also the loading state. */
export function SceneFallback({ week, names, lit, slots }: { week: number[]; names: string[]; lit: number; slots: number }) {
  const hs = towerHeights(week);
  return (
    <div className="h3d-fallback" aria-hidden data-testid="home3d-fallback">
      <div className="relative h-full">
        <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
          <circle cx="100" cy="100" r="74" fill="none" stroke="#5b7380" strokeOpacity=".5" strokeWidth="2" />
          {Array.from({ length: slots }, (_, i) => {
            const a = (i / slots) * Math.PI * 2 - Math.PI / 2;
            const on = i < lit;
            return <circle key={i} cx={100 + Math.cos(a) * 74} cy={100 + Math.sin(a) * 74} r={on ? 8 : 5.5} fill={on ? "#ffd24d" : "#6e8693"} fillOpacity={on ? 1 : 0.6} />;
          })}
        </svg>
        <div className="h3d-lochi"><Lochi mood="idle" size={84} /></div>
      </div>
      <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet" className="max-h-40">
        <line x1="6" y1="92" x2="194" y2="92" stroke="#3a4c56" strokeWidth="3" />
        {week.map((v, i) => {
          const h = hs[i] === 0 ? 3 : 6 + hs[i] * 68;
          const today = i === week.length - 1;
          return (
            <g key={i}>
              <rect x={14 + i * 25.5} y={92 - h} width="18" height={h} rx="3" fill={today ? "#ffc83d" : v > 0 ? "#2ba6f5" : "#4d6572"} />
              <text x={23 + i * 25.5} y="108" textAnchor="middle">{names[i]?.slice(0, 2)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
