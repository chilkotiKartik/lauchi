import type { Metadata } from "next";
import Link from "next/link";
import { canSeeCourse } from "@/lib/stream";
import { requireOnboarded } from "@/lib/auth";
import { LAB_MAP, PYQ_CODES, SHORT, countQuestions, getPyq, topRepeated } from "@/lib/pyq";
import { getLab } from "@/labs/registry";
import { Rich } from "@/lib/rich";
import { getCustomPyqs } from "@/lib/admin";
import { PyqBrowser } from "@/components/PyqBrowser";
import { StartQuizButton } from "@/components/StartQuizButton";
import { VideoButton } from "@/components/Videos";
import { ArtFlame, ArtLab, ArtPapers } from "@/components/art";

export const metadata: Metadata = { title: "PYQ bank" };

const CORE5 = new Set(["AHT-001", "AHT-002", "EET-001", "ECT-001", "MET-001"]);
/** Pills grouped as core subjects / maths & C / BCA; group captions only appear when there is more than one group. */
function groupCodes(codes: string[]) {
  const label = (c: string) => (CORE5.has(c) ? "Core subjects" : c.startsWith("BCA") ? "BCA" : "Maths and programming");
  const groups: { label: string; codes: string[]; showLabel: boolean }[] = [];
  for (const c of codes) {
    const l = label(c);
    const g = groups.find((x) => x.label === l);
    if (g) g.codes.push(c); else groups.push({ label: l, codes: [c], showLabel: false });
  }
  groups.forEach((g) => { g.showLabel = groups.length > 1; });
  return groups;
}

