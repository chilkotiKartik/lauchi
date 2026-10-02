/** Pure text helpers for read-aloud and voice answers (no browser APIs here, so they are unit-tested). */

const WORDS: [RegExp, string][] = [
  [/Ω/g, " ohm "], [/µ|μ(?=[A-Za-z])/g, " micro "], [/°C/g, " degrees Celsius "], [/°/g, " degrees "], [/×/g, " times "], [/÷/g, " divided by "],
  [/±/g, " plus or minus "], [/≤/g, " less than or equal to "], [/≥/g, " greater than or equal to "], [/≠/g, " not equal to "], [/≈/g, " approximately "],
  [/→|⇒/g, " gives "], [/⇌/g, " in equilibrium with "], [/∝/g, " proportional to "], [/∞/g, " infinity "], [/√/g, " root "], [/∫/g, " integral of "],
  [/∮/g, " closed integral of "], [/∂/g, " partial "], [/∇/g, " del "], [/Σ/g, " sum "], [/Δ/g, " delta "], [/λ/g, " lambda "], [/μ/g, " mu "],
  [/π/g, " pi "], [/θ/g, " theta "], [/φ/g, " phi "], [/ψ/g, " psi "], [/ω/g, " omega "], [/α/g, " alpha "], [/β/g, " beta "], [/γ/g, " gamma "],
  [/δ/g, " delta "], [/ε/g, " epsilon "], [/η/g, " eta "], [/σ/g, " sigma "], [/τ/g, " tau "], [/ρ/g, " rho "], [/ν/g, " nu "], [/χ/g, " chi "],
  [/ħ/g, " h bar "], [/Å/g, " angstrom "], [/∥/g, " parallel "], [/⊥/g, " perpendicular "], [/½/g, " one half "], [/¼/g, " one quarter "], [/¾/g, " three quarters "],
  [/⃗/g, " vector "], [/[̂̅̇]/g, ""], [/‾/g, ""], [/–|—/g, ", "], [/·/g, " times "], [/…/g, ". "],
];

/** Turns question / lesson text (which may contain <sub>, <sup>, <b>, <i>) into something a speech engine reads sensibly. */
export function speakable(input: string): string {
  let s = input
    .replace(/<sup>\s*2\s*<\/sup>/g, " squared ")
    .replace(/<sup>\s*3\s*<\/sup>/g, " cubed ")
    .replace(/<sup>\s*([−-])\s*1\s*<\/sup>/g, " inverse ")
    .replace(/<sup>(.*?)<\/sup>/g, " to the power $1 ")
    .replace(/<sub>(.*?)<\/sub>/g, " $1 ")
    .replace(/<\/?(b|i)>/g, "")
    .replace(/&lt;/g, " less than ").replace(/&gt;/g, " greater than ").replace(/&amp;/g, " and ").replace(/&nbsp;/g, " ")
    .replace(/<[^>]*>/g, " ");
  s = s.replace(/[²]/g, " squared ").replace(/[³]/g, " cubed ").replace(/⁻¹/g, " inverse ");
  for (const [re, w] of WORDS) s = s.replace(re, w);
  s = s.replace(/(\d)\s*\/\s*(\d)/g, "$1 over $2").replace(/\s=\s/g, " equals ").replace(/\s+/g, " ").trim();
  return s;
}

const UNITS: Record<string, number> = { zero: 0, oh: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19 };
const TENS: Record<string, number> = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const SCALE: Record<string, number> = { hundred: 100, thousand: 1000, lakh: 1e5, million: 1e6 };

/**
 * A spoken answer to a number the quiz box accepts: "seven point five" → "7.5", "minus two" → "-2",
 * "0.25" stays "0.25", "twenty five" → "25". Returns null when no number can be read.
 */
export function spokenNumber(input: string): string | null {
  const t = input.toLowerCase().replace(/,/g, "").replace(/[−–]/g, "-").trim();
  if (/\d/.test(t)) {
    const c = t.replace(/\b(minus|negative)\b/g, "-").replace(/\b(point|dot)\b/g, ".").replace(/\s+/g, "");
    const m = /^-?\d+(\.\d+)?$/.exec(c) ?? /^-?\.\d+$/.exec(c);
    if (m) return m[0].replace(/^(-?)\./, "$10.");
  }
  const words = t.replace(/-/g, " ").split(/\s+/).filter(Boolean);
  let sign = 1, total = 0, cur = 0, seen = false, frac = "", inFrac = false;
  for (const w of words) {
    if (w === "minus" || w === "negative") { sign = -1; continue; }
    if (w === "point" || w === "dot" || w === "decimal") { inFrac = true; continue; }
    if (w === "and" || w === "a") continue;
    if (/^\d+$/.test(w)) { if (inFrac) frac += w; else { cur += Number(w); } seen = true; continue; }
    if (inFrac) {
      if (w in UNITS && UNITS[w] < 10) { frac += String(UNITS[w]); seen = true; continue; }
      return null;
    }
    if (w in UNITS) { cur += UNITS[w]; seen = true; }
    else if (w in TENS) { cur += TENS[w]; seen = true; }
    else if (w === "hundred") { cur = (cur || 1) * 100; seen = true; }
    else if (w in SCALE) { total += (cur || 1) * SCALE[w]; cur = 0; seen = true; }
    else if (w === "half" && seen) { frac = "5"; }
    else return null;
  }
  if (!seen) return null;
  const whole = total + cur;
  return `${sign < 0 ? "-" : ""}${whole}${frac ? "." + frac : ""}`;
}
