// Draws the lockin. app icons (Lochi the padlock) and renders PNGs with sharp.
// Run: node scripts/make-icons.mjs
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const ORANGE = "#ff9a1f";
const DARK = "#0f1a20";

// Lochi, the app's padlock mascot (the same drawing as src/components/Lochi.tsx, 120×132 grid), centred on a 512 grid.
// `s` scales it around the centre (used for the maskable safe zone).
const INK = "#0F1A20";
const mark = (s) => `<g transform="translate(256 262) scale(${(s * 3.3).toFixed(3)}) translate(-60 -70)">
  <path d="M36 60 V42 a24 24 0 0 1 48 0 V60" fill="none" stroke="#9AA7B0" stroke-width="12" stroke-linecap="round"/>
  <rect x="12" y="56" width="96" height="68" rx="28" fill="#2FA046"/>
  <rect x="12" y="52" width="96" height="66" rx="28" fill="#44C95A"/>
  <rect x="22" y="58" width="40" height="8" rx="4" fill="rgba(255,255,255,.28)"/>
  <circle cx="44" cy="82" r="11" fill="#fff"/><circle cx="76" cy="82" r="11" fill="#fff"/>
  <circle cx="46" cy="84" r="5.5" fill="${INK}"/><circle cx="78" cy="84" r="5.5" fill="${INK}"/>
  <path d="M48 97 Q60 111 72 97 Z" fill="${INK}"/>
</g>`;
const svg = (bg, body, radius) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">${bg ? `<rect width="512" height="512" rx="${radius}" fill="${bg}"/>` : ""}${body}</svg>`;

const BG = "#E9FBEA";
const any = svg(BG, mark(1), 112);
const maskable = svg(BG, mark(0.72), 0);
const apple = svg(BG, mark(0.86), 0);
const favicon = svg(null, mark(1.12), 0); // transparent: just the padlock in the browser tab

writeFileSync("src/app/icon.svg", favicon);
writeFileSync("public/icons/icon.svg", any);
const png = (s, size, out) => sharp(Buffer.from(s)).resize(size, size).png({ compressionLevel: 9 }).toFile(out);
await Promise.all([
  png(any, 192, "public/icons/icon-192.png"),
  png(any, 512, "public/icons/icon-512.png"),
  png(maskable, 192, "public/icons/maskable-192.png"),
  png(maskable, 512, "public/icons/maskable-512.png"),
  png(apple, 180, "src/app/apple-icon.png"),
]);
console.log("icons written");
