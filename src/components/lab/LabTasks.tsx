"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useLiveLab } from "@/labs/live-store";
import { useLocalJson } from "@/lib/local-store";
import { VideoButton } from "@/components/Videos";
import { recordLab } from "@/app/(app)/labs/actions";
import type { Params } from "@/labs/params-core";
import {
  buildTasks, changedKeys, grade, moveGoal, predictable, reached, scoreOf, showsPreset, summarise,
  type Dir, type RowResult, type SliderInfo, type Task,
} from "@/labs/challenge";

type Done = { right: number; total: number; summary: string };
type Saved = { done: Record<string, Done>; xp: number };
type Snap = { rows: { label: string; before: string }[]; params: Params | null; resets: number; presets: number; slider?: SliderInfo; goal?: { dir: "up" | "down"; target: number } };
type Run = { id: string; phase: "predict" | "test" | "result"; preds: Record<string, Dir>; snap?: Snap; result?: RowResult[]; problem?: string };

const DIRS: [Dir, string, string][] = [["up", "↑", "goes up"], ["down", "↓", "goes down"], ["same", "=", "stays the same"]];
const SAID: Record<Dir, string> = { up: "rise", down: "fall", same: "stay the same" };
const DID: Record<Dir, string> = { up: "rose", down: "fell", same: "did not change" };

export type LabTasksProps = {
  labId: string; title: string; topic: string;
  presets: { name: string; note: string; values: Params }[];
  course: string; unit: number; courseName: string; unitTitle: string;
};

/**
 * Predict → test → explain, inside every lab. The student commits to a prediction for each reading, makes the change
 * in the 3D lab themselves, and the panel compares their prediction with what the lab actually did. Changing a second
 * control spoils the test (and says why), so students also learn to change one thing at a time.
 */
