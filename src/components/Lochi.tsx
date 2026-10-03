"use client";
import { motion, type TargetAndTransition } from "framer-motion";

export type LochiMood =
  | "idle" | "welcome" | "happy" | "correct" | "wrong" | "thinking" | "loading" | "celebrate" | "streak" | "levelup" | "sleep";

const INK = "#1F2D33";

const motionFor: Record<LochiMood, TargetAndTransition> = {
  idle: { y: [0, -3, 0], transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" } },
  welcome: { y: [0, -10, 0], rotate: [0, -4, 4, 0], transition: { duration: 1.4, repeat: 2, ease: "easeInOut" } },
  happy: { y: [0, -6, 0], transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" } },
  correct: { scale: [1, 1.14, 1], y: [0, -12, 0], transition: { duration: 0.6 } },
  wrong: { x: [0, -7, 7, -5, 5, 0], transition: { duration: 0.45 } },
  thinking: { rotate: [-2, 2, -2], transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" } },
  loading: { scaleY: [1, 0.96, 1], transition: { duration: 1.6, repeat: Infinity, ease: "easeInOut" } },
  celebrate: { y: [0, -16, 0], rotate: [0, -6, 6, 0], transition: { duration: 0.9, repeat: 3 } },
  streak: { scale: [1, 1.08, 1], transition: { duration: 1.1, repeat: Infinity } },
  levelup: { y: [0, -18, 0], scale: [1, 1.12, 1], transition: { duration: 0.8, repeat: 2 } },
  sleep: { scaleY: [1, 0.97, 1], transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" } },
};

function Face({ mood }: { mood: LochiMood }) {
  const eyes = (dx = 0, dy = 0) => (
    <g>
      <circle cx="44" cy="82" r="11" fill="#fff" /><circle cx="76" cy="82" r="11" fill="#fff" />
      <circle cx={46 + dx} cy={84 + dy} r="5.5" fill={INK} /><circle cx={78 + dx} cy={84 + dy} r="5.5" fill={INK} />
      <circle cx={48 + dx} cy={81 + dy} r="1.8" fill="#fff" /><circle cx={80 + dx} cy={81 + dy} r="1.8" fill="#fff" />
    </g>
  );
  const grin = (<><path d="M48 97 Q60 111 72 97 Z" fill={INK} /><path d="M54 103 Q60 108 66 103 Q60 100 54 103Z" fill="#FF6B81" /></>);
  switch (mood) {
    case "wrong":
      return (<>
        <path d="M34 72 L50 67 M86 72 L70 67" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />{eyes()}
        <path d="M50 104 Q60 95 70 104" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
        <path d="M33 92 q-4 7 0 9 q4 -2 0 -9z" fill="#6CC4FF" />
      </>);
    case "thinking":
    case "loading":
      return (<>{eyes(-5, -6)}<circle cx="64" cy="101" r="4.5" fill={INK} />
        <circle cx="100" cy="46" r="4" fill="var(--line2)" /><circle cx="108" cy="34" r="6" fill="var(--line2)" /></>);
    case "correct":
    case "levelup":
    case "celebrate":
      return (<>{eyes()}<ellipse cx="60" cy="101" rx="7" ry="8" fill={INK} />
        <path d="M104 60 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#FFC83D" />
        <path d="M12 70 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#FFC83D" /></>);
    case "streak":
      return (<>{eyes()}{grin}
        <g transform="translate(46 4) scale(.75)"><path d="M60 2c3 9 13 12 13 24a13 13 0 0 1-26 0c0-6 3-10 6-12 .4 5 2.5 7 5 8.5C56 17 57 9 60 2z" fill="#FF9A1F" /><path d="M60 22c3.5 3.5 6 5.5 6 9a6 6 0 0 1-12 0c0-3.3 2.2-5.8 6-9z" fill="#FFC83D" /></g></>);
    case "sleep":
      return (<>
        <path d="M36 84 Q44 90 52 84 M68 84 Q76 90 84 84" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
        <path d="M54 101 Q60 104 66 101" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
        <text x="94" y="44" fontWeight="900" fontSize="18" fill="var(--muted)">z</text></>);
    default:
      return (<>{eyes()}{grin}</>);
  }
}

export function Lochi({ mood = "idle", size = 120, label }: { mood?: LochiMood; size?: number; label?: string }) {
  return (
    <motion.svg
      viewBox="0 0 120 132" width={size} height={(size * 132) / 120}
      role="img" aria-label={label ?? `Lochi the padlock, ${mood}`}
      key={mood} animate={motionFor[mood]} style={{ overflow: "visible" }}
    >
      <ellipse cx="60" cy="127" rx="36" ry="5" fill="rgba(0,0,0,.12)" />
      <path d="M36 60 V42 a24 24 0 0 1 48 0 V60" fill="none" stroke="#9AA7B0" strokeWidth="12" strokeLinecap="round" />
      <path d="M36 60 V42 a24 24 0 0 1 48 0" fill="none" stroke="#C4CDD3" strokeWidth="4" strokeLinecap="round" transform="translate(-3 0)" />
      <rect x="12" y="56" width="96" height="68" rx="28" fill="#2FA046" />
      <rect x="12" y="52" width="96" height="66" rx="28" fill="#44C95A" />
      <rect x="22" y="58" width="40" height="8" rx="4" fill="rgba(255,255,255,.28)" />
      <Face mood={mood} />
      <ellipse cx="30" cy="97" rx="6.5" ry="4" fill="#FF8FA3" opacity=".75" /><ellipse cx="90" cy="97" rx="6.5" ry="4" fill="#FF8FA3" opacity=".75" />
    </motion.svg>
  );
}
