"use client";
import Link from "next/link";
import { Lock, Dumbbell, Trophy, CheckCircle2, Sparkles } from "lucide-react";
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
                  <Sparkles size={12} />
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
                      <CheckCircle2 size={40} className="stroke-[2.5]" />
                    ) : (
                      <Dumbbell size={38} className="stroke-[2.5]" />
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
                  <Lock size={32} className="stroke-[2.5]" />
                </div>
              )}

              {/* Node Title & Description */}
              <div className="mt-3 max-w-[200px]">
                <h3 className="text-sm font-black uppercase tracking-wide text-head">
                  Unit {u.n}
                </h3>
                <p className="mt-0.5 text-xs font-bold leading-tight text-muted">
                  {u.title}
                </p>
              </div>
            </div>
          );
        })}

        {/* Capstone Final Mock Exam Trophy */}
        <div className="mt-6 flex flex-col items-center text-center">
          <Link
            href="/mock"
            className="group relative flex h-28 w-28 items-center justify-center rounded-3xl border-4 border-amber-600 bg-gradient-to-b from-amber-400 to-amber-500 text-amber-950 shadow-[0_10px_0_#92400e] transition-transform active:translate-y-1"
          >
            <Trophy size={48} className="stroke-[2.5] text-amber-950 drop-shadow group-hover:scale-110 transition-transform" />
          </Link>
          <div className="mt-3">
            <h3 className="text-base font-black uppercase tracking-wide text-head">
              Timed Mock Exam
            </h3>
            <p className="text-xs font-bold text-muted">Full 100-mark final semester simulation</p>
          </div>
        </div>
      </div>
    </div>
  );
}
