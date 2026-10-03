import type { Metadata } from "next";
import Link from "next/link";
import { ChipRow } from "@/components/ChipRow";
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
  const withFormulas = visibleCourses(profile, listCourses()).map((s) => getCourse(s.code)).filter((c): c is NonNullable<typeof c> => Boolean(c) && c!.units.some((u) => u.formulas.length > 0));
  const course = withFormulas.find((c) => c.code === sp.course) ?? withFormulas.find((c) => c.code === "AHT-003") ?? withFormulas[0];
  const units = course.units.filter((u) => u.formulas.length > 0);
  const unit = units.find((u) => String(u.n) === sp.unit) ?? units[0];
  const accent = ACCENTS[(unit.n - 1) % ACCENTS.length];
  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3"><span className="shrink-0"><ArtFormula size={56} /></span><div><h1 className="text-3xl">Formula cards</h1><p className="text-muted">Study by flipping, test yourself in Quiz (XP for 80%), or see them all.</p></div></header>
      <ChipRow label="Subject" active={course.code}>
        {withFormulas.map((c) => <Link key={c.code} href={`/formulas?course=${c.code}`} aria-current={c.code === course.code ? "true" : undefined} className={`shrink-0 whitespace-nowrap rounded-full border-2 px-3 py-1 text-sm font-extrabold no-underline ${c.code === course.code ? "border-blue bg-blue-l text-blue-t" : "border-line text-ink"}`}>{c.short}</Link>)}
      </ChipRow>
      <ChipRow label="Unit" active={`${course.code}:${unit.n}`}>
        {units.map((u) => <Link key={u.n} href={`/formulas?course=${course.code}&unit=${u.n}`} aria-current={u.n === unit.n ? "true" : undefined} className={`shrink-0 whitespace-nowrap rounded-full border-2 px-3 py-1 text-sm font-extrabold no-underline ${u.n === unit.n ? "border-orange bg-gold-l text-head" : "border-line text-ink"}`}>Unit {u.n}</Link>)}
      </ChipRow>
      <h2 className="text-lg">{course.short} · Unit {unit.n}: {unit.title}</h2>
      <FlipDeck key={`${course.code}:${unit.n}`} deckKey={`${course.code}:${unit.n}`} cards={unit.formulas.map(toCard)} accent={accent}
        pool={units.filter((u) => u.n !== unit.n).flatMap((u) => u.formulas.map(toCard))} course={course.code} unit={unit.n} />
    </div>
  );
}