export function LabTasks({ labId, title, topic, presets, course, unit, courseName, unitTitle }: LabTasksProps) {
  const live = useLiveLab(labId);
  const [saved, setSaved] = useLocalJson<Saved>(`lockin.tasks.${labId}`, { done: {}, xp: 0 });
  const tasks = useMemo(() => buildTasks(live.sliders, presets), [live.sliders, presets]);
  const rowsAll = predictable(live.readouts);
  const next = tasks.find((t) => !saved.done[t.id]) ?? null;
  const [run, setRun] = useState<Run | null>(null);
  const task: Task | null = tasks.find((t) => t.id === run?.id) ?? next;
  const r: Run = run && run.id === task?.id ? run : { id: task?.id ?? "", phase: "predict", preds: {} };
  const doneCount = tasks.filter((t) => saved.done[t.id]).length;
  const allDone = tasks.length > 0 && doneCount === tasks.length;
  const score = scoreOf(Object.values(saved.done));

  if (!live.sliders.length || !live.readouts.length) return <Shell done={0} total={0}><p className="text-sm text-muted" role="status">Getting the lab ready…</p></Shell>;
  if (!rowsAll.length || !tasks.length) return null; // a lab whose readings are all words has nothing to predict

  const slider = task?.kind === "slider" ? live.sliders.find((s) => s.label === task.slider) ?? null : null;
  const rowsNow = predictable(live.readouts, slider);
  const goal = r.snap?.goal ?? (slider ? moveGoal(slider) : undefined);
  const cause = task?.kind === "slider" ? `${goal?.dir === "down" ? "Lowering" : "Raising"} ${task.slider}` : task ? `Loading “${task.preset}”` : "";

  const lock = () => {
    if (!task) return;
    setRun({ ...r, phase: "test", problem: undefined, snap: { rows: rowsNow.map(([label, before]) => ({ label, before })), params: live.params, resets: live.resets, presets: live.presets, slider: slider ?? undefined, goal } });
  };
  const check = async () => {
    if (!task || !r.snap) return;
    const s = r.snap;
    if (task.kind === "slider") {
      if (live.resets !== s.resets || live.presets !== s.presets) return setRun({ ...r, phase: "predict", snap: undefined, problem: "The lab was reset or a preset was loaded during the test, so the before and after readings no longer match. Lock in your prediction again." });
      const moved = changedKeys(s.params, live.params);
      if (moved.length > 1) return setRun({ ...r, problem: `You changed ${moved.length} things. A fair test changes one thing only, otherwise you can't tell which change caused the result. Undo the other change or start this task again.` });
    } else if (!(live.lastPreset === task.preset && live.presets > s.presets && showsPreset(task.values, live.params))) {
      return setRun({ ...r, problem: `Load “${task.preset}” without changing anything after it, then check.` });
    }
    const result = grade(s.rows.map((x) => ({ ...x, predicted: r.preds[x.label] })), live.readouts);
    const done: Done = { right: result.filter((x) => x.right).length, total: result.length, summary: summarise(cause, result) };
    const all = { ...saved.done, [task.id]: done };
    setRun({ ...r, phase: "result", result, problem: undefined });
    setSaved({ ...saved, done: all });
    if (tasks.every((t) => all[t.id])) {
      const res = await recordLab({ lab: labId, kind: "tasks", score: scoreOf(Object.values(all)) }).catch(() => null);
      if (res?.xp) setSaved({ done: all, xp: saved.xp + res.xp });
    }
  };
  const again = () => setRun({ id: task?.id ?? "", phase: "predict", preds: {} });
  const goNext = () => setRun(null);
  const restartAll = () => { setSaved({ done: {}, xp: saved.xp }); setRun(null); };

  const stale = r.phase === "test" && task?.kind === "slider" && !!r.snap && (live.resets !== r.snap.resets || live.presets !== r.snap.presets);
  const ready = !stale && r.phase === "test" && (task?.kind === "slider" ? !!slider && !!goal && reached(goal, slider.value) : live.lastPreset === (task as { preset: string } | null)?.preset && live.presets > (r.snap?.presets ?? 0));
  const wrong = r.result?.filter((x) => !x.right) ?? [];
  const ask = `In the ${title} lab, ${cause.toLowerCase()} made ${(r.result ?? []).map((x) => `${x.label} go from ${x.before} to ${x.after}`).join(", ")}. Explain why, using the formula.`;

  return (
    <Shell done={doneCount} total={tasks.length}>
      {allDone && !run ? (
        <div className="grid gap-3" role="status">
          <p className="text-2xl font-black text-head">Lab tasks done · {score}% predicted right</p>
          {saved.xp > 0 && <p className="ok">+{saved.xp} XP added to your progress.</p>}
          <ul className="grid gap-1 text-sm">{tasks.map((t) => <li key={t.id}>✓ {saved.done[t.id].summary}</li>)}</ul>
          <div className="flex flex-wrap gap-2">
            <Link className="btn !min-h-10 !text-sm" href={`/practice/${course}`}>Practise {unitTitle}</Link>
            <Link className="btn btn-ghost !min-h-10 !text-sm" href={`/formulas?course=${course}&unit=${unit}`}>Formula cards</Link>
            <button type="button" className="btn btn-ghost !min-h-10 !text-sm" onClick={restartAll}>Do the tasks again</button>
          </div>
        </div>
      ) : task && (
        <div className="grid gap-3">
          <p className="text-xs font-black uppercase tracking-wide text-muted">Task {tasks.indexOf(task) + 1} of {tasks.length} · {task.kind === "slider" ? "change one thing" : "try a ready-made setup"}</p>
          <h3 className="text-lg leading-snug">
            {task.kind === "slider"
              ? <>What happens to the readings when you {goal?.dir === "down" ? "lower" : "raise"} <b>{task.slider}</b>?</>
              : <>What will the readings do when you load <b>“{task.preset}”</b>?</>}
          </h3>
          {task.kind === "preset" && r.phase !== "result" && <p className="text-sm text-muted">{task.note}</p>}

          {r.phase !== "result" ? (
            <>
              <p className="text-sm font-bold text-head">{r.phase === "predict" ? "1. Predict each reading first:" : "Your prediction (locked):"}</p>
              <ul className="grid gap-2">
                {(r.snap?.rows ?? rowsNow.map(([label, before]) => ({ label, before }))).map(({ label, before }) => (
                  <li key={label} className="flex flex-wrap items-center gap-2 rounded-2xl border-2 border-line p-2">
                    <span className="min-w-0 flex-1 text-sm"><b className="text-head">{label}</b> <span className="tabular-nums text-muted">now {before}</span></span>
                    <span role="radiogroup" aria-label={`${label}: your prediction`} className="flex gap-1">
                      {DIRS.map(([d, sym, word]) => (
                        <button key={d} type="button" role="radio" aria-checked={r.preds[label] === d} aria-label={`${label} ${word}`} disabled={r.phase !== "predict"}
                          onClick={() => setRun({ ...r, preds: { ...r.preds, [label]: d } })}
                          className={`h-10 w-10 rounded-xl border-2 text-lg font-black ${r.preds[label] === d ? "border-blue bg-blue-l text-blue-t" : "border-line text-ink"} disabled:opacity-70`}>{sym}</button>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
              {r.phase === "predict" ? (
                <button type="button" className="btn btn-blue" disabled={rowsNow.some(([l]) => !r.preds[l])} onClick={lock}>Lock in my prediction</button>
              ) : (
                <div className="grid gap-2 rounded-2xl bg-soft p-3">
                  {task.kind === "slider" && slider && goal ? (
                    <>
                      <p className="text-sm text-head"><b>2. Now test it:</b> move <b>{task.slider}</b> {goal.dir === "up" ? "up" : "down"} to <b>{goal.target}{slider.unit}</b> or {goal.dir === "up" ? "more" : "less"}, here or in the lab controls. Leave everything else alone.</p>
                      {slider.set && (
                        <label className="grid gap-1 text-sm font-extrabold text-head">
                          <span className="flex justify-between"><span>{task.slider}</span><span className="tabular-nums text-blue-t">{Number(slider.value.toFixed(slider.digits))}{slider.unit}</span></span>
                          <input type="range" min={slider.min} max={slider.max} step={slider.step} value={slider.value} aria-label={`${task.slider} (task)`}
                            onChange={(e) => slider.set?.(Number(e.target.value))} className="h-8 w-full accent-[#1476b8]" />
                        </label>
                      )}
                    </>
                  ) : task.kind === "preset" ? (
                    <p className="flex flex-wrap items-center gap-2 text-sm text-head"><b>2. Now test it:</b> load the setup and watch the readings.
                      <button type="button" className="btn btn-ghost !min-h-9 !px-3 !text-sm" onClick={() => window.dispatchEvent(new CustomEvent("lab:preset", { detail: task.preset }))}>Load “{task.preset}”</button></p>
                  ) : null}
                  <button type="button" className="btn" disabled={!ready} onClick={check}>Check what happened</button>
                </div>
              )}
              {stale ? (
                <div className="grid gap-2" role="alert">
                  <p className="err">The lab was reset or a different setup was loaded during the test, so the before and after readings no longer match. Lock in your prediction again from here.</p>
                  <button type="button" className="btn btn-ghost" onClick={() => setRun({ ...r, phase: "predict", snap: undefined, problem: undefined })}>Predict again</button>
                </div>
              ) : r.problem && <p className="err" role="alert">{r.problem}</p>}
            </>
          ) : (
            <div className="grid gap-3">
              <ul className="grid gap-1.5" aria-label="What the lab did">
                {r.result!.map((x) => (
                  <li key={x.label} className={`rounded-2xl border-2 p-2 text-sm ${x.right ? "border-green bg-green-l" : "border-red bg-red-l"}`}>
                    <b className="text-head">{x.right ? "✓" : "✗"} {x.label}</b>: <span className="tabular-nums">{x.before} → {x.after}</span>
                    <span className="block text-muted">It {x.actual ? DID[x.actual] : "changed"}{x.right ? ", as you said." : `; you said it would ${SAID[x.predicted]}.`}</span>
                  </li>
                ))}
              </ul>
              <p className="font-bold text-head">{summarise(cause, r.result!)}{task.kind === "preset" ? ` ${task.note}` : ""}</p>
              {wrong.length > 0 && (
                <div className="coach" aria-label="Understand why">
                  <p className="text-sm text-head">A wrong prediction is useful: it shows exactly which link you had backwards. Find {wrong[0].label} in the formula and see how it depends on {task.kind === "slider" ? task.slider : "the values that changed"}.</p>
                  <div className="coach-row">
                    <button type="button" className="voice-btn" onClick={() => window.dispatchEvent(new Event("lab:theory"))}>Read the theory</button>
                    <VideoButton query={`${topic} ${courseName}`} label="Watch an explainer" className="voice-btn" />
                    <Link className="voice-btn no-underline" href={`/learn/${course}/${unit}`}>Re-read Unit {unit}</Link>
                    <Link className="voice-btn no-underline" href={`/ask?course=${course}&unit=${unit}&q=${encodeURIComponent(ask.slice(0, 900))}`}>Ask Lochi why</Link>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn" onClick={goNext}>{doneCount === tasks.length ? "See my result" : "Next task"}</button>
                <button type="button" className="btn btn-ghost" onClick={again}>Try this task again</button>
              </div>
            </div>
          )}
        </div>
      )}
    </Shell>
  );
}

function Shell({ done, total, children }: { done: number; total: number; children: React.ReactNode }) {
  return (
    <section aria-labelledby="lab-tasks-h" data-testid="lab-tasks" className="card grid gap-3">
      <div className="flex items-center gap-2">
        <h2 id="lab-tasks-h" className="text-xl">Predict, test, explain</h2>
        {total > 0 && <span className="chip chip-th ml-auto tabular-nums">{done}/{total}</span>}
      </div>
      {total > 0 && <div className="bar" role="progressbar" aria-label="Lab tasks done" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}><i style={{ width: `${(done / total) * 100}%` }} /></div>}
      {children}
    </section>
  );
}
