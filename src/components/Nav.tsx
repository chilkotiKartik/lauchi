"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArtMore } from "@/components/art";
import { SECTIONS } from "@/components/sections";
import { Lochi } from "@/components/Lochi";

const bottom = SECTIONS.filter((s) => s.bottom && s.href !== "/profile");
const on = (path: string, href: string) => path === href || path.startsWith(href + "/");

export function Nav({ admin = false }: { admin?: boolean }) {
  const path = usePathname();
  const moreActive = !bottom.some((s) => on(path, s.href)) && path !== "/more" ? true : path === "/more";
  return (
    <>
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r-2 border-line bg-bg md:flex">
        <Link href="/home" className="flex items-center gap-2 px-5 py-4 text-2xl font-black text-green-t no-underline">
          <Lochi mood="idle" size={38} /><span>lockin<span className="text-head">.</span></span>
        </Link>
        <nav aria-label="Main" className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4">
          {SECTIONS.map(({ href, label, Icon, isNew }) => {
            const a = on(path, href);
            return (
              <Link key={href} href={href} prefetch={true} aria-current={a ? "page" : undefined}
                className={`flex min-h-12 items-center gap-3 rounded-2xl border-2 px-3 text-sm font-extrabold uppercase tracking-wide no-underline transition-colors ${a ? "border-blue bg-blue-l text-blue-t" : "border-transparent text-ink hover:bg-soft"}`}>
                <Icon size={30} /><span className="flex-1">{label}</span>{isNew && <span className="badge-new">New</span>}
              </Link>
            );
          })}
          {admin && (
            <Link href="/admin" className="mt-2 flex min-h-12 items-center gap-3 rounded-2xl border-2 border-dashed border-blue px-3 text-sm font-extrabold uppercase tracking-wide text-blue-t no-underline hover:bg-blue-l">
              <span aria-hidden className="grid h-[30px] w-[30px] place-items-center text-lg">⚙</span><span className="flex-1">Admin panel</span>
            </Link>
          )}
        </nav>
      </aside>
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t-2 border-line bg-bg pb-[env(safe-area-inset-bottom)] md:hidden">
        {bottom.map(({ href, label, Icon }) => (
          <Link key={href} href={href} prefetch={true} aria-current={on(path, href) ? "page" : undefined}
            className={`flex min-h-14 min-w-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-extrabold no-underline ${on(path, href) ? "text-blue-t" : "text-muted"}`}>
            <Icon size={26} />{label === "3D Labs" ? "Labs" : label}
          </Link>
        ))}
        <Link href="/more" prefetch={true} aria-current={path === "/more" ? "page" : undefined}
          className={`flex min-h-14 min-w-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-extrabold no-underline ${moreActive ? "text-blue-t" : "text-muted"}`}>
          <ArtMore size={26} />More
        </Link>
      </nav>
    </>
  );
}
