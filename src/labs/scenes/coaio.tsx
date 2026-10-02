"use client";
import { daisy, ioModel } from "../sim/bcax";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { BCAX_SPECS } from "../meta/bcax.specs";
import { Bench, Bits, C, Glass, Halo, Led, Packet, Rail, Slab, Txt, type V3 } from "./bcax-kit";

export default function CoaIoLab() {
  const [P, set, reset] = useLabParams(BCAX_SPECS.coaio);
  const { view, words, td, ti, req } = P;
  const r = ioModel(words, td, ti), d = daisy(req);
  const lanes: { key: "prog" | "intr" | "dma"; name: string; c: string }[] = [{ key: "prog", name: "Programmed I/O", c: C.red }, { key: "intr", name: "Interrupt-driven", c: C.gold }, { key: "dma", name: "DMA", c: C.green }];
  const reqBits = [0, 1, 2, 3].map((i) => (req >> i) & 1);
  const devX = (i: number) => -3 + i * 2.2;
  return (
    <LabFrame
      label={view === "modes" ? "Three lanes comparing programmed I/O, interrupt-driven I/O and DMA: each has a device, a CPU block whose busy bar fills red, and memory, with data packets flowing from device to memory" : "Four devices in a daisy chain next to the CPU: the grant signal travels along the chain and stops at the first device that is requesting, which wins the priority contest"}
      camera={[0, 4, 10.5]}
      onReset={reset}
      scene={() => (<group position={[0, -0.6, 0]}>
        <Bench w={14} d={7} />
        {view === "modes" ? lanes.map((l, i) => {
          const z = -1.8 + i * 1.8, busy = Math.max(0.05, 1 - r[l.key].free), path: V3[] = l.key === "dma" ? [[-4.5, 0.6, z], [4.5, 0.6, z]] : [[-4.5, 0.6, z], [0, 0.6, z], [4.5, 0.6, z]];
          return (<group key={l.key}>
            <Slab p={[-4.5, 0.4, z]} s={[1.0, 0.7, 0.9]} c={C.blue} glow={0.3} />
            <Slab p={[0, 0.4, z]} s={[1.6, 0.7, 0.9]} c="#33444e" glow={0.05} />
            <Slab p={[-0.8 + busy * 0.8, 0.9, z]} s={[1.6 * busy, 0.22, 0.7]} c={l.c} glow={0.9} />
            <Slab p={[4.5, 0.4, z]} s={[1.0, 0.7, 0.9]} c={C.purple} glow={0.3} />
            <Rail a={[-4.0, 0.4, z]} b={[4.0, 0.4, z]} c={l.c} on={true} r={0.03} />
            <Packet path={path} c={l.c} speed={0.2 + 0.1 * i} />
            <Packet path={path} c={l.c} speed={0.2 + 0.1 * i} phase={0.5} />
            {l.key === "dma" && <Slab p={[0, 0.4, z - 0.6]} s={[1.2, 0.5, 0.35]} c={C.orange} glow={0.6} />}
            <Txt p={[-6.2, 0.5, z]} s={l.key === "prog" ? "P" : l.key === "intr" ? "I" : "d"} h={0.5} c={l.c} />
          </group>);
        }) : (<group>
          <Slab p={[-5.2, 1.4, 0]} s={[1.4, 1.2, 1.0]} c={C.blue} glow={0.4} />
          <Txt p={[-5.2, 1.4, 0.55]} s="CPU" h={0.3} c="#ffffff" />
          {[0, 1, 2, 3].map((i) => {
            const passed = d.passed.includes(i), win = d.winner === i;
            return (<group key={i}>
              <Glass p={[devX(i), 1.4, 0]} s={[1.5, 1.4, 1.1]} c={win ? C.gold : reqBits[i] ? C.orange : C.blue} on={win || reqBits[i] === 1} o={0.25} />
              <Txt p={[devX(i), 1.4, 0.6]} s={`d${i}`} h={0.5} c={win ? C.gold : "#ffffff"} />
              <Led p={[devX(i), 2.4, 0]} c={C.orange} on={reqBits[i] === 1} r={0.2} />
              <Rail a={[devX(i) - 1.45, 0.7, 0]} b={[devX(i) - 0.75, 0.7, 0]} c={C.green} on={passed || win || i <= d.winner || d.winner < 0} r={0.06} />
              {win && <Halo p={[devX(i), 1.4, 0.4]} r={1.0} />}
            </group>);
          })}
          <Rail a={[-4.5, 0.7, 0]} b={[devX(0) - 0.75, 0.7, 0]} c={C.green} on={true} r={0.06} />
          <Packet path={d.winner < 0 ? [[-4.5, 0.7, 0], [devX(3), 0.7, 0]] : [[-4.5, 0.7, 0], [devX(d.winner) - 0.7, 0.7, 0]]} c={C.green} speed={0.25} />
          <Bits p={[0, -0.2, 1.8]} bits={reqBits} s={0.4} c={C.orange} />
        </group>)}
      </group>)}
      readouts={view === "modes" ? [
        ["Total transfer time", `${(r.prog.total / 1000).toFixed(1)} ms (DMA ${(r.dma.total / 1000).toFixed(1)} ms)`],
        ["Programmed: CPU free", `${(100 * r.prog.free).toFixed(0)} %`], ["Interrupt: CPU free", `${(100 * r.intr.free).toFixed(0)} %`], ["DMA: CPU free", `${(100 * r.dma.free).toFixed(1)} %`],
        ["CPU busy time (P / I / D)", `${(r.prog.busy / 1000).toFixed(1)} / ${(r.intr.busy / 1000).toFixed(2)} / ${(r.dma.busy / 1000).toFixed(2)} ms`],
      ] : [
        ["Requesting devices", reqBits.map((b, i) => (b ? `d${i}` : "")).filter(Boolean).join(" ") || "none"], ["Granted to", d.winner < 0 ? "nobody" : `d${d.winner}`], ["Devices that passed the grant on", d.passed.map((i) => `d${i}`).join(" ") || "none"], ["Rule", "closest to the CPU = highest priority"],
      ]}
      controls={<>
        {view === "modes" ? <Slider label="Words to transfer" value={words} min={10} max={1000} step={10} digits={0} onChange={(x) => set("words", Math.round(x))} /> : <Slider label="Request lines (bit i = device i)" value={req} min={0} max={15} step={1} digits={0} onChange={(x) => set("req", Math.round(x))} />}
        <Pick label="Experiment" value={view} options={[{ id: "modes", label: "Programmed vs interrupt vs DMA" }, { id: "daisy", label: "Priority interrupts: daisy chain" }]} onChange={(x) => set("view", x)} />
        {view === "modes" && <Slider label="Device time per word" value={td} min={10} max={200} step={5} digits={0} unit=" µs" onChange={(x) => set("td", Math.round(x))} />}
        {view === "modes" && <Slider label="Interrupt overhead per interrupt" value={ti} min={2} max={40} step={1} digits={0} unit=" µs" onChange={(x) => set("ti", Math.round(x))} />}
      </>}
      note={view === "modes" ? (
        <p>With <b>programmed I/O</b> the CPU polls the device status in a loop for the whole transfer, so it is 100% busy and does nothing else. With <b>interrupt-driven I/O</b> the CPU works on other tasks and is interrupted once per word; it loses only the interrupt overhead t<sub>i</sub> per word (CPU free = 1 − t<sub>i</sub>/t<sub>d</sub>). With <b>DMA</b> the controller moves the whole block between device and memory by itself, stealing a bus cycle now and then (cycle stealing); the CPU only sets up the transfer and takes one interrupt at the end (PYQ Q6.19). Model numbers are illustrative.</p>
      ) : (
        <p>In a <b>daisy chain</b> all devices share one interrupt request line; the acknowledge (grant) signal passes through the devices in order. A device that is requesting keeps the grant and does not pass it on, so the device nearest the CPU has the highest priority and a far device starves while nearer ones keep requesting. <b>Parallel arbitration</b> instead gives every device its own request line and a priority encoder decides, which is faster but needs more wires (PYQ Q6.18, Q6.20).</p>
      )}
    />
  );
}
