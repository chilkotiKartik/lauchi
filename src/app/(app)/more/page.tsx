import type { Metadata } from "next";
import Link from "next/link";
import { SECTIONS } from "@/components/sections";

export const metadata: Metadata = { title: "All sections" };

export default function More() {
  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="text-3xl">Everything in lockin.</h1><p className="text-muted">Tap a section to jump in.</p></div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {SECTIONS.map(({ href, label, blurb, Icon, accent, isNew }) => (
          <li key={href}>
            <Link href={href} className="tile h-full" style={{ ["--accent" as string]: accent }}>
              <span className="disc"><Icon size={38} /></span>
              <b>{label} {isNew && <span className="badge-new align-middle">New</span>}</b>
              <span className="text-sm text-muted">{blurb}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
