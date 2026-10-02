import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboarded } from "@/lib/auth";
import { recentMistakes } from "@/lib/review";
import { ReviewList } from "@/components/ReviewList";
import { ArtMistake } from "@/components/art";
import { Lochi } from "@/components/Lochi";

export const metadata: Metadata = { title: "Mistakes" };

export default async function Mistakes() {
  const { user } = await requireOnboarded();
  const items = await recentMistakes(user.id);
  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3"><ArtMistake size={56} /><div><h1 className="text-3xl">Mistakes notebook</h1><p className="text-muted">Your latest wrong answers from finished quizzes, with the worked solution. Read them, then retry the unit.</p></div></header>
      {items.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 text-center"><Lochi mood="happy" size={110} /><p className="text-lg font-black text-head">Nothing to fix yet.</p><p className="text-muted">Finish a quiz and every question you miss will be saved here.</p><Link href="/practice" className="btn">Start a quiz</Link></div>
      ) : (
        <>
          <p className="text-sm text-muted">Showing your {items.length} most recent mistakes.</p>
          <ReviewList items={items} showSource />
        </>
      )}
    </div>
  );
}
