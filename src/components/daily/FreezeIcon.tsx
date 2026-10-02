/** A little ice crystal: one banked streak freeze. */
export function FreezeIcon({ size = 20, muted = false }: { size?: number; muted?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{ opacity: muted ? 0.35 : 1 }}>
      <g stroke="#2ba6f5" strokeWidth="2.2" strokeLinecap="round" fill="none">
        <path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7" />
        <path d="M9.5 3.8L12 6.2l2.5-2.4M9.5 20.2l2.5-2.4 2.5 2.4" strokeWidth="1.6" />
      </g>
    </svg>
  );
}

export function FreezeCount({ freezes }: { freezes: number }) {
  return (
    <span className="inline-flex items-center gap-1" title="Streak freezes: a missed day uses one automatically. You earn one every 7-day streak (max 2).">
      <FreezeIcon muted={freezes === 0} /><FreezeIcon muted={freezes < 2} />
      <span className="sr-only">{freezes} of 2 streak freezes banked</span>
    </span>
  );
}