export default async function PyqPage({ searchParams }: { searchParams: Promise<{ course?: string; unit?: string }> }) {
  const { profile } = await requireOnboarded();
  const sp = await searchParams;
  const codes = PYQ_CODES.filter((c) => canSeeCourse(profile, c));
  if (codes.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <header className="page-head flex items-center gap-3"><ArtPapers size={56} /><div><h1 className="text-3xl">PYQ bank</h1></div></header>
        <p className="card">There are no previous-year questions for your course yet. Try <Link href="/practice">Practice</Link> or a <Link href="/mock">mock test</Link> for now.</p>
      </div>
    );
  }
  const s = (codes.includes(sp.course ?? "") ? getPyq(sp.course ?? "") : null) ?? getPyq(codes[0])!;
  const n = Math.min(s.units.length, Math.max(1, parseInt(sp.unit ?? "1", 10) || 1));
  const u = s.units[n - 1];
  const top = topRepeated(s, 10);
  const custom = (await getCustomPyqs(s.code)).filter((x) => x.unit === n);
  const pyqs = custom.length ? [...u.pyqs, ...custom] : u.pyqs;
  const labs = u.labs.map((b) => ({ b, live: (LAB_MAP[`${s.code}:${b.id}`] ?? []).map((id) => getLab(id)).filter((l) => l !== undefined) }));
  const subjectShort = SHORT[s.code] ?? s.name;

  return (
    <div className="flex flex-col gap-5">
      <header className="page-head flex items-center gap-3">
        <ArtPapers size={56} />
        <div><h1 className="text-3xl">PYQ bank</h1><p className="text-muted">Every previous-year question we have for the core subjects, with how often it was asked, what to expect next and a lab to see it live.</p></div>
      </header>

      <nav aria-label="Subject" className="flex gap-x-5 gap-y-3 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
        {groupCodes(codes).map((g) => (
          <div key={g.label} role="group" aria-label={g.label} className="flex shrink-0 flex-col gap-1 md:shrink">
            {g.showLabel && <span className="text-xs font-black uppercase tracking-wide text-muted">{g.label}</span>}
            <div className="flex gap-2 md:flex-wrap">
              {g.codes.map((c) => {
                const x = getPyq(c)!;
                return (
                  <Link key={c} href={`/pyq?course=${c}`} aria-current={c === s.code ? "true" : undefined} className={`subject-pill shrink-0 ${c === s.code ? "is-on" : ""}`}>
                    <b>{SHORT[c]}</b><span>{countQuestions(x)} Qs</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <section className="card hero-card flex flex-col gap-3" style={{ ["--accent" as string]: "#ff5a5f" }} aria-labelledby="hot">
        <div className="flex items-center gap-2"><span className="flame"><ArtFlame size={34} /></span><h2 id="hot" className="text-xl">{subjectShort}: most repeated questions</h2></div>
        <ol className="grid gap-2 md:grid-cols-2">
          {top.map((t, i) => (
            <li key={i}>
              <Link href={`/pyq?course=${s.code}&unit=${t.unit}`} className="hot-row no-underline">
                <span className="hot-rank">{i + 1}</span>
                <span className="min-w-0 flex-1"><b className="block text-head"><Rich text={t.title} /></b><span className="text-xs text-muted">Unit {t.unit}{t.marks ? ` · ${t.marks}` : ""}</span></span>
                <span className="chip chip-hot">{t.times}×</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <nav aria-label="Unit" className="unit-tabs">
        {s.units.map((x) => (
          <Link key={x.n} href={`/pyq?course=${s.code}&unit=${x.n}`} aria-current={x.n === n ? "page" : undefined} className={`unit-tab ${x.n === n ? "is-on" : ""}`}>
            <span className="unit-num">U{x.n}</span><span className="truncate">{x.title}</span>
          </Link>
        ))}
      </nav>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-xs font-black uppercase tracking-wide text-muted">{s.name} · Unit {n}</p><h2 className="text-2xl">{u.title}</h2></div>
            <div className="flex flex-wrap gap-2">
              <StartQuizButton kind="practice" course={s.code} unit={n}>Practise this unit</StartQuizButton>
              <VideoButton query={`${u.title} ${s.name} lecture`} label="Unit lectures" />
            </div>
          </div>
          <PyqBrowser code={s.code} subject={subjectShort} unit={n} unitTitle={u.title} pyqs={pyqs} />
        </div>

        <aside className="flex flex-col gap-4" aria-label="Unit guide">
          {u.predicted.length > 0 && (
            <section className="card flex flex-col gap-3" aria-labelledby="pred">
              <h2 id="pred" className="text-lg">Predicted must-do</h2>
              <ol className="flex flex-col gap-3">
                {u.predicted.map((p, i) => (
                  <li key={i} className="predict">
                    <span className="predict-n">{i + 1}</span>
                    <div><b className="text-head"><Rich text={p.title} /></b>{p.text && <p className="text-sm text-muted"><Rich text={p.text} /></p>}</div>
                  </li>
                ))}
              </ol>
              <p className="text-xs text-muted">Predictions come from how often a topic was asked before. They are a guide, not a guarantee.</p>
            </section>
          )}
          {labs.length > 0 && (
            <section className="card flex flex-col gap-3" aria-labelledby="lb">
              <div className="flex items-center gap-2"><ArtLab size={30} /><h2 id="lb" className="text-lg">See it in 3D</h2></div>
              <ul className="flex flex-col gap-2">
                {labs.map(({ b, live }) => (
                  <li key={b.id} className="rounded-xl bg-soft p-3">
                    <p className="text-sm font-black text-head">Lab {b.id}: {b.title}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {live.map((l) => <Link key={l.id} href={`/labs/${l.id}`} className="chip chip-cool max-w-full !whitespace-normal no-underline">Open: {l.title}</Link>)}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className="card flex flex-col gap-2" aria-labelledby="syl">
            <h2 id="syl" className="text-lg">Unit syllabus</h2>
            <ul className="flex flex-col gap-2 text-sm leading-relaxed">
              {u.syllabus.map((x, i) => <li key={i}>{x.head && <b className="text-head">{x.head}: </b>}<Rich text={x.text} /></li>)}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
