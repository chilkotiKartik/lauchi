"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { StartQuizButton } from "@/components/StartQuizButton";

export interface DashboardCourseOption {
  code: string;
  short: string;
  name: string;
  units: { n: number; title: string }[];
}

export interface UnitPerformance {
  course: string;
  unit: number;
  pct: number;
  attempts: number;
}

export function DuolingoDashboardPath({
  courses,
  initialCourseCode,
  unitStats,
  streak,
  todayXp,
  dailyGoal,
  days,
  today,
}: {
  courses: DashboardCourseOption[];
  initialCourseCode: string;
  unitStats: UnitPerformance[];
  streak: number;
  todayXp: number;
  dailyGoal: number;
  days: Record<string, number>;
  today: string;
}) {
  const [selectedCourse, setSelectedCourse] = useState<string>(initialCourseCode || (courses[0]?.code ?? ""));

  const activeCourse = useMemo(() => {
    return courses.find((c) => c.code === selectedCourse) || courses[0];
  }, [courses, selectedCourse]);

  const activeStats = useMemo(() => {
    return unitStats.filter((u) => u.course === activeCourse?.code);
  }, [unitStats, activeCourse]);

  const weakUnit = useMemo(() => {
    const sorted = [...activeStats].sort((a, b) => a.pct - b.pct);
    return sorted[0] && sorted[0].pct < 60 ? sorted[0].unit : null;
  }, [activeStats]);

  // Compute 7 days streak status
  const weekDays = useMemo(() => {
    const list = [];
    const now = new Date(today);
    const dayLabels = ["Su", "M", "Tu", "W", "Th", "F", "Sa"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const isToday = i === 0;
      const xp = days[iso] ?? (isToday ? todayXp : 0);
      list.push({
        dayName: dayLabels[d.getDay()],
        dateStr: iso,
        isToday,
        done: xp > 0,
        xp,
      });
    }
    return list;
  }, [today, todayXp, days]);

  if (!activeCourse) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Duolingo Daily Streak & XP Header Banner */}
      <div className="card relative overflow-hidden border-2 border-line bg-gradient-to-br from-surface via-surface to-soft p-5 shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-500">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="animate-pulse text-orange-500"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-head">{streak} Day Streak</h3>
                {todayXp > 0 && (
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-black text-emerald-400">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-muted">
                {todayXp >= dailyGoal
                  ? "Daily goal reached! Lochi is super proud 🎉"
                  : `${Math.max(0, dailyGoal - todayXp)} XP needed today to reach your goal`}
              </p>
            </div>
          </div>

          {/* 7-Day Interactive Streak Cycle */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {weekDays.map((w) => (
              <div
                key={w.dateStr}
                title={`${w.dateStr}: ${w.xp} XP`}
                className={`flex h-11 w-10 flex-col items-center justify-center rounded-xl border transition-transform hover:scale-105 ${
                  w.isToday
                    ? "border-orange-500 bg-orange-500/15 font-black text-orange-400 ring-2 ring-orange-500/30"
                    : w.done
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold"
                    : "border-line bg-soft/60 text-muted font-bold"
                }`}
              >
                <span className="text-[10px] uppercase">{w.dayName}</span>
                {w.done ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-muted/40" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar towards daily goal */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-black text-muted mb-1.5">
            <span>DAILY PROGRESS</span>
            <span className="text-head tabular-nums">{todayXp} / {dailyGoal} XP</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-soft border border-line">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${Math.min(100, (todayXp / Math.max(1, dailyGoal)) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Subject Selector Tabs */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-muted flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Select Course Journey
          </span>
          <Link
            href={`/practice/${activeCourse.code}`}
            className="text-xs font-black text-blue hover:underline flex items-center gap-1"
          >
            Full View &rarr;
          </Link>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {courses.map((c) => {
            const isSelected = c.code === activeCourse.code;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => setSelectedCourse(c.code)}
                className={`flex shrink-0 items-center gap-2 rounded-xl border-2 px-3.5 py-2 text-xs font-black transition-all ${
                  isSelected
                    ? "border-blue bg-blue text-white shadow-md shadow-blue/20"
                    : "border-line bg-surface text-head hover:bg-soft"
                }`}
              >
                <span>{c.short}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Duolingo Winding Stepped Learning Path */}
      <div className="card relative flex flex-col items-center overflow-hidden border-2 border-line bg-surface/90 p-6 shadow-xl">
        {/* Course Banner */}
        <div className="mb-10 w-full rounded-2xl border border-line bg-soft/80 p-4 text-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted">{activeCourse.code}</span>
          <h2 className="text-xl font-black text-head">{activeCourse.name}</h2>
          <p className="mt-1 text-xs font-bold text-muted">Complete units step-by-step to achieve syllabus mastery</p>
        </div>

        {/* Stepped Nodes */}
        <div className="flex w-full flex-col items-center gap-10">
          {activeCourse.units.map((u, idx) => {
            const st = activeStats.find((s) => s.unit === u.n);
            const isCompleted = st ? st.pct >= 70 : false;
            const isWeak = weakUnit === u.n;
            const isNext = !isCompleted && (idx === 0 || activeStats.some((s) => s.unit === idx && s.pct >= 50));

            const offsetClass =
              idx % 4 === 1
                ? "translate-x-8"
                : idx % 4 === 2
                ? "-translate-x-8"
                : idx % 4 === 3
                ? "translate-x-4"
                : "translate-x-0";

            return (
              <div key={u.n} className={`flex flex-col items-center text-center transition-transform ${offsetClass}`}>
                {/* Speech / Action Bubble */}
                {isWeak ? (
                  <div className="animate-bounce mb-2.5 rounded-full border border-red-500/40 bg-red-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-red-400 shadow-md">
                    FIX THIS ⚠️
                  </div>
                ) : isNext ? (
                  <div className="animate-pulse mb-2.5 rounded-full border border-green-500/40 bg-green-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-green-400 shadow-md flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                    START HERE
                  </div>
                ) : null}

                {/* 3D Pushable Round Node */}
                <div className="relative group">
                  <StartQuizButton
                    kind="practice"
                    course={activeCourse.code}
                    unit={u.n}
                    className={`relative flex h-20 w-20 items-center justify-center rounded-full border-4 shadow-lg transition-transform active:translate-y-1 ${
                      isWeak
                        ? "border-red-600 bg-red-500 shadow-[0_6px_0_#991b1b] text-white"
                        : isCompleted
                        ? "border-emerald-600 bg-emerald-500 shadow-[0_6px_0_#065f46] text-white"
                        : "border-blue-600 bg-blue-500 shadow-[0_6px_0_#1e40af] text-white"
                    }`}
                  >
                    {isCompleted ? (
                      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                    ) : (
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>
                    )}
                  </StartQuizButton>

                  {/* Accuracy Badge */}
                  {st && (
                    <span className="absolute -bottom-2 -right-2 rounded-full border border-line bg-card px-2 py-0.5 text-[10px] font-black tabular-nums text-head shadow">
                      {st.pct}%
                    </span>
                  )}
                </div>

                {/* Node Label */}
                <div className="mt-3 max-w-[200px]">
                  <span className="text-[10px] font-extrabold uppercase tracking-wide text-muted">
                    Unit {u.n}
                  </span>
                  <h4 className="text-sm font-black text-head line-clamp-2">
                    {u.title}
                  </h4>
                </div>
              </div>
            );
          })}

          {/* Golden Capstone Mock Test Trophy at end of path */}
          <div className="mt-4 flex flex-col items-center text-center">
            <Link
              href={`/mock`}
              className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-amber-500 bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 shadow-[0_8px_0_#b45309] transition-transform hover:scale-105 active:translate-y-1"
            >
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H7.5a1.5 1.5 0 0 0 0 3h9a1.5 1.5 0 0 0 0-3H15c-.55 0-1-.45-1-1v-2.34"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
              <span className="absolute -top-2 rounded-full bg-slate-900 border border-amber-400 px-2 py-0.5 text-[9px] font-black uppercase text-amber-400 shadow">
                Full Mock
              </span>
            </Link>
            <div className="mt-3 max-w-[200px]">
              <span className="text-[10px] font-extrabold uppercase tracking-wide text-amber-400">
                Capstone Challenge
              </span>
              <h4 className="text-sm font-black text-head">
                Full Subject Exam Mock
              </h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
