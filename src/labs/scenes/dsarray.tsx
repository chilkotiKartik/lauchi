"use client";
import { addr1D, addr2D } from "../sim/bcax";
import { Check, LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { BCAX_SPECS } from "../meta/bcax.specs";
import { Bench, C, Cell, Packet, Pointer, Txt, type V3 } from "./bcax-kit";

const VALS = [2, 4, 6, 8, 10];
export default function DsArrayLab() {
  const [P, set, reset] = useLabParams(BCAX_SPECS.dsarray);
  const { view, base, w, rows, cols, i, j, rm } = P;
  const ii = view === "1d" ? Math.min(i, 4) : Math.min(i, rows - 1), jj = Math.min(j, cols - 1);
  const a1 = addr1D(base, w, ii), a2 = addr2D(base, w, rows, cols, ii, jj, rm);
  const order = (r: number, c: number) => (rm ? r * cols + c : c * rows + r);
  const gp = (r: number, c: number): V3 => [(c - (cols - 1) / 2) * 1.1, 0.5, (r - (rows - 1) / 2) * 1.1 - 0.4];
  const path: V3[] = Array.from({ length: rows * cols }, (_, n) => { const r = rm ? Math.floor(n / cols) : n % rows, c = rm ? n % cols : Math.floor(n / rows); const p = gp(r, c); return [p[0], 1.0, p[2]] as V3; });
  const cw = w * 0.22 + 0.1;
  return (
    <LabFrame
      label={view === "1d" ? "A strip of memory cells holding 2 4 6 8 10 whose widths grow with the element size, with a gold marker and a travelling packet showing base address plus index times size" : "A grid of cells on a bench numbered in storage order, row by row or column by column, with a gold packet tracing the order in which the elements sit in memory"}
      camera={[0, 4.2, 8]}
      onReset={reset}
      scene={() => (<group position={[0, -0.6, 0]}>
        <Bench w={12} d={7} />
        {view === "1d" ? (<group>
          {VALS.map((v, n) => {
            const x = (n - 2) * (cw + 0.12);
            return (<group key={n}>
              <Cell p={[x, 0.5, 0]} s={[cw, 0.9, 0.7]} c={n === ii ? C.gold : n < ii ? C.blue : "#3b6a8c"} glow={n === ii ? 0.8 : 0.2} v={v} tc={n === ii ? "#2a1d00" : "#ffffff"} th={0.42} />
              <Txt p={[x, -0.15, 0.4]} s={String(n)} h={0.28} c={C.light} glow={0.5} />
            </group>);
          })}
          <Pointer p={[(ii - 2) * (cw + 0.12), 1.4, 0]} />
          <Txt p={[0, 2.6, 0]} s={String(a1)} h={0.8} c={C.gold} />
          <Packet path={[[-2 * (cw + 0.12), 1.9, 0], [(ii - 2) * (cw + 0.12), 1.9, 0]]} c={C.orange} speed={0.4} on={ii > 0} />
        </group>) : (<group>
          {Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => (
            <Cell key={`${r}-${c}`} p={gp(r, c)} s={[0.95, 0.5, 0.95]} c={r === ii && c === jj ? C.gold : (r + c) % 2 ? "#3b6a8c" : C.blue} glow={r === ii && c === jj ? 0.9 : 0.15} v={order(r, c)} tc={r === ii && c === jj ? "#2a1d00" : "#ffffff"} th={0.36} />
          )))}
          <Packet path={path} c={C.orange} speed={0.08} />
          <Txt p={[0, 2.4, 0]} s={String(a2)} h={0.8} c={C.gold} />
        </group>)}
      </group>)}
      readouts={view === "1d" ? [
        ["Element", `A[${ii}] = ${VALS[ii]}`], ["Address of A[i]", `${base} + ${ii} × ${w} = ${a1}`], ["Address of A[4]", String(addr1D(base, w, 4))], ["Array size in bytes", String(5 * w)],
      ] : [
        ["Element", `A[${ii}][${jj}]`], [rm ? "Row-major address" : "Column-major address", `${a2}`], ["Row-major would be", String(addr2D(base, w, rows, cols, ii, jj, true))], ["Column-major would be", String(addr2D(base, w, rows, cols, ii, jj, false))], ["Linear index", String(order(ii, jj))],
      ]}
      controls={<>
        <Slider label="Row / index i" value={i} min={0} max={5} step={1} digits={0} onChange={(x) => set("i", Math.round(x))} />
        <Pick label="Array" value={view} options={[{ id: "1d", label: "1-D array A = [2, 4, 6, 8, 10]" }, { id: "2d", label: "2-D array A[rows][cols]" }]} onChange={(x) => set("view", x)} />
        <Slider label="Base address" value={base} min={0} max={5000} step={4} digits={0} onChange={(x) => set("base", Math.round(x))} />
        <Slider label="Element size (bytes)" value={w} min={1} max={8} step={1} digits={0} onChange={(x) => set("w", Math.round(x))} />
        {view === "2d" && <Slider label="Rows" value={rows} min={2} max={6} step={1} digits={0} onChange={(x) => set("rows", Math.round(x))} />}
        {view === "2d" && <Slider label="Columns" value={cols} min={2} max={6} step={1} digits={0} onChange={(x) => set("cols", Math.round(x))} />}
        {view === "2d" && <Slider label="Column j" value={j} min={0} max={5} step={1} digits={0} onChange={(x) => set("j", Math.round(x))} />}
        {view === "2d" && <Check label="Row-major order (untick for column-major)" checked={rm} onChange={(x) => set("rm", x)} />}
      </>}
      note={<p>1-D: address of A[i] = base + (i − LB) × w. PYQ Q5.8: A = [2, 4, 6, 8, 10], base 1000, w = 4, so A[3] is at 1012. 2-D, row-major (C language): address of A[i][j] = base + (i × cols + j) × w; column-major (Fortran): base + (j × rows + i) × w. The numbers on the cells are the storage order; the gold packet walks memory in that order. Switch the order and the same element lands at a different address.</p>}
    />
  );
}
