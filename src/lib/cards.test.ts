import { describe, expect, it } from "vitest";
import { toCard } from "./cards";
describe("formula cards", () => {
  it("splits name and expression", () => expect(toCard("Rolle: f(a) = f(b) ⇒ f′(c) = 0", 0)).toEqual({ front: "Rolle", back: "f(a) = f(b) ⇒ f′(c) = 0" }));
  it("numbers unnamed formulas", () => expect(toCard("x + y = 1", 2)).toEqual({ front: "Formula 3", back: "x + y = 1" }));
  it("only splits at the first colon", () => expect(toCard("Taylor: f(x) = f(a) + …: more", 0).back).toBe("f(x) = f(a) + …: more"));
});
