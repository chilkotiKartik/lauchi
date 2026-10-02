import { initial } from "@/lib/social";

const TINTS = ["var(--green)", "var(--blue)", "var(--gold)", "var(--orange)", "var(--purple)", "var(--red)"];

/** A letter bubble. Only the first letter of the first name is shown — no photos. */
export function Avatar({ name, size = 40, done }: { name: string; size?: number; done?: boolean }) {
  const tint = TINTS[Array.from(name).reduce((a, c) => a + (c.codePointAt(0) ?? 0), 0) % TINTS.length];
  return (
    <span aria-hidden className="relative grid shrink-0 place-items-center rounded-full font-black text-[#14222a]"
      style={{ width: size, height: size, fontSize: size * 0.45, background: `color-mix(in srgb, ${tint} 70%, #fff)` }}>
      {initial(name)}
      {done && <span className="absolute -bottom-0.5 -right-0.5 grid h-[18px] w-[18px] place-items-center rounded-full border-2 border-card bg-green text-[11px] text-[#0d3a19]">✓</span>}
    </span>
  );
}
