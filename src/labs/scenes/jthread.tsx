"use client";
import { THREAD_LIFE, raceRun, type TState } from "../sim/bcax";
import { Check, LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { BCAX_SPECS } from "../meta/bcax.specs";
import { Bench, C, Halo, Led, Packet, Slab, Txt, type V3 } from "./bcax-kit";

const ORDER: TState[] = ["NEW", "RUNNABLE", "RUNNING", "TIMED_WAITING", "BLOCKED", "WAITING", "TERMINATED"];
const COL: Record<TState, string> = { NEW: C.light, RUNNABLE: C.blue, RUNNING: C.green, TIMED_WAITING: C.gold, BLOCKED: C.red, WAITING: C.orange, TERMINATED: C.purple };
const POSN: Record<TState, V3> = { NEW: [-5, 3.2, 0], RUNNABLE: [-2, 3.2, 0], RUNNING: [1.2, 3.2, 0], TERMINATED: [4.6, 3.2, 0], TIMED_WAITING: [-2, 1.0, 0], BLOCKED: [1.2, 1.0, 0], WAITING: [4.6, 1.0, 0] };
const SH: Record<TState, string> = { NEW: "nEW", RUNNABLE: "rUn", RUNNING: "RUN", TIMED_WAITING: "tIME", BLOCKED: "bLOC", WAITING: "WAIt", TERMINATED: "dEAd" };
export default function JThreadLab() {
  const [P, set, reset] = useLabParams(BCAX_SPECS.jthread);
  const { view, step, q, n, sync } = P;
  const k = Math.min(step, THREAD_LIFE.length - 1), cur = THREAD_LIFE[k];
  const race = raceRun(q, n, sync);
  const trail: V3[] = THREAD_LIFE.slice(0, k + 1).map((t) => [POSN[t.state][0], POSN[t.state][1], 0.5] as V3);
  const bar = (v: number) => Math.max(0.05, (v / (2 * n)) * 4);
  return (
    <LabFrame
      label={view === "life" ? "Seven glowing state platforms New, Runnable, Running, Timed waiting, Blocked, Waiting and Terminated: a gold token hops between them as the thread's life story unfolds" : "Two threads each adding to a shared counter: a tall green bar shows the expected total and a shorter red bar the actual total, the gap being updates lost to the race condition"}
      camera={[0, 3.2, 10.5]}
      onReset={reset}
      scene={() => (<group position={[0, -0.6, 0]}>
        <Bench w={14} d={6} />
        {view === "life" ? (<group>
          {ORDER.map((s) => (<group key={s}>
            <Slab p={POSN[s]} s={[2.2, 0.7, 1.2]} c={cur.state === s ? COL[s] : "#26363f"} glow={cur.state === s ? 0.9 : 0.08} />
            <Txt p={[POSN[s][0], POSN[s][1], 0.65]} s={SH[s]} h={0.3} c={cur.state === s ? "#10202a" : COL[s]} />
            {cur.state === s && <Halo p={[POSN[s][0], POSN[s][1], 0.7]} r={1.4} c={COL[s]} />}
          </group>))}
          {trail.length > 1 && <Packet path={trail} c={C.white} speed={0.12} r={0.15} />}
        </group>) : (<group>
          <Slab p={[-1.5, bar(race.expected) / 2, 0]} s={[1.4, bar(race.expected), 1.2]} c={C.green} glow={0.4} />
          <Slab p={[1.5, bar(race.counter) / 2, 0]} s={[1.4, bar(race.counter), 1.2]} c={race.lost > 0 ? C.red : C.green} glow={0.6} />
          <Txt p={[-1.5, bar(race.expected) + 0.5, 0]} s={String(race.expected)} h={0.5} c={C.green} />
          <Txt p={[1.5, bar(race.counter) + 0.5, 0]} s={String(race.counter)} h={0.5} c={race.lost > 0 ? C.red : C.green} />
          <Slab p={[-5, 1.2, 0]} s={[1.6, 1.0, 1.0]} c={C.blue} glow={0.3} /><Txt p={[-5, 1.2, 0.55]} s="t1" h={0.4} c="#ffffff" />
          <Slab p={[5, 1.2, 0]} s={[1.6, 1.0, 1.0]} c={C.orange} glow={0.3} /><Txt p={[5, 1.2, 0.55]} s="t2" h={0.4} c="#ffffff" />
          <Packet path={[[-5, 1.2, 0.5], [0, 2.6, 0.5], [-5, 1.2, 0.5]]} c={C.blue} speed={0.3} /><Packet path={[[5, 1.2, 0.5], [0, 2.6, 0.5], [5, 1.2, 0.5]]} c={C.orange} speed={0.3} phase={0.5} />
          <Led p={[0, 3.6, 0]} c={sync ? C.green : C.red} r={0.3} />
        </group>)}
      </group>)}
      readouts={view === "life" ? [
        ["Step", `${k} of ${THREAD_LIFE.length - 1}`], ["Thread state", cur.state], ["What happened", cur.note],
      ] : [
        ["Expected counter", String(race.expected)], ["Actual counter", String(race.counter)], ["Lost updates", String(race.lost)], ["Locking", sync ? "synchronized" : "none"], ["Switch every", `${q} micro-steps`],
      ]}
      controls={<>
        {view === "life" ? <Slider label="Step of the thread's life" value={step} min={0} max={11} step={1} digits={0} onChange={(x) => set("step", Math.round(x))} /> : <Slider label="Thread switch every (micro-steps)" value={q} min={1} max={6} step={1} digits={0} onChange={(x) => set("q", Math.round(x))} />}
        <Pick label="Experiment" value={view} options={[{ id: "life", label: "Thread life cycle" }, { id: "race", label: "Race condition on counter++" }]} onChange={(x) => set("view", x)} />
        {view === "race" && <Slider label="Increments per thread" value={n} min={5} max={40} step={1} digits={0} onChange={(x) => set("n", Math.round(x))} />}
        {view === "race" && <Check label="Make the increment synchronized" checked={sync} onChange={(x) => set("sync", x)} />}
      </>}
      note={view === "life" ? (
        <p>A thread starts <b>NEW</b>, <code>start()</code> makes it <b>RUNNABLE</b> and the scheduler decides when it is <b>RUNNING</b>. It can be <b>TIMED_WAITING</b> (sleep), <b>BLOCKED</b> (waiting for a monitor lock) or <b>WAITING</b> (<code>wait()</code>, until another thread calls <code>notify()</code>), and ends <b>TERMINATED</b>. A thread is created by extending Thread or, better, implementing Runnable (PYQ Q7.5). Priorities only hint to the scheduler.</p>
      ) : (
        <p><code>counter++</code> is really three steps: load, add, store. If the CPU switches threads between load and store, one thread overwrites the other&apos;s update and counts are <b>lost</b> (red bar). Making the increment <code>synchronized</code> lets only one thread hold the monitor lock at a time, so the three steps stay together and the total is always exact. Notice that some switch intervals (multiples of 3) happen not to break it: a race that only sometimes fails is the dangerous kind.</p>
      )}
    />
  );
}
