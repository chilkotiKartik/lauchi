import type { Metadata } from "next";
import { requireOnboarded } from "@/lib/auth";
import { ArtFocus } from "@/components/art";
import { FocusTimer } from "@/components/FocusTimer";

export const metadata: Metadata = { title: "Focus" };

export default async function Focus() {
  await requireOnboarded();
  return (
    <div className="flex flex-col gap-5">
      <header className="page-head flex items-center gap-3"><ArtFocus size={56} /><div><h1 className="text-3xl">Focus timer</h1><p className="text-muted">25 minutes of real focus, then a short break. Phone face down, one unit open, go.</p></div></header>
      <FocusTimer />
    </div>
  );
}
