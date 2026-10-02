import type { Metadata } from "next";
import Link from "next/link";
import { visibleCourses } from "@/lib/stream";
import { requireOnboarded } from "@/lib/auth";
import { getCourse, listCourses } from "@/lib/syllabus";
import { FlipDeck } from "@/components/FlipDeck";
import { toCard } from "@/lib/cards";
import { ArtFormula } from "@/components/art";

export const metadata: Metadata = { title: "Formula cards" };
const ACCENTS = ["#2ba6f5", "#ff9a1f", "#44c95a", "#a970ff", "#ff5a5f", "#ffc83d"];

export default async function Formulas({ searchParams }: { searchParams: Promise<{ course?: string; unit?: string }> }) {
  const { profile } = await requireOnboarded();
  const sp = await searchParams;
  const withFormulas = visibleCourses(profile.branch, listCourses()).map((s) => getCourse(s.code)).filter((c): c is NonNullable<typeof c> => Boolean(c) && c!.units.some((u) => u.formulas.length > 0));
  const course = withFormulas.find((c) => c.code === sp.course) ?? withFormulas.find((c) => c.code === "AHT-003") ?? withFormulas[0];
  const units = course.units.filter((u) => u.formulas.length > 0);
  const unit = units.find((u) => String(u.n) === sp.unit) ?? units[0];
  const accent = ACCENTS[(unit.n - 1) % ACCENTS.length];
  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3"><ArtFormula size={56} /><div><h1 className="text-3xl">Formula cards</h1><p className="text-muted">Tap a card to flip it. Try to recall the formula first.</p></div></header>
      <nav aria-label="Subject" className="flex flex-wrap gap-2">
        {withFormulas.map((c) => <Link key={c.code} href={`/formulas?course=${c.code}`} aria-current={c.code === course.code ? "true" : undefined} className={`rounded-full border-2 px-3 py-1 text-sm font-extrabold no-underline ${c.code === course.code ? "border-blue bg-blue-l text-blue-t" : "border-line text-ink"}`}>{c.short}</Link>)}
      </nav>
      <nav aria-label="Unit" className="flex flex-wrap gap-2">
        {units.map((u) => <Link key={u.n} href={`/formulas?course=${course.code}&unit=${u.n}`} aria-current={u.n === unit.n ? "true" : undefined} className={`rounded-full border-2 px-3 py-1 text-sm font-extrabold no-underline ${u.n === unit.n ? "border-orange bg-gold-l text-head" : "border-line text-ink"}`}>Unit {u.n}</Link>)}
      </nav>
      <h2 className="text-xl">{course.name} · Unit {unit.n}: {unit.title}</h2>
      <FlipDeck cards={unit.formulas.map(toCard)} accent={accent} />
    </div>
  );
}
