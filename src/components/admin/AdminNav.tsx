"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/pyqs", label: "PYQs" },
  { href: "/admin/videos", label: "Videos" },
  { href: "/admin/resources", label: "Notes & files" },
  { href: "/admin/questions", label: "Questions" },
  { href: "/admin/lessons", label: "Lessons" },
  { href: "/admin/lab-content", label: "Lab content" },
  { href: "/admin/subjects", label: "Subjects" },
  { href: "/admin/doubts", label: "Doubts" },
  { href: "/admin/teachers", label: "Teachers" },
  { href: "/admin/stats", label: "Stats" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/analytics", label: "Analytics" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {TABS.map((t) => {
        const on = t.href === "/admin" ? path === "/admin" : path === t.href || path.startsWith(t.href + "/");
        return <Link key={t.href} href={t.href} className="adm-tab" aria-current={on ? "page" : undefined}>{t.label}</Link>;
      })}
    </nav>
  );
}
