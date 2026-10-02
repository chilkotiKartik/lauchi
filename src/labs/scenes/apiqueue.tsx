"use client";
import { queue } from "../sim/weba";
import { Box, C, Floor, Panel, Shuttle } from "../kit";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { WEBA_SPECS } from "../meta/weba.specs";

const ms = (s: number) => (s < 1 ? `${(s * 1000).toFixed(0)} ms` : `${s.toFixed(2)} s`);

export default function ApiQueueLab() {
  const [P, set, reset] = useLabParams(WEBA_SPECS.apiqueue);
  const c = Math.round(P.c), q = queue(P.lambda, P.mu, c);
  const waiting = q.stable ? Math.min(20, Math.round(q.lq)) : 20;
  const shade = q.rho < 0.6 ? C.green : q.rho < 0.85 ? C.gold : C.red;
  return (
    <LabFrame
      label="A line of small blocks waiting on the left for a row of worker cylinders on the right, with gold requests flowing towards the workers; the line is long and red when the server is overloaded"
      camera={[0, 1.4, 7.2]}
      animated
      onReset={reset}
      scene={() => (
        <group>
          <Floor size={12} y={-1.2} divisions={12} />
          <Panel p={[0, 0.2, -1.2]} w={8.6} h={3.2} />
          {Array.from({ length: waiting }, (_, i) => <Box key={i} p={[-0.5 - i * 0.24, -0.9 + 0.2, 0]} s={[0.18, 0.4, 0.4]} c={q.stable ? C.blue : C.red} glow={0.2} />)}
          {Array.from({ length: c }, (_, i) => (
            <mesh key={i} position={[2.2, -0.75, (i - (c - 1) / 2) * 0.55]}>
              <cylinderGeometry args={[0.22, 0.22, 0.9, 16]} />
              <meshStandardMaterial color={shade} emissive={shade} emissiveIntensity={0.3} />
            </mesh>
          ))}
          <Shuttle from={[-2.4, 0.5, 0]} to={[1.9, -0.2, 0]} speed={0.4} r={0.1} />
          <Shuttle from={[-3.6, 0.5, 0.3]} to={[1.9, -0.2, -0.3]} speed={0.3} r={0.1} />
        </group>
      )}
      readouts={q.stable ? [
        ["Server load ρ = λ/(cμ)", `${(q.rho * 100).toFixed(0)}%`],
        ["Chance a request waits", `${(q.pWait * 100).toFixed(0)}%`],
        ["Average queue length", q.lq.toFixed(2)],
        ["Average wait", ms(q.wq)],
        ["Average total time", ms(q.w)],
      ] : [
        ["Server load ρ = λ/(cμ)", `${(q.rho * 100).toFixed(0)}% (over capacity)`],
        ["Chance a request waits", "almost 100%"],
        ["Average queue length", "grows without limit"],
        ["Average wait", "grows without limit"],
        ["Capacity", `${(c * P.mu).toFixed(0)} req/s`],
      ]}
      controls={<>
        <Slider label="Requests arriving per second" value={P.lambda} min={1} max={200} step={5} digits={0} unit=" req/s" onChange={(x) => set("lambda", x)} />
        <Slider label="Requests one worker finishes per second" value={P.mu} min={5} max={100} step={5} digits={0} unit=" req/s" onChange={(x) => set("mu", x)} />
        <Slider label="Workers" value={c} min={1} max={8} step={1} digits={0} onChange={(x) => set("c", Math.round(x))} />
      </>}
      note={<p>This is the classic M/M/c queue: random arrivals at rate λ, c workers each serving at rate μ. The server is stable only if the load ρ = λ/(cμ) is below 100%. The chance an arriving request must wait is the Erlang C formula, the average queue is P(wait) × ρ/(1 − ρ), and the wait is that divided by λ. Notice how sharply the queue grows above about 80% load, and how one extra worker at 53% load nearly removes it. The block line shows the average queue (at most 20 drawn). Real servers have bursty traffic and uneven jobs, so treat it as a guide.</p>}
    />
  );
}
