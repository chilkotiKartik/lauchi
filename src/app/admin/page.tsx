import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { ArtBook, ArtPapers, ArtPyq, ArtScores, ArtVideo } from "@/components/art";

export const metadata: Metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

type Stats = { students?: number; dau?: number; wau?: number; open_reports?: number; lessons_published?: number; lab_questions_published?: number; resources?: number };
type Queue = { reports: number; doubts: number; draftQuestions: number; draftLessons: number; draftLab: number; publishedQuestions: number };

/** Everything the overview needs in one parallel round: admin_stats() plus count-only queries (no rows are downloaded). */
async function load(): Promise<{ stats: Stats; queue: Queue } | null> {
  try {
    const db = createAdminClient();
    const head = { count: "exact" as const, head: true };
    const [st, rep, dbt, dq, dl, dlab, pq] = await Promise.all([
      db.rpc("admin_stats"),
      db.from("question_reports").select("id", head).eq("status", "open"),
      db.from("doubts").select("id", head).eq("status", "open").eq("hidden", false),
      db.from("cms_questions").select("id", head).eq("status", "draft"),
      db.from("cms_lessons").select("id", head).eq("status", "draft"),
      db.from("cms_lab_questions").select("id", head).eq("status", "draft"),
      db.from("cms_questions").select("id", head).eq("status", "published"),
    ]);
    if (rep.error && dbt.error && st.error) return null;
    return {
      stats: (st.data ?? {}) as Stats,
      queue: { reports: rep.count ?? 0, doubts: dbt.count ?? 0, draftQuestions: dq.count ?? 0, draftLessons: dl.count ?? 0, draftLab: dlab.count ?? 0, publishedQuestions: pq.count ?? 0 },
    };
  } catch { return null; }
}

const fmt = (v: number | undefined) => (Number.isFinite(Number(v)) ? Number(v).toLocaleString("en-IN") : "–");

const SECTIONS: { title: string; items: { href: string; label: string; blurb: string }[] }[] = [
  { title: "Content", items: [
    { href: "/admin/subjects", label: "Subjects & units", blurb: "What each unit has, with quick add links" },
    { href: "/admin/questions", label: "Question bank", blurb: "Write, import and publish practice questions" },
    { href: "/admin/lessons", label: "Lessons", blurb: "Topic lessons with worked examples" },
    { href: "/admin/lab-content", label: "Lab questions", blurb: "Questions inside the 3D labs" },
    { href: "/admin/pyqs", label: "PYQs", blurb: "Add previous-year questions" },
    { href: "/admin/resources", label: "Notes & files", blurb: "PDFs, assignments and links" },
    { href: "/admin/videos", label: "Pinned videos", blurb: "Teacher's pick lectures per unit" },
  ] },
  { title: "Students", items: [
    { href: "/admin/doubts", label: "Doubts", blurb: "Answer and publish to the library" },
    { href: "/admin/reports", label: "Reports", blurb: "Mistakes students flagged" },
    { href: "/admin/teachers", label: "Teachers", blurb: "Who may create classes" },
  ] },
  { title: "Numbers", items: [
    { href: "/admin/stats", label: "Stats", blurb: "Students, activity, quizzes per day" },
    { href: "/admin/analytics", label: "Analytics", blurb: "Weakest units (anonymous, 5+ students)" },
  ] },
];

export default async function AdminHome() {
  const { profile } = await requireAdmin();
  const d = await load();
  const s = d?.stats ?? {}, q = d?.queue;
  const todo = q ? [
    { n: q.doubts, label: "unanswered doubts", href: "/admin/doubts?status=open", Icon: ArtBook, accent: "var(--blue)" },
    { n: q.reports, label: "open reports", href: "/admin/reports", Icon: ArtPapers, accent: "var(--red)" },
    { n: q.draftQuestions, label: "draft questions", href: "/admin/questions?status=draft", Icon: ArtPyq, accent: "var(--orange)" },
    { n: q.draftLessons, label: "draft lessons", href: "/admin/lessons?status=draft", Icon: ArtVideo, accent: "var(--purple)" },
    { n: q.draftLab, label: "draft lab questions", href: "/admin/lab-content", Icon: ArtScores, accent: "var(--green)" },
  ] : [];
  const pending = todo.filter((t) => t.n > 0);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl">Admin</h1>
        <p className="text-muted">Hi {profile.name || "there"}. Here is what needs you today.</p>
      </header>
      {!d && <p className="err" role="alert">The admin database isn&apos;t reachable. Check SUPABASE_SERVICE_ROLE_KEY on the server.</p>}

      <section aria-label="Key numbers" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[["Students", s.students, "finished sign-up"], ["Active today", s.dau, "studied in the last day"], ["Active this week", s.wau, "last 7 days"], ["Published questions", q?.publishedQuestions, `${fmt(s.lessons_published)} lessons · ${fmt(s.resources)} files`]].map(([label, v, note]) => (
          <div key={String(label)} className="card flex flex-col gap-0.5">
            <span className="text-xs font-black uppercase tracking-wide text-muted">{label}</span>
            <b className="text-3xl tabular-nums text-head">{fmt(v as number | undefined)}</b>
            <span className="text-sm text-muted">{note}</span>
          </div>
        ))}
      </section>

      <section className="card flex flex-col gap-3" aria-labelledby="todo-h">
        <h2 id="todo-h" className="text-xl">Needs attention</h2>
        {!q ? <p className="text-muted">Unavailable right now.</p> : pending.length === 0 ? <p className="text-muted">Nothing waiting. Every doubt is answered, no open reports and no drafts.</p> : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {pending.map(({ n, label, href, Icon, accent }) => (
              <li key={href}>
                <Link href={href} className="tile h-full" style={{ "--accent": accent } as React.CSSProperties}>
                  <span className="disc"><Icon size={30} /></span>
                  <b className="text-2xl tabular-nums">{fmt(n)}</b>
                  <span className="text-sm text-muted">{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {SECTIONS.map((sec) => (
        <section key={sec.title} aria-labelledby={`sec-${sec.title}`} className="flex flex-col gap-2">
          <h2 id={`sec-${sec.title}`} className="text-lg">{sec.title}</h2>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {sec.items.map((it) => (
              <li key={it.href}>
                <Link href={it.href} className="card flex h-full flex-col gap-0.5 no-underline hover:border-blue">
                  <b className="text-head">{it.label}</b>
                  <span className="text-sm text-muted">{it.blurb}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="card flex flex-col gap-2" aria-labelledby="who">
        <h2 id="who" className="text-xl">Adding another admin</h2>
        <p className="text-[0.95rem]">Ask them to sign in to lockin. once. Then run this in the Supabase SQL editor (with their email):</p>
        <pre className="overflow-x-auto rounded-xl bg-soft p-3 text-sm"><code>{"insert into public.admins (user_id)\nselect id from auth.users where email = 'teacher@example.com';"}</code></pre>
        <p className="text-sm text-muted">Or list their email in the server&apos;s ADMIN_EMAILS setting (comma-separated); it only counts once they have confirmed that email. Analytics never show who a student is; doubts and reports are shown without names.</p>
      </section>
    </div>
  );
}
