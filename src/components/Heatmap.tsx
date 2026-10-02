import { lastDays } from "@/lib/streak";

export function Heatmap({ today, days }: { today: string; days: Record<string, number> }) {
  const list = lastDays(today, 84);
  const shade = (xp: number) => (xp <= 0 ? "var(--line)" : xp < 30 ? "#9be7a8" : xp < 80 ? "#44c95a" : "#2fa046");
  return (
    <div role="img" aria-label="Study activity, last 12 weeks" className="mx-auto grid max-w-md grid-flow-col grid-rows-7 gap-1">
      {list.map((d) => (
        <span key={d} title={`${d}: ${days[d] ?? 0} XP`} className="aspect-square rounded-[4px]" style={{ background: shade(days[d] ?? 0) }} />
      ))}
    </div>
  );
}
