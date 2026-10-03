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

const OFFSET = [0, 52, 72, 52, 0, -52, -72, -52]; // the zig-zag of a Duolingo path, in px

/* crisp line icons (inherit currentColor) */
const I = {
  read: <path d="M12 6.5C10.2 5.2 7.8 4.5 4.5 4.5v13.5c3.3 0 5.7.7 7.5 2 1.8-1.3 4.2-2 7.5-2V4.5c-3.3 0-5.7.7-7.5 2zM12 6.5V20" />,
  practice: <path d="M14.5 4.5l5 5L9 20H4v-5zM12.5 6.5l5 5" />,
  lab: <path d="M9 3h6M10 3v6l-5.5 9.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3M7.5 15h9" />,
  chest: <path d="M3 10h18v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM3 10l2-5h14l2 5M10 13h4v3h-4z" />,
  lock: <path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3" />,
  done: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  star: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" />,
};
const Icon = ({ d, size = 30 }: { d: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{d}</svg>
);
const NAME: Record<Node["kind"], string> = { read: "Read the unit", practice: "Practice quiz", lab: "3D lab", chest: "Unit chest" };

/**
 * A subject as a level path: every unit is a section of nodes (read → practice → 3D lab → chest). The next thing
 * to do is highlighted; nothing is hard-locked, so a student can always jump to the unit their exam needs.
 */
export function SubjectPath({ course, units, mockHref }: { course: string; units: PathUnit[]; mockHref: string | null }) {
  const [opened, setOpened] = useState<Record<number, number>>({});
  const [msg, setMsg] = useState<{ unit: number; ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const live = units.map((u) => ({ ...u, chest: { ...u.chest, opened: u.chest.opened || u.n in opened } }));
  const all = live.flatMap((u) => unitNodes(u).map((x) => ({ ...x, unit: u })));
  const next = all.find((x) => !x.done) ?? null;
  const current = next?.key ?? null;
  const doneCount = all.filter((x) => x.done).length;
  const stars = live.reduce((a, u) => a + u.practice.stars, 0), maxStars = live.filter((u) => u.practice.available).length * 3;
  const chests = live.filter((u) => u.chest.opened).length, chestTotal = live.filter((u) => u.practice.available).length;
  const labs = live.filter((u) => u.lab?.done).length, labTotal = live.filter((u) => u.lab).length;

  const open = (u: PathUnit) => start(async () => {
    const r = await openChest({ course, unit: u.n });
    if (r.ok) { sfx.chest(); setOpened((o) => ({ ...o, [u.n]: r.xp })); setMsg({ unit: u.n, ok: true, text: r.xp ? `+${r.xp} XP! Unit ${u.n} chest opened.` : "Already opened. Your XP was added before." }); }
    else setMsg({ unit: u.n, ok: false, text: r.error });
  });

  /** The button or link for one level, styled by its state. */
  const levelControl = (u: PathUnit, x: Node, big: boolean) => {
    const isCurrent = x.key === current;
    const locked = x.kind === "chest" && !u.chest.ready && !x.done;
    const size = big ? "h-[4.75rem] w-[4.75rem]" : "h-12 w-12";
    const look = x.done
      ? { cls: "text-[#5a3d00] shadow-[0_6px_0_#b98a00]", style: { background: "linear-gradient(160deg,#ffd75e,#f2b705)" } }
      : isCurrent
        ? { cls: "text-white shadow-[0_6px_0_rgba(0,0,0,0.28)]", style: { background: u.color } }
        : { cls: "shadow-[0_6px_0_var(--line)]", style: { background: `color-mix(in srgb, ${u.color} 16%, var(--card))`, color: u.color, border: `3px solid color-mix(in srgb, ${u.color} 45%, transparent)` } };
    const cls = `relative grid ${size} place-items-center rounded-full no-underline transition-transform hover:-translate-y-0.5 active:translate-y-1 ${look.cls} ${locked ? "opacity-70" : ""}`;
    const icon = <Icon size={big ? 32 : 22} d={x.done ? (x.kind === "practice" ? I.star : I.done) : locked ? I.lock : I[x.kind]} />;
    const pulse = big && isCurrent && <span aria-hidden className="absolute inset-0 rounded-full motion-safe:animate-ping" style={{ background: u.color, opacity: 0.25 }} />;
    const inner = <>{pulse}{icon}</>;
    if (x.kind === "read") return <Link href={`/learn/${course}/${u.n}`} className={cls} style={look.style} aria-label={`Read unit ${u.n}: ${u.read.done} of ${u.read.total} topics done`}>{inner}</Link>;
    if (x.kind === "practice") return <StartQuizButton kind="practice" course={course} unit={u.n} className={cls} style={look.style} label={`Practise unit ${u.n}${u.practice.pct !== null ? `: best ${u.practice.pct}%` : ""}`}>{inner}</StartQuizButton>;
    if (x.kind === "lab" && u.lab) return <Link href={`/labs/${u.lab.id}`} className={cls} style={look.style} aria-label={`3D lab: ${u.lab.title}${u.lab.done ? " (done)" : ""}`}>{inner}</Link>;
    return (
      <button type="button" className={cls} style={look.style} disabled={pending} onClick={() => open(u)}
        aria-label={x.done ? `Unit ${u.n} chest opened` : u.chest.ready ? `Open unit ${u.n} chest for ${CHEST_XP} XP` : `Unit ${u.n} chest: score ${CHEST_PCT}% in practice to open`}>{inner}</button>
    );
  };
  const caption = (u: PathUnit, x: Node) => x.kind === "read" ? `Read · ${u.read.done}/${u.read.total}`
    : x.kind === "practice" ? (u.practice.attempts ? <span aria-label={`${u.practice.stars} of 3 stars, best ${u.practice.pct}%`}>{"★".repeat(u.practice.stars)}{"☆".repeat(3 - u.practice.stars)} {u.practice.pct}%</span> : "Practice")
    : x.kind === "lab" ? (x.done ? "3D lab · done" : "3D lab") : x.done ? "Chest opened" : u.chest.ready ? `Open · +${CHEST_XP} XP` : `Chest · ${CHEST_PCT}% to open`;

  return (
    <section aria-labelledby="path-h" className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="path-h" className="text-xl">Level path</h2>
          <span className="text-sm font-bold text-muted">{doneCount} of {all.length} levels done</span>
        </div>
        <div className="bar" role="progressbar" aria-label="Levels done" aria-valuemin={0} aria-valuemax={all.length} aria-valuenow={doneCount}><i style={{ width: `${(doneCount / Math.max(1, all.length)) * 100}%` }} /></div>
        {live.map((u, ui) => {
          const nodes = unitNodes(u);
          const uDone = nodes.filter((x) => x.done).length;
          return (
            <section key={u.n} aria-labelledby={`pu-${u.n}`} className="flex flex-col gap-2">
              <div className="flex items-center gap-3 rounded-3xl p-4 text-white shadow-[0_5px_0_rgba(0,0,0,0.22)]" style={{ background: u.color }}>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-black uppercase tracking-wider">Unit {u.n} · {uDone}/{nodes.length} levels</span>
                  <b id={`pu-${u.n}`} className="block text-lg leading-snug">{u.title}</b>
                  <span className="mt-2 block h-2 overflow-hidden rounded-full bg-black/20" aria-hidden><span className="block h-full rounded-full bg-white" style={{ width: `${(uDone / nodes.length) * 100}%` }} /></span>
                </span>
                <Link href={`/learn/${course}/${u.n}`} className="shrink-0 rounded-2xl border-2 border-white/60 px-3 py-2 text-xs font-black uppercase text-white no-underline hover:bg-white/15">Guidebook</Link>
              </div>
              <ol className="relative mx-auto flex w-full max-w-sm flex-col items-center gap-3 pb-2 pt-10">
                {nodes.map((x, i) => {
                  const isCurrent = x.key === current;
                  const off = OFFSET[i % OFFSET.length], prev = i ? OFFSET[(i - 1) % OFFSET.length] : off;
                  return (
                    <li key={x.key} className="flex flex-col items-center" style={{ transform: `translateX(${off}px)` }}>
                      {i > 0 && (
                        <span aria-hidden className="mb-2 flex h-8 flex-col justify-between">
                          {[0.75, 0.5, 0.25].map((t) => <span key={t} className="block h-1.5 w-1.5 rounded-full" style={{ transform: `translateX(${(prev - off) * t}px)`, background: x.done ? "#f2b705" : `color-mix(in srgb, ${u.color} 40%, var(--line))` }} />)}
                        </span>
                      )}
                      <span className="relative">
                        {isCurrent && <span className="absolute -top-10 left-1/2 z-[1] -translate-x-1/2 whitespace-nowrap rounded-xl border-2 border-line bg-card px-3 py-1 text-xs font-black uppercase shadow" style={{ color: u.color }}>Start</span>}
                        {levelControl(u, x, true)}
                      </span>
                      <span className="mt-2 text-xs font-bold text-muted">{caption(u, x)}</span>
                      {x.kind === "chest" && msg?.unit === u.n && <p role={msg.ok ? "status" : "alert"} className={`mt-1 max-w-[16rem] text-center text-sm ${msg.ok ? "ok" : "err"}`}>{msg.text}</p>}
                    </li>
                  );
                })}
                <span aria-hidden className={`pointer-events-none absolute top-1/2 hidden -translate-y-1/2 sm:block ${ui % 2 ? "left-0" : "right-0"}`}>
                  <Lochi mood={uDone === nodes.length ? "happy" : "idle"} size={72} />
                </span>
              </ol>
            </section>
          );
        })}
        {mockHref && (
          <div className="flex flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-line p-5 text-center">
            <Lochi mood={doneCount === all.length ? "happy" : "idle"} size={64} />
            <b className="text-lg text-head">Final level: full mock test</b>
            <p className="text-sm text-muted">A timed paper like the real end-sem, across every unit.</p>
            <Link href={mockHref} className="btn">Take a mock test</Link>
          </div>
        )}
      </div>

      <aside aria-label="Up next" className="flex flex-col gap-3 lg:sticky lg:top-4">
        <div className="card flex flex-col gap-3">
          <p className="text-xs font-black uppercase tracking-wide text-muted">Up next</p>
          {next ? (
            <div className="flex items-center gap-3">
              {levelControl(next.unit, next, false)}
              <span className="min-w-0"><b className="block text-head">{NAME[next.kind]}</b><span className="block text-sm text-muted">Unit {next.unit.n}: {next.unit.title}</span></span>
            </div>
          ) : <p className="font-bold text-head">Every level done. Take a mock test to finish the subject.</p>}
        </div>
        <dl className="card grid grid-cols-3 gap-2 text-center">
          <div><dt className="text-xs font-bold text-muted">Stars</dt><dd className="text-xl font-black text-head">{stars}<span className="text-sm text-muted">/{maxStars}</span></dd></div>
          <div><dt className="text-xs font-bold text-muted">Chests</dt><dd className="text-xl font-black text-head">{chests}<span className="text-sm text-muted">/{chestTotal}</span></dd></div>
          <div><dt className="text-xs font-bold text-muted">3D labs</dt><dd className="text-xl font-black text-head">{labs}<span className="text-sm text-muted">/{labTotal}</span></dd></div>
        </dl>
        <p className="hidden text-sm text-muted lg:block">Stars come from your best practice score in a unit (60%, 75%, 90%). A unit&apos;s chest opens at one star and pays {CHEST_XP} XP once.</p>
      </aside>
    </section>
  );
}
