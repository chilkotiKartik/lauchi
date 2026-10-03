"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { StartQuizButton } from "@/components/StartQuizButton";
import { Lochi } from "@/components/Lochi";
import { sfx } from "@/lib/sound";
import { openChest } from "@/app/(app)/learn/actions";
import { CHEST_PCT, CHEST_XP } from "@/lib/subject-progress";

export type PathUnit = {
  n: number; title: string; color: string;
  read: { done: number; total: number };
  practice: { available: boolean; pct: number | null; stars: 0 | 1 | 2 | 3; attempts: number };
  lab: { id: string; title: string; done: boolean } | null;
  chest: { ready: boolean; opened: boolean };
};
type Node = { key: string; kind: "read" | "practice" | "lab" | "chest"; done: boolean };

/** The nodes of a unit in order; a node is done only on real evidence (topics read, a star, a finished lab, an opened chest). */
export function unitNodes(u: PathUnit): Node[] {
  const out: Node[] = [{ key: `r${u.n}`, kind: "read", done: u.read.total > 0 && u.read.done >= u.read.total }];
  if (u.practice.available) out.push({ key: `p${u.n}`, kind: "practice", done: u.practice.stars > 0 });
  if (u.lab) out.push({ key: `l${u.n}`, kind: "lab", done: u.lab.done });
  if (u.practice.available) out.push({ key: `c${u.n}`, kind: "chest", done: u.chest.opened });
  return out;
}

const OFFSET = [0, 44, 64, 44, 0, -44, -64, -44]; // the zig-zag of a Duolingo path, in px

/**
 * A subject as a level path: every unit is a section of nodes (read → practice → 3D lab → chest). The next thing
 * to do is highlighted; nothing is hard-locked, so a student can always jump to the unit their exam needs.
 */
export function SubjectPath({ course, units, mockHref }: { course: string; units: PathUnit[]; mockHref: string | null }) {
  const [opened, setOpened] = useState<Record<number, number>>({});
  const [msg, setMsg] = useState<{ unit: number; ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const all = units.flatMap((u) => unitNodes({ ...u, chest: { ...u.chest, opened: u.chest.opened || u.n in opened } }).map((x) => ({ ...x, unit: u })));
  const current = all.find((x) => !x.done)?.key ?? null;
  const doneCount = all.filter((x) => x.done).length;

  const open = (u: PathUnit) => start(async () => {
    const r = await openChest({ course, unit: u.n });
    if (r.ok) { sfx.chest(); setOpened((o) => ({ ...o, [u.n]: r.xp })); setMsg({ unit: u.n, ok: true, text: r.xp ? `+${r.xp} XP! Unit ${u.n} chest opened.` : "Already opened. Your XP was added before." }); }
    else setMsg({ unit: u.n, ok: false, text: r.error });
  });

  return (
    <section aria-labelledby="path-h" className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="path-h" className="text-xl">Level path</h2>
        <span className="text-sm font-bold text-muted">{doneCount} of {all.length} levels done</span>
      </div>
      <div className="bar" role="progressbar" aria-label="Levels done" aria-valuemin={0} aria-valuemax={all.length} aria-valuenow={doneCount}><i style={{ width: `${(doneCount / Math.max(1, all.length)) * 100}%` }} /></div>
      {units.map((u) => {
        const nodes = unitNodes({ ...u, chest: { ...u.chest, opened: u.chest.opened || u.n in opened } });
        return (
          <section key={u.n} aria-labelledby={`pu-${u.n}`} className="flex flex-col gap-4">
            <Link href={`/learn/${course}/${u.n}`} className="flex items-center gap-3 rounded-3xl p-4 text-white no-underline shadow-[0_4px_0_rgba(0,0,0,0.2)]" style={{ background: u.color }}>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-black uppercase tracking-wider">Unit {u.n}</span>
                <b id={`pu-${u.n}`} className="block text-lg leading-snug">{u.title}</b>
              </span>
              <span className="rounded-2xl bg-black/15 px-3 py-1 text-sm font-black">{u.read.done}/{u.read.total} topics</span>
            </Link>
            <ol className="flex flex-col items-center gap-10 pb-1 pt-9">
              {nodes.map((x, i) => {
                const isCurrent = x.key === current;
                const style = { transform: `translateX(${OFFSET[i % OFFSET.length]}px)` };
                const ring = x.done ? "bg-[var(--gold)] text-[#4a3000] shadow-[0_6px_0_#b98a00]" : isCurrent ? "text-white shadow-[0_6px_0_rgba(0,0,0,0.25)]" : "bg-soft text-muted shadow-[0_6px_0_var(--line)]";
                const bg = !x.done && isCurrent ? { background: u.color } : undefined;
                const cls = `relative grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full text-2xl font-black no-underline transition-transform active:translate-y-1 ${ring}`;
                const badge = isCurrent && <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl border-2 border-line bg-card px-3 py-1 text-xs font-black uppercase text-head shadow">Start</span>;
                return (
                  <li key={x.key} style={style} className="flex flex-col items-center gap-1.5">
                    {x.kind === "read" && (
                      <Link href={`/learn/${course}/${u.n}`} className={cls} style={bg} aria-label={`Read unit ${u.n}: ${u.read.done} of ${u.read.total} topics done`}>{badge}{x.done ? "✓" : "📖"}</Link>
                    )}
                    {x.kind === "practice" && (
                      <StartQuizButton kind="practice" course={course} unit={u.n} className={cls} style={bg} label={`Practise unit ${u.n}${u.practice.pct !== null ? `: best ${u.practice.pct}%` : ""}`}>{badge}{x.done ? "★" : "✎"}</StartQuizButton>
                    )}
                    {x.kind === "lab" && u.lab && (
                      <Link href={`/labs/${u.lab.id}`} className={cls} style={bg} aria-label={`3D lab: ${u.lab.title}${u.lab.done ? " (done)" : ""}`}>{badge}{x.done ? "✓" : "🧪"}</Link>
                    )}
                    {x.kind === "chest" && (
                      <button type="button" className={`${cls} ${!u.chest.ready && !x.done ? "opacity-60" : ""}`} style={bg} disabled={pending} onClick={() => open(u)}
                        aria-label={x.done ? `Unit ${u.n} chest opened` : u.chest.ready ? `Open unit ${u.n} chest for ${CHEST_XP} XP` : `Unit ${u.n} chest: score ${CHEST_PCT}% in practice to open`}>{badge}{x.done ? "🎁" : u.chest.ready ? "🎁" : "🔒"}</button>
                    )}
                    <span className="text-xs font-bold text-muted">
                      {x.kind === "read" ? "Read" : x.kind === "practice" ? (u.practice.attempts ? <span aria-label={`${u.practice.stars} of 3 stars`}>{"★".repeat(u.practice.stars)}{"☆".repeat(3 - u.practice.stars)} {u.practice.pct}%</span> : "Practice") : x.kind === "lab" ? "3D lab" : x.done ? "Opened" : `Chest · ${CHEST_XP} XP`}
                    </span>
                    {x.kind === "chest" && msg?.unit === u.n && <p role={msg.ok ? "status" : "alert"} className={`max-w-[16rem] text-center text-sm ${msg.ok ? "ok" : "err"}`}>{msg.text}</p>}
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
      {mockHref && (
        <div className="flex flex-col items-center gap-2 pb-2 text-center">
          <Lochi mood={doneCount === all.length ? "happy" : "idle"} size={64} />
          <Link href={mockHref} className="btn">Take a full mock test</Link>
          <p className="text-sm text-muted">The final level: a timed paper like the real end-sem.</p>
        </div>
      )}
    </section>
  );
}
