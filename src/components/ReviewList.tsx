import { Rich } from "@/lib/rich";
import type { ReviewItem } from "@/lib/review";
import { MistakeActions } from "@/components/MistakeActions";
import { StepByStep } from "@/components/StepByStep";

export function ReviewList({ items, showSource }: { items: ReviewItem[]; showSource?: boolean }) {
  return (
    <ol className="flex flex-col gap-4">
      {items.map((r) => (
        <li key={`${r.session}-${r.index}`} className={`card flex flex-col gap-2 !border-l-8 ${r.ok ? "!border-l-green" : "!border-l-red"}`}>
          <p className="text-xs font-black uppercase tracking-wide text-muted">
            {r.ok ? "Correct" : "Wrong"} · {r.courseShort} · Unit {r.unit}: {r.unitTitle}{showSource && r.at ? ` · ${new Date(r.at).toLocaleDateString("en-IN")}` : ""}
          </p>
          <p className="whitespace-pre-line text-lg font-extrabold text-head"><Rich text={r.q} /></p>
          <p className="text-sm"><b className="text-head">Your answer:</b> <Rich text={r.given} /></p>
          {!r.ok && <p className="text-sm"><b className="text-head">Right answer:</b> <Rich text={r.right} /></p>}
          <StepByStep why={r.why} result={r.right} className="!mt-0 !bg-soft" />
          <MistakeActions q={r.q} right={r.right} why={r.why} course={r.course} courseShort={r.courseShort} unit={r.unit} unitTitle={r.unitTitle} ok={r.ok} mistake={`${r.session}:${r.index}`} />
        </li>
      ))}
    </ol>
  );
}
