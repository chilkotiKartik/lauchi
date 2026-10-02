import { describe, expect, it } from "vitest";
import { decodeEntities } from "./rich";

describe("rich text entities", () => {
  it("decodes the entities question banks use", () => {
    expect(decodeEntities("Δ &gt; P and a &lt; b &amp;&amp; c")).toBe("Δ > P and a < b && c");
    expect(decodeEntities("&#8804; &#x2265;")).toBe("≤ ≥");
  });
  it("leaves C code like &x; alone", () => expect(decodeEntities('scanf("%d",&x);')).toBe('scanf("%d",&x);'));
  it("does not turn entities into markup", () => expect(decodeEntities("&lt;script&gt;")).toBe("<script>"));
});
