import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { AdminNav } from "@/components/admin/AdminNav";
import { Lochi } from "@/components/Lochi";
import "./admin.css";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · lockin." }, robots: { index: false, follow: false } };

/** The admin panel lives outside the student app shell. Every page and every action re-checks admin rights on the server too. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-dvh">
      <header className="border-b-2 border-line bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2 text-xl font-black text-green-t no-underline">
            <Lochi mood="idle" size={32} /><span>lockin<span className="text-head">.</span></span>
            <span className="chip chip-id">Admin</span>
          </Link>
          <Link href="/home" className="ml-auto text-sm font-extrabold">Back to the app</Link>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-3"><AdminNav /></div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-5">{children}</main>
    </div>
  );
}
