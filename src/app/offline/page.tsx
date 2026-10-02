import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "You're offline" };

export default function OfflinePage() {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 py-10 text-center">
      <div aria-hidden="true" className="grid h-20 w-20 place-items-center rounded-3xl bg-orange text-4xl font-black text-[#0f1a20]">l.</div>
      <h1 className="text-3xl font-black text-head">You&apos;re offline</h1>
      <p>No signal right now. Lessons, formula cards and PYQs you opened recently still work. Open one from your history, or try again when you&apos;re back online.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link className="btn" href="/formulas">Formula cards</Link>
        <Link className="btn btn-ghost" href="/learn">Lessons</Link>
        <Link className="btn btn-ghost" href="/pyq">PYQ bank</Link>
      </div>
      <p className="text-sm text-muted">Your progress is safe. It syncs the next time you&apos;re online.</p>
    </main>
  );
}
