"use client";
import Link from "next/link";
import { StartQuizButton } from "@/components/StartQuizButton";

export interface DuolingoUnit {
  n: number;
  title: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  isNext: boolean;
  accuracy?: number;
}

export function DuolingoCoursePath({
  courseCode,
  courseName,
  units,
  weakUnit,
}: {
  courseCode: string;
  courseName: string;
  units: DuolingoUnit[];
  weakUnit?: number | null;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-6">
      {/* Subject Header */}
      <div className="mb-8 w-full rounded-2xl border-2 border-line bg-surface p-4 text-center shadow-md">
        <span className="text-xs font-black uppercase tracking-wider text-muted">{courseCode}</span>
        <h2 className="mt-1 text-2xl font-black text-head">{courseName}</h2>
        <p className="mt-1 text-xs font-bold text-muted">Complete units step-by-step to master the syllabus</p>
      </div>

      {/* Stepped Node Journey */}
      <div className="flex w-full flex-col items-center gap-10">
        {units.map((u, idx) => {
          // Alternating stepping curve: center, right, left, right, center
          const offsetClass =
            idx % 4 === 1
              ? "translate-x-8"
              : idx % 4 === 2
              ? "-translate-x-8"
              : idx % 4 === 3
              ? "translate-x-4"
              : "translate-x-0";

          const isWeak = weakUnit === u.n;

          return (
            <div key={u.n} className={`flex flex-col items-center text-center transition-transform ${offsetClass}`}>
              {/* Floating Action / Speech Bubble Badge */}
              {isWeak ? (
                <div className="animate-bounce mb-2.5 rounded-full border border-red-500/40 bg-red-500/20 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-red-400 shadow-lg">
                  FIX THIS ⚠️
                </div>
              ) : u.isNext ? (
                <div className="animate-pulse mb-2.5 rounded-full border border-green-500/40 bg-green-500/20 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-green-400 shadow-lg flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                  START HERE
                </div>
              ) : null}

              {/* 3D Chunky Circular Node Button */}
              {u.isUnlocked ? (
                <div className="relative group">
                  <StartQuizButton
                    kind="practice"
                    course={courseCode}
                    unit={u.n}
                    className={`relative flex h-24 w-24 items-center justify-center rounded-full border-4 shadow-xl transition-transform active:translate-y-1 ${
                      isWeak
                        ? "border-red-600 bg-red-500 shadow-[0_8px_0_#991b1b] text-white"
                        : u.isCompleted
                        ? "border-emerald-600 bg-emerald-500 shadow-[0_8px_0_#065f46] text-white"
                        : "border-blue-600 bg-blue-500 shadow-[0_8px_0_#1e40af] text-white"
                    }`}
                  >
                    {u.isCompleted ? (
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                    ) : (
                      <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>
                    )}
                  </StartQuizButton>

                  {/* Progress ring halo */}
                  {u.accuracy !== undefined && (
                    <span className="absolute -bottom-2 -right-2 rounded-full border border-line bg-card px-2 py-0.5 text-[10px] font-black tabular-nums text-head shadow">
                      {u.accuracy}%
                    </span>
                  )}
                </div>
              ) : (
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-slate-700 bg-slate-800 text-slate-500 shadow-[0_8px_0_#1e293b]">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
              )}

              {/* Node Title & Description */}
              <div className="mt-3 max-w-[200px]">
                <span className="text-[11px] font-black uppercase tracking-wider text-muted">
                  Unit {u.n}
                </span>
                <h3 className="text-base font-black text-head line-clamp-2">
                  {u.title}
                </h3>
              </div>
            </div>
          );
        })}

        {/* Golden Trophy at end of journey for Capstone Mock Exam */}
        <div className="mt-6 flex flex-col items-center text-center">
          <Link
            href={`/mock`}
            className="relative flex h-28 w-28 items-center justify-center rounded-full border-4 border-amber-500 bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 shadow-[0_10px_0_#b45309] transition-transform hover:scale-105 active:translate-y-1"
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H7.5a1.5 1.5 0 0 0 0 3h9a1.5 1.5 0 0 0 0-3H15c-.55 0-1-.45-1-1v-2.34"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
            <span className="absolute -top-3 rounded-full bg-slate-950 border border-amber-400 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-400 shadow-md">
              Final Boss
            </span>
          </Link>
          <div className="mt-4 max-w-[220px]">
            <span className="text-xs font-black uppercase tracking-widest text-amber-500">
              Exam Trophy
            </span>
            <h3 className="text-lg font-black text-head">
              Full Syllabus Mock Test
            </h3>
            <p className="mt-1 text-xs font-bold text-muted">Timed examination simulation with automated grading</p>
          </div>
        </div>
      </div>
    </div>
  );
}
