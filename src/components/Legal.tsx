import Link from "next/link";
import { operator } from "@/lib/operator";

export const LEGAL_UPDATED = "30 September 2026";

export function Mail({ kind = "email" }: { kind?: "email" | "grievance" }) {
  const v = kind === "email" ? operator.email : operator.grievance;
  return v ? <a href={`mailto:${v}`}>{v}</a> : <em>(contact email not published yet)</em>;
}

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <Link href="/" className="text-2xl font-black text-head no-underline">lockin<span className="text-green-t">.</span></Link>
      <h1 className="mb-1 mt-6 text-4xl">{title}</h1>
      <p className="mb-6 text-sm text-muted">Last updated {LEGAL_UPDATED}</p>
      <div className="legal flex flex-col gap-3 leading-relaxed [&_h2]:mt-5 [&_h2]:text-xl [&_li]:ml-5 [&_li]:list-disc [&_table]:w-full [&_td]:border [&_td]:border-line [&_td]:p-2 [&_td]:align-top [&_th]:border [&_th]:border-line [&_th]:bg-soft [&_th]:p-2 [&_th]:text-left [&_table]:text-sm">
        {children}
      </div>
      <nav aria-label="Legal" className="mt-10 flex flex-wrap gap-4 border-t-2 border-line pt-4 text-sm">
        <Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/cookies">Cookies</Link><Link href="/security">Security</Link><Link href="/about">About</Link>
      </nav>
    </main>
  );
}
