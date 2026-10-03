import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

/** Browser code must never import the question generator (it holds every answer and is ~300 KB gzipped). */
const SERVER_ONLY = [/@\/lib\/quiz-core"/, /gen\.generated/, /@\/lib\/supabase\/admin"/];
function files(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? files(p) : /\.tsx?$/.test(e.name) && !/\.test\./.test(e.name) ? [p] : [];
  });
}

describe("client bundles", () => {
  it("never pull in server-only modules (type-only imports are fine)", () => {
    const bad: string[] = [];
    for (const f of files(path.join(process.cwd(), "src"))) {
      const src = fs.readFileSync(f, "utf8");
      if (!/^\s*["']use client["']/.test(src)) continue;
      for (const line of src.split("\n")) {
        if (!/^\s*import\s/.test(line) || /^\s*import\s+type\s/.test(line)) continue;
        if (SERVER_ONLY.some((r) => r.test(line))) bad.push(`${path.relative(process.cwd(), f)}: ${line.trim()}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
