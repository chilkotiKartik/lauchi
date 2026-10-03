import { describe, expect, it } from "vitest";
import { buildTasks, changedKeys, direction, grade, moveGoal, predictable, reached, readValue, scoreOf, showsPreset, summarise } from "./challenge";

describe("readValue", () => {
  it("reads plain, signed and comma numbers", () => {
    expect(readValue("12.5 V")).toBe(12.5);
    expect(readValue("−3.2 A")).toBe(-3.2);
    expect(readValue("1,200 rpm")).toBe(1200);
    expect(readValue("45°")).toBe(45);
    expect(readValue("62%")).toBe(62);
  });
  it("applies SI prefixes only before a unit", () => {
    expect(readValue("1.05 kΩ")).toBeCloseTo(1050);
    expect(readValue("950 mA")).toBeCloseTo(0.95);
    expect(readValue("3.3 µF")).toBeCloseTo(3.3e-6);
    expect(readValue("2.4 MHz")).toBeCloseTo(2.4e6);
    expect(readValue("4 m")).toBe(4);           // metres, not milli
    expect(readValue("9.8 m/s²")).toBe(9.8);
    expect(readValue("2 kg")).toBe(2);          // kilogram is the base unit
    expect(readValue("30 min")).toBe(30);
    expect(readValue("0.5 mol")).toBe(0.5);
  });
  it("reads powers of ten", () => {
    expect(readValue("6.6 × 10⁻³⁴ J s")).toBeCloseTo(6.6e-34);
    expect(readValue("1.6e-19 C")).toBeCloseTo(1.6e-19);
    expect(readValue("3 x 10^8 m/s")).toBeCloseTo(3e8);
  });
  it("returns null for words", () => {
    expect(readValue("Stable")).toBeNull();
    expect(readValue("—")).toBeNull();
  });
});

describe("direction", () => {
  it("compares across prefixes and treats identical text as no change", () => {
    expect(direction("950 Ω", "1.05 kΩ")).toBe("up");
    expect(direction("1.2 mA", "900 µA")).toBe("down");
    expect(direction("5.00 V", "5.00 V")).toBe("same");
    expect(direction("Stable", "Unstable")).toBeNull();
  });
});

const slider = { label: "Resistance R", value: 10, min: 1, max: 100, step: 1, unit: " Ω", digits: 0 };

describe("moveGoal", () => {
  it("asks for a visible increase, or a decrease near the top", () => {
    expect(moveGoal(slider)).toEqual({ dir: "up", target: 20 }); // a tenth of 99 is 9.9, rounded to whole ohms
    expect(moveGoal({ ...slider, value: 95 })).toEqual({ dir: "down", target: 85 });
    expect(moveGoal({ ...slider, value: 50, step: 5 })).toEqual({ dir: "up", target: 80 }); // 6 steps beat a tenth
    expect(reached({ dir: "up", target: 20 }, 20)).toBe(true);
    expect(reached({ dir: "up", target: 20 }, 19)).toBe(false);
    expect(reached({ dir: "down", target: 85 }, 80)).toBe(true);
  });
});

describe("tasks and grading", () => {
  it("builds two slider tasks and a preset task", () => {
    const t = buildTasks([slider, { ...slider, label: "Voltage V" }, { ...slider, label: "Third" }], [{ name: "Short circuit", note: "R near zero", values: { R: 1 } }]);
    expect(t.map((x) => x.id)).toEqual(["s0", "s1", "p0"]);
  });
  it("keeps only numeric readouts, at most four", () => {
    expect(predictable([["A", "1 V"], ["B", "Stable"], ["C", "2"], ["D", "3"], ["E", "4"], ["F", "5"]]).map(([k]) => k)).toEqual(["A", "C", "D", "E"]);
  });
  it("leaves out a readout that only repeats the tested slider", () => {
    const s = { label: "Wavelength λ", value: 550, min: 400, max: 700, step: 1, unit: " nm", digits: 0 };
    expect(predictable([["Wavelength", "550 nm"], ["Fringe width", "1.10 mm"]], s).map(([k]) => k)).toEqual(["Fringe width"]);
    expect(predictable([["Wavelength", "550 nm"]], s).map(([k]) => k)).toEqual(["Wavelength"]); // nothing else left
  });
  it("grades predictions against what the lab did and summarises it", () => {
    const r = grade([{ label: "Current", before: "1.00 A", predicted: "down" }, { label: "Voltage", before: "10 V", predicted: "up" }], [["Current", "0.50 A"], ["Voltage", "10 V"]]);
    expect(r.map((x) => [x.actual, x.right])).toEqual([["down", true], ["same", false]]);
    expect(summarise("Raising R", r)).toBe("Raising R: Current fell; Voltage did not change.");
    expect(scoreOf([{ right: 1, total: 2 }, { right: 3, total: 3 }])).toBe(80);
  });
  it("spots a second control changed (unfair test) and a moved preset", () => {
    expect(changedKeys({ R: 1, V: 2, on: true }, { R: 5, V: 2, on: true })).toEqual(["R"]);
    expect(changedKeys({ R: 1, V: 2 }, { R: 5, V: 3 })).toEqual(["R", "V"]);
    expect(showsPreset({ R: 1 }, { R: 1, V: 9 })).toBe(true);
    expect(showsPreset({ R: 1 }, { R: 2, V: 9 })).toBe(false);
  });
});
