import { describe, expect, it } from "vitest";
import { CST_EXPERIMENTS } from "./cst";
import { buildPipeline, callStates, fileSim, flowTrace, heapStates, ptrArith, SORT_ARRAYS, sortStates, structInfo, unionRead, unionWrite } from "../sim/cstx";

const num = (labId: string, qid: string) => { const q = CST_EXPERIMENTS[labId].questions.find((x) => x.id === qid); if (!q || q.type !== "numeric") throw new Error(qid); return q.answer; };
const last = <T,>(a: T[]) => a[a.length - 1];

describe("CST experiments recompute from the simulators", () => {
  it("has the five experiments", () => expect(Object.keys(CST_EXPERIMENTS).sort()).toEqual(["cpipeline", "ctrlflow", "ptrheap", "sortstack", "structunion"]));
  it("cpipeline", () => {
    expect(num("cpipeline", "cpipeline-q6")).toBe(buildPipeline("loop", 0, 0, 5).states.length - 1);
    expect(num("cpipeline", "cpipeline-q7")).toBe(buildPipeline("sum", 7, 5, 0).obj.length);
    expect(num("cpipeline", "cpipeline-q8")).toBe(Number(last(buildPipeline("loop", 0, 0, 3).states).out));
    const p = buildPipeline("loop", 0, 0, 5);
    const i = p.asm.findIndex((x) => x.op === "jg");
    expect([p.obj[i * 3 + 2], p.exe[i * 3 + 2]]).toEqual([0x30, 0x70]);
  });
  it("ctrlflow", () => {
    expect(flowTrace("break", 5).output).toBe("15 ");
    expect(flowTrace("continue", 5).output).toBe("15 19 20 ");
    expect(num("ctrlflow", "ctrlflow-q5")).toBe(flowTrace("primes", 30).output.trim().split(" ").length);
    expect(num("ctrlflow", "ctrlflow-q6")).toBe(flowTrace("pattern", 5).output.split(/\s+/).filter(Boolean).length);
    expect(num("ctrlflow", "ctrlflow-q7")).toBe(Number(flowTrace("semicolon", 9).output));
    expect(flowTrace("shortcirc", 0, -5, -1, 0).output).toBe("y=1 z=0");
  });
  it("sortstack", () => {
    const a2 = SORT_ARRAYS.a2;
    expect(num("sortstack", "sortstack-q1")).toBe(last(sortStates("bubble", a2, true)).cmps);
    expect(num("sortstack", "sortstack-q2")).toBe(last(sortStates("bubble", a2, false)).cmps);
    expect(num("sortstack", "sortstack-q3")).toBe(last(sortStates("bubble", a2)).swaps);
    expect(last(sortStates("selection", a2)).swaps).toBe(3);
    expect(num("sortstack", "sortstack-q5")).toBe(last(sortStates("selection", SORT_ARRAYS.a4)).cmps);
    expect(num("sortstack", "sortstack-q7")).toBe(last(callStates("fib", 6)).calls);
    expect(last(callStates("fact", 5)).maxDepth).toBe(5);
  });
  it("ptrheap", () => {
    expect(num("ptrheap", "ptrheap-q1")).toBe(ptrArith("int", 5).diffElems);
    expect(num("ptrheap", "ptrheap-q2")).toBe(ptrArith("int", 5).diffBytes);
    expect(num("ptrheap", "ptrheap-q3")).toBe(ptrArith("double", 6).diffBytes);
    expect(num("ptrheap", "ptrheap-q6")).toBe(last(heapStates("leak")).leaked);
    expect(num("ptrheap", "ptrheap-q7")).toBe(heapStates("basic")[3].used);
    const r = heapStates("realloc");
    expect(r[3].addr.a).not.toBe(r[2].addr.a);
  });
  it("structunion", () => {
    expect(num("structunion", "structunion-q1")).toBe(structInfo(["char", "int", "char"]).size);
    expect(num("structunion", "structunion-q2")).toBe(structInfo(["int", "char", "char"]).size);
    expect(structInfo(["char", "int", "double"]).unionSize).toBe(8);
    expect(num("structunion", "structunion-q5")).toBe(unionRead("char", unionWrite("int", 0x41424344)));
    expect(fileSim("r", false, 0, 0).ok).toBe(false);
    expect(fileSim("w", true, 0, 0).content).toBe("");
    expect(num("structunion", "structunion-q8")).toBe(fileSim("r+", true, 3, 2).posEnd);
    expect(fileSim("r+", true, 3, 2).content).toBe("HELAB");
  });
});
