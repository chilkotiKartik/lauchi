export function ProgressRing({ value, max, label, color = "var(--green)", size = 88, suffix = "%" }: { value: number; max: number; label: string; color?: string; size?: number; suffix?: string }) {
  const r = 34, c = 2 * Math.PI * r, pct = Math.min(1, max > 0 ? value / max : 0);
  return (
    <svg viewBox="0 0 88 88" width={size} height={size} role="img" aria-label={`${label}: ${value} of ${max}`}>
      <circle cx="44" cy="44" r={r} fill="none" stroke="var(--line)" strokeWidth="10" />
      <circle cx="44" cy="44" r={r} fill="none" stroke={pct >= 1 ? "var(--gold)" : color} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform="rotate(-90 44 44)" className="ring-arc" style={{ ["--ring-full" as string]: c, transition: "stroke-dashoffset .6s cubic-bezier(.2,.9,.3,1)" }} />
      <text x="44" y="49" textAnchor="middle" fontWeight="900" fontSize="18" fill="var(--head)">{Math.round(pct * 100)}{suffix}</text>
    </svg>
  );
}
