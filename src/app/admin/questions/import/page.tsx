import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { ImportForm } from "../ImportForm";

export const metadata: Metadata = { title: "Import questions" };

export default async function ImportQuestions() {
  await requireAdmin();
  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl">Import questions</h1>
        <p className="text-muted">Paste CSV text. We check every row first; if any row has a problem, nothing is imported. <Link href="/admin/questions">Back to the list</Link></p>
      </header>
      <section className="card"><ImportForm /></section>
    </div>
  );
}
