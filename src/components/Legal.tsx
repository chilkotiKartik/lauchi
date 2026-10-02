import Link from "next/link";
import { operator } from "@/lib/operator";
import { Lochi } from "./Lochi";

export const LEGAL_UPDATED = "October 2026";

export function Mail({ kind = "email" }: { kind?: "email" | "grievance" }) {
  const v = kind === "email" ? operator.email : operator.grievance;
  return v ? (
    <a href={`mailto:${v}`} className="font-bold text-blue-t hover:underline">
      {v}
    </a>
  ) : (
    <em className="text-muted">(contact email not published yet)</em>
  );
}

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-20 border-b-2 border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="flex items-center gap-2 text-xl font-black text-head no-underline">
            <Lochi mood="happy" size={32} />
            <span>lockin<span className="text-green-t">.</span></span>
          </Link>
          <Link href="/" className="btn btn-ghost !min-h-10 text-sm font-extrabold">
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 pt-10">
        <div className="rounded-3xl border-2 border-line bg-surface p-6 shadow-xl sm:p-10">
          <div className="border-b-2 border-line pb-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full bg-soft px-3 py-1 text-xs font-black uppercase tracking-wide text-muted">
                Official Document
              </span>
              <span className="text-xs font-bold text-muted">
                Last updated: {LEGAL_UPDATED}
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-black text-head sm:text-4xl">{title}</h1>
          </div>

          <div className="legal mt-8 flex flex-col gap-6 text-[0.95rem] leading-relaxed text-body [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-black [&_h2]:text-head [&_h3]:text-base [&_h3]:font-black [&_h3]:text-head [&_p]:text-body [&_li]:ml-5 [&_li]:list-disc [&_li]:text-body [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_table]:overflow-hidden [&_table]:rounded-xl [&_table]:border [&_table]:border-line [&_td]:border [&_td]:border-line [&_td]:p-3 [&_td]:align-top [&_td]:text-sm [&_th]:border [&_th]:border-line [&_th]:bg-soft [&_th]:p-3 [&_th]:text-left [&_th]:text-xs [&_th]:font-black [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-head">
            {children}
          </div>

          {/* Legal Navigation */}
          <div className="mt-12 border-t-2 border-line pt-8">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted">
              Legal & Compliance Directory
            </h3>
            <nav aria-label="Legal" className="mt-4 flex flex-wrap gap-3 text-sm font-extrabold">
              <Link href="/privacy" className="rounded-xl border border-line bg-soft px-4 py-2 hover:bg-surface hover:text-blue-t transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="rounded-xl border border-line bg-soft px-4 py-2 hover:bg-surface hover:text-blue-t transition-colors">
                Terms of Service
              </Link>
              <Link href="/cookies" className="rounded-xl border border-line bg-soft px-4 py-2 hover:bg-surface hover:text-blue-t transition-colors">
                Cookie Notice
              </Link>
              <Link href="/security" className="rounded-xl border border-line bg-soft px-4 py-2 hover:bg-surface hover:text-blue-t transition-colors">
                Security Architecture
              </Link>
              <Link href="/about" className="rounded-xl border border-line bg-soft px-4 py-2 hover:bg-surface hover:text-blue-t transition-colors">
                About Platform
              </Link>
            </nav>
          </div>
        </div>
      </main>
    </div>
  );
}
