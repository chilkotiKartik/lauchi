import Link from "next/link";
import { Lochi } from "./Lochi";

export function Footer() {
  return (
    <footer className="w-full border-t border-line/60 bg-surface/80 py-10 text-body">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 px-5 sm:flex-row">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Lochi mood="happy" size={32} />
          <span className="text-xl font-black tracking-tight text-head">
            lockin<span className="text-green-t">.</span>
          </span>
          <span className="hidden text-xs text-muted sm:inline">•</span>
          <span className="hidden text-xs font-semibold text-muted sm:inline">
            Interactive Engineering &amp; BCA Platform
          </span>
        </div>

        {/* Clean Link Navigation */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-muted">
          <Link href="/syllabus" className="hover:text-head transition-colors">
            Syllabus
          </Link>
          <Link href="/labs" className="hover:text-head transition-colors">
            3D Labs
          </Link>
          <Link href="/about" className="hover:text-head transition-colors">
            About
          </Link>
          <Link href="/privacy" className="hover:text-head transition-colors">
            Privacy
          </Link>
          <a
            href="mailto:win.lockin@gmail.com"
            className="rounded-full border border-line bg-card px-3 py-1 font-bold text-head hover:border-green transition-all"
          >
            Contact
          </a>
        </div>
      </div>

      {/* Micro Copyright */}
      <div className="mx-auto mt-6 max-w-5xl px-5 text-center text-[11px] text-muted sm:text-left">
        <p>© {new Date().getFullYear()} lockin. Built for student academic excellence.</p>
      </div>
    </footer>
  );
}

export function AppFooter() {
  return (
    <footer className="w-full border-t border-line/50 py-6 text-center text-xs text-muted">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-5 font-bold">
        <Link href="/home" className="hover:text-head transition-colors">Dashboard</Link>
        <span className="text-line">•</span>
        <Link href="/labs" className="hover:text-head transition-colors">3D Labs</Link>
        <span className="text-line">•</span>
        <Link href="/marks" className="hover:text-head transition-colors">SGPA</Link>
        <span className="text-line">•</span>
        <Link href="/privacy" className="hover:text-head transition-colors">Privacy</Link>
        <span className="text-line">•</span>
        <a href="mailto:win.lockin@gmail.com" className="hover:text-head transition-colors">Contact</a>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">lockin. — study smarter</p>
    </footer>
  );
}
