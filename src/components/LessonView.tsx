import Link from "next/link";
import { Rich } from "@/lib/rich";
import type { Lesson } from "@/content/lessons";
import { SelfCheck } from "@/components/SelfCheck";

export function LessonView({ lesson }: { lesson: Lesson }) {
  return (
    <div className="flex flex-col gap-8">
      <p className="text-lg leading-relaxed"><Rich text={lesson.intro} /></p>
      {lesson.lab && (
        <Link href={`/labs/${lesson.lab.id}`} className="card flex items-center gap-3 text-ink no-underline hover:border-blue">
          <span aria-hidden className="text-2xl">🧪</span><span className="font-black text-head"><Rich text={lesson.lab.label} /></span><span aria-hidden className="ml-auto text-blue-t">→</span>
        </Link>
      )}
      {lesson.sections.map((s, i) => (
        <section key={i} aria-labelledby={`s${i}`} className="flex flex-col gap-3">
          <h2 id={`s${i}`} className="text-2xl">{s.h}</h2>
          {s.p.map((p, j) => <p key={j} className="leading-relaxed"><Rich text={p} /></p>)}
          {s.formula && (
            <ul className="card flex flex-col gap-2 !border-blue bg-blue-l">
              {s.formula.map((f, j) => <li key={j} className="text-lg font-extrabold text-head"><Rich text={f} /></li>)}
            </ul>
          )}
        </section>
      ))}
      <section aria-labelledby="examples" className="flex flex-col gap-4">
        <h2 id="examples" className="text-2xl">Worked examples</h2>
        {lesson.examples.map((e, i) => (
          <article key={i} className="card flex flex-col gap-3">
            <p className="font-extrabold text-head"><span className="mr-2 text-muted">Example {i + 1}.</span><Rich text={e.q} /></p>
            <ol className="flex flex-col gap-2">
              {e.steps.map((st, j) => (
                <li key={j} className="flex gap-3"><span aria-hidden className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-soft text-xs font-black">{j + 1}</span><span><Rich text={st} /></span></li>
              ))}
            </ol>
            <p className="ok"><b>Answer: </b><Rich text={e.ans} /></p>
          </article>
        ))}
      </section>
      <section aria-labelledby="mistakes" className="flex flex-col gap-3">
        <h2 id="mistakes" className="text-2xl">Common mistakes</h2>
        <ul className="card flex flex-col gap-2 !border-gold bg-gold-l">
          {lesson.mistakes.map((m, i) => <li key={i} className="ml-5 list-disc text-head"><Rich text={m} /></li>)}
        </ul>
      </section>
      <section aria-labelledby="check" className="flex flex-col gap-3">
        <h2 id="check" className="text-2xl">Check yourself</h2>
        <SelfCheck items={lesson.check} />
      </section>
    </div>
  );
}
