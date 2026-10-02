import type { V3 } from "../kit";

/** A small cubic block of lattice sites (drawn instead of the full diamond structure, for speed). */
export const SEMI_LATTICE: V3[] = (() => {
  const out: V3[] = [];
  for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) out.push([-2.2 + i * 0.88, -1.2 + j * 0.8, -1.2 + k * 0.8]);
  return out;
})();
