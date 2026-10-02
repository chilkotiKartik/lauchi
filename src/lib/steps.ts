/** Split a worked solution (`why`) into ordered steps for "Show me the method".
 *
 * A step ends at ". ", "! ", "? " or "; " — but never:
 *  - inside a number (1.52 has no space after the dot, so it never matches),
 *  - after an abbreviation such as "e.g." or "i.e.",
 *  - inside <sub>…</sub> / <sup>…</sup> or any other HTML tag,
 *  - inside brackets, so a formula or an aside in ( ) stays whole,
 *  - at the ";" that ends an HTML entity such as &lt;
 * A full stop before a lower-case word only ends a step after a plain word ("extern only declares. register is…").
 * A comma also ends a step when the next move starts with "so", "then", "hence", "therefore", "thus" or "giving".
 * Joining the steps with single spaces gives back the original text with its whitespace collapsed. */

const ABBR = new Set(["e.g", "i.e", "eg", "ie", "etc", "vs", "approx", "fig", "figs", "eq", "eqs", "no", "nos", "cf", "viz", "resp", "dr", "mr", "mrs", "ms", "st", "max", "min", "const", "ref", "sec", "deg", "al"]);
const OPEN = "([{", CLOSE = ")]}";
/** ", so …", ", then …" and friends start the next move of a calculation. */
const CONNECT = /^ (?:so|then|hence|therefore|thus|giving|which gives) /;

function isAbbreviation(text: string, dot: number): boolean {
  // the word right before the dot, letters and inner dots only (so "e.g" is one word)
  const m = /([A-Za-z](?:[A-Za-z.]*[A-Za-z])?)$/.exec(text.slice(0, dot));
  if (!m) return false;
  const w = m[1].toLowerCase();
  if (ABBR.has(w)) return true;
  // a single capital initial such as "J. J. Thomson" or "E. coli" — but not a unit after a number ("12 V. Then…")
  return /^[A-Z]$/.test(m[1]) && (dot === 1 || /\s/.test(text[dot - 2])) && !/\d\s?$/.test(text.slice(0, dot - 1));
}

export function splitSteps(why: string): string[] {
  const text = why.replace(/\s+/g, " ").trim();
  if (!text) return [];
  const out: string[] = [];
  let start = 0, depth = 0, script = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "<") {
      const m = /^<\/?[a-z][a-z0-9]*(?:\s[^<>]*)?>/i.exec(text.slice(i, i + 200));
      if (!m) continue; // a bare "<" as in "V < 2.405"
      const tag = m[0].toLowerCase(), close = i + m[0].length - 1;
      if (/^<su[bp][\s>]/.test(tag)) script++;
      else if (/^<\/su[bp]>/.test(tag)) script = Math.max(0, script - 1);
      i = close;
      continue;
    }
    if (OPEN.includes(ch)) { depth++; continue; }
    if (CLOSE.includes(ch)) {
      depth = Math.max(0, depth - 1);
      // a bracketed sentence "(… single-mode.) Next…" ends a step at its closing bracket
      if (depth === 0 && script === 0 && /[.!?]/.test(text[i - 1]) && text[i + 1] === " " && /^[A-Z(]/.test(text[i + 2] ?? "")) {
        out.push(text.slice(start, i + 1).trim());
        start = i + 2;
      }
      continue;
    }
    if (depth > 0 || script > 0) continue;
    if (ch === "," && CONNECT.test(text.slice(i + 1, i + 14)) && i - start >= 12) {
      out.push(text.slice(start, i + 1).trim());
      start = i + 2;
      continue;
    }
    if (!".!?;".includes(ch)) continue;
    const after = text[i + 1];
    if (after !== " ") continue; // end of text, or no space (1.52, x.y, "a.b")
    const nxt = text[i + 2] ?? "";
    if (ch === ";" && /&[a-z0-9#]+$/i.test(text.slice(start, i))) continue; // &lt; &gt; &amp;
    if (ch === "." && (isAbbreviation(text, i) || (/^[a-z]/.test(nxt) && !/(?:^|\s)[a-z]{3,}$/.test(text.slice(start, i))))) continue;
    if (ch === "." && /^[.…]/.test(nxt)) continue;
    const piece = text.slice(start, i + 1).trim();
    if (piece) out.push(piece);
    start = i + 2;
  }
  const tail = text.slice(start).trim();
  if (tail) out.push(tail);
  // fold scraps (a lone "35." or "So:") into the step before, so no step is just a symbol
  const merged: string[] = [];
  for (const s of out) {
    if (merged.length && s.replace(/<[^>]*>/g, "").replace(/[^A-Za-z0-9]/g, "").length < 3) merged[merged.length - 1] += " " + s;
    else merged.push(s);
  }
  if (merged.length > 1 && merged[0].replace(/<[^>]*>/g, "").replace(/[^A-Za-z0-9]/g, "").length < 3) merged.splice(0, 2, merged[0] + " " + merged[1]);
  return merged;
}
