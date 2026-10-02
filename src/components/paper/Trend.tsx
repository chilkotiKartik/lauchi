/** A small trend line of paper scores (oldest → newest), out of 100, with the 40-mark pass line. */
export function Trend({ scores, width = 320, height = 90 }: { scores: number[]; width?: number; height?: number }) {
  if (scores.length < 2) return null;
  const pad = 8, w = width - pad * 2, h = height - pad * 2;
  const x = (i: number) => pad + (i * w) / (scores.length - 1);
  const y = (s: number) => pad + h - (Math.max(0, Math.min(100, s)) / 100) * h;
  const line = scores.map((s, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(s).toFixed(1)}`).join(" ");
  const area = `${line} L${x(scores.length - 1).toFixed(1)} ${pad + h} L${pad} ${pad + h} Z`;
  const last = scores[scores.length - 1], first = scores[0];
  return (
    <figure className="flex flex-col gap-1">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full max-w-md" role="img"
        aria-label={`Score trend over your last ${scores.length} papers: from ${first} to ${last} out of 100`}>
        <defs>
          <linearGradient id="pp-trend" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--blue)" stopOpacity=".35" />
            <stop offset="1" stopColor="var(--blue)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={pad} x2={pad + w} y1={y(40)} y2={y(40)} stroke="var(--line2)" strokeDasharray="4 4" />
        <path d={area} fill="url(#pp-trend)" />
        <path d={line} fill="none" stroke="var(--blue)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="pp-trend-line" />
        {scores.map((s, i) => <circle key={i} cx={x(i)} cy={y(s)} r={i === scores.length - 1 ? 5 : 3} fill={s >= 60 ? "var(--green)" : s >= 40 ? "var(--gold)" : "var(--red)"} stroke="var(--card)" strokeWidth="1.5" />)}
      </svg>
      <figcaption className="text-xs text-muted">Dashed line: 40 marks (pass). Newest on the right.</figcaption>
    </figure>
  );
}
