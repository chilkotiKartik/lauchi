import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { ArtBook, ArtPapers, ArtPyq, ArtScores, ArtVideo } from "@/components/art";

export const metadata: Metadata = { title: "Overview" };

async function counts() {
  try {
    const db = createAdminClient();
    const [r, p, v, f] = await Promise.all([
      db.from("question_reports").select("id").eq("status", "open").limit(1000),
      db.from("custom_pyqs").select("id").limit(5000),
      db.from("pinned_videos").select("id").limit(5000),
      db.from("resources").select("id").limit(5000),
    ]);
    if (r.error || p.error || v.error) return null;
    const files = f.error ? null : f.data?.length ?? 0;
    return { reports: r.data?.length ?? 0, pyqs: p.data?.length ?? 0, videos: v.data?.length ?? 0, files };
  } catch { return null; }
}

export default async function AdminHome() {
  const { profile } = await requireAdmin();
  const c = await counts();
  const tiles = [
    { href: "/admin/reports", title: "Reports", blurb: c ? `${c.reports} open` : "Problems students found", Icon: ArtPapers, accent: "var(--red)" },
    { href: "/admin/pyqs", title: "Custom PYQs", blurb: c ? `${c.pyqs} added` : "Add your own questions", Icon: ArtPyq, accent: "var(--orange)" },
    { href: "/admin/videos", title: "Pinned videos", blurb: c ? `${c.videos} pinned` : "Teacher's pick lectures", Icon: ArtVideo, accent: "var(--blue)" },
    { href: "/admin/resources", title: "Notes & files", blurb: c?.files != null ? `${c.files} uploaded` : "PDFs, assignments, links", Icon: ArtBook, accent: "var(--green)" },
    { href: "/admin/analytics", title: "Analytics", blurb: "Weakest units, active students", Icon: ArtScores, accent: "var(--purple)" },
  ];
  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl">Admin</h1>
        <p className="text-muted">Hi {profile.name || "there"}. Look after the question bank and see how students are doing, without seeing who anyone is.</p>
      </header>
      {!c && <p className="err" role="alert">The admin database isn&apos;t reachable. Check SUPABASE_SERVICE_ROLE_KEY on the server.</p>}
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {tiles.map(({ href, title, blurb, Icon, accent }) => (
          <li key={href}>
            <Link href={href} className="tile h-full" style={{ "--accent": accent } as React.CSSProperties}>
              <span className="disc"><Icon size={34} /></span>
              <b>{title}</b>
              <span className="text-sm text-muted">{blurb}</span>
            </Link>
          </li>
        ))}
      </ul>
      <section className="card flex flex-col gap-2" aria-labelledby="who">
        <h2 id="who" className="text-xl">Adding another admin</h2>
        <p className="text-[0.95rem]">Ask them to sign in to lockin. once. Then run this in the Supabase SQL editor (with their email):</p>
        <pre className="overflow-x-auto rounded-xl bg-soft p-3 text-sm"><code>{"insert into public.admins (user_id)\nselect id from auth.users where email = 'teacher@example.com';"}</code></pre>
        <p className="text-sm text-muted">Or list their email in the server&apos;s ADMIN_EMAILS setting (comma-separated). Admins can see anonymous totals only, never a student&apos;s name or answers.</p>
      </section>
    </div>
  );
}
