// Draws the lockin. "l." app icon (original lettermark: a bold rounded "l" bar and a dot) and renders PNGs with sharp.
// Run: node scripts/make-icons.mjs
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const ORANGE = "#ff9a1f";
const DARK = "#0f1a20";

// Mark is drawn on a 512 grid. `s` scales it around the centre (used for the maskable safe zone).
const mark = (s, fill) => `<g transform="translate(256 256) scale(${s}) translate(-256 -256)" fill="${fill}">
  <rect x="150" y="84" width="84" height="344" rx="42"/>
  <circle cx="338" cy="386" r="46"/>
</g>`;
const svg = (bg, body, radius) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><rect width="512" height="512" rx="${radius}" fill="${bg}"/>${body}</svg>`;

const any = svg(ORANGE, mark(1, DARK), 112);
const maskable = svg(ORANGE, mark(0.72, DARK), 0);
const apple = svg(ORANGE, mark(0.86, DARK), 0);

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
