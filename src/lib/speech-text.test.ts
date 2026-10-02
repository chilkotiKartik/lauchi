import { describe, expect, it } from "vitest";
import { speakable, spokenNumber } from "./speech-text";

describe("speakable", () => {
  it("reads sub/superscripts and symbols", () => {
    expect(speakable("x<sup>2</sup> + V<sub>th</sub> = 5 Ω")).toBe("x squared + V th equals 5 ohm");
    expect(speakable("λ = 600 nm, θ = 30°")).toBe("lambda equals 600 nm, theta equals 30 degrees");
    expect(speakable("<b>Answer:</b> 1/2 × 3")).toBe("Answer: 1 over 2 times 3");
    expect(speakable("J K<sup>-1</sup>")).toBe("J K inverse");
  });
  it("never leaves markup behind", () => {
    expect(speakable("<script>x</script>")).not.toMatch(/[<>]/);
  });
});

describe("spokenNumber", () => {
  it.each([
    ["7.5", "7.5"], ["seven point five", "7.5"], ["minus two", "-2"], ["twenty five", "25"], ["one hundred and twenty", "120"],
    ["zero point two five", "0.25"], ["3 point 2", "3.2"], ["minus 0.5", "-0.5"], ["two thousand", "2000"], ["point five", "0.5"], ["forty-two", "42"],
  ])("%s → %s", (said, n) => expect(spokenNumber(said)).toBe(n));
  it("gives up on non-numbers", () => {
    expect(spokenNumber("hello there")).toBeNull();
    expect(spokenNumber("")).toBeNull();
  });
});
