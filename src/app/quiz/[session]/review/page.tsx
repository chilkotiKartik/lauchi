import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireOnboarded } from "@/lib/auth";
import { loadSession } from "@/lib/quiz-session";
import { reviewSession } from "@/lib/review";
import { ReviewList } from "@/components/ReviewList";

export const metadata: Metadata = { title: "Review answers" };

export default async function Review({ params }: { params: Promise<{ session: string }> }) {
  const { user } = await requireOnboarded();
  const { session } = await params;
  const s = await loadSession(user.id, session);
  if (!s) notFound();
  if (!s.submitted_at) redirect(`/quiz/${s.id}`);
  const items = reviewSession(s);
  const right = items.filter((i) => i.ok).length;
  const back = s.kind === "mock" ? "/mock" : s.kind === "assignment" ? "/assignments" : s.topic_key ? `/learn/${s.course}/${s.unit}` : "/practice";
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-5 px-4 py-6">
      <Link href={back} className="text-sm">← Back</Link>
      <div><h1 className="text-3xl">Your answers</h1><p className="text-muted">{right} of {items.length} right. Read the ones you missed, then try again.</p></div>
      <ReviewList items={items} />
      <Link href={back} className="btn btn-wide">Done</Link>
    </main>
  );
}
