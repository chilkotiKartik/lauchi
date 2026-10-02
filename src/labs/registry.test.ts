import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { LABS } from "./registry";
import { ALL_SPECS } from "./meta";
import { clampParams } from "./params-core";

const getCourse = (c: string): { units: unknown[] } | null => {
  const f = path.join(__dirname, "../content/syllabus", `${c}.json`);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null;
};

describe("lab registry", () => {
  it("has unique, valid ids", () => {
    const ids = LABS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]{2,24}$/);
  });
  it("every lab has a scene file and a parameter spec", () => {
    for (const l of LABS) {
      expect(fs.existsSync(path.join(__dirname, "scenes", `${l.id}.tsx`)), l.id).toBe(true);
      expect(ALL_SPECS[l.id], l.id).toBeTruthy();
    }
  });
  it("every lab is wired into a scene loader", () => {
    const dir = path.join(__dirname, "meta");
    const src = fs.readdirSync(dir).filter((f) => f.endsWith(".scenes.tsx")).map((f) => fs.readFileSync(path.join(dir, f), "utf8")).join("\n");
    for (const l of LABS) expect(src.includes(`${l.id}: load(() => import("../scenes/${l.id}"))`), l.id).toBe(true);
  });
  it("every lab points at a real syllabus unit", () => {
    for (const l of LABS) {
      expect(l.where.length, l.id).toBeGreaterThan(0);
      for (const [c, u] of l.where) expect(getCourse(c)?.units[u - 1], `${l.id} → ${c} unit ${u}`).toBeTruthy();
    }
  });
  it("every preset uses real parameters inside their allowed range", () => {
    for (const l of LABS) {
      const spec = ALL_SPECS[l.id];
      for (const p of l.presets) {
        for (const k of Object.keys(p.values)) expect(spec[k], `${l.id} preset "${p.name}" has unknown key ${k}`).toBeTruthy();
        const clamped = clampParams(spec, p.values);
        for (const [k, v] of Object.entries(p.values)) expect(clamped[k], `${l.id} preset "${p.name}" ${k} out of range`).toBe(v);
        expect(p.note.length, `${l.id} preset "${p.name}" needs a note`).toBeGreaterThan(10);
      }
    }
  });
  it("every spec default is inside its own range", () => {
    for (const [id, spec] of Object.entries(ALL_SPECS)) for (const [k, s] of Object.entries(spec)) {
      if (s.kind === "num") { expect(s.min, `${id}.${k}`).toBeLessThanOrEqual(s.d); expect(s.d, `${id}.${k}`).toBeLessThanOrEqual(s.max); }
      if (s.kind === "opt") expect(s.options, `${id}.${k}`).toContain(s.d);
    }
  });
});
