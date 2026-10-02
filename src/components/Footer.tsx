import Link from "next/link";
import { Lochi } from "./Lochi";

export function Footer() {
  return (
    <footer className="mt-20 border-t-2 border-line bg-surface/50 text-body">
      <div className="mx-auto max-w-6xl px-5 py-12">
        {/* Brand & Stats Bar */}
        <div className="flex flex-col gap-6 border-b-2 border-line pb-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Lochi mood="happy" size={40} />
            <div>
              <Link href="/" className="text-2xl font-black tracking-tight text-head no-underline">
                lockin<span className="text-green-t">.</span>
              </Link>
              <p className="text-xs font-bold text-muted">
                Interactive Engineering & BCA Study Platform
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-green/30 bg-green/10 px-3 py-1 text-xs font-extrabold text-green-t">
              <span className="h-2 w-2 rounded-full bg-green animate-pulse" />
              Live 3D WebGL Labs Active
            </span>
            <span className="rounded-full border border-blue/30 bg-blue/10 px-3 py-1 text-xs font-extrabold text-blue-t">
              30+ Virtual Apparatuses
            </span>
            <span className="rounded-full border border-line bg-soft px-3 py-1 text-xs font-extrabold text-head">
              UTU Syllabus Aligned
            </span>
          </div>
        </div>

        {/* 4-Column Directory */}
        <div className="grid grid-cols-2 gap-8 py-10 md:grid-cols-4 lg:gap-10">
          {/* Column 1: Core Subjects */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-head">
              Core Subjects
            </h4>
            <ul className="mt-3 space-y-2 text-sm font-bold text-muted">
              <li>
                <Link href="/syllabus/AHT-001" className="hover:text-head transition-colors">
                  Engineering Physics
                </Link>
              </li>
              <li>
                <Link href="/syllabus/AHT-002" className="hover:text-head transition-colors">
                  Engineering Chemistry
                </Link>
              </li>
              <li>
                <Link href="/syllabus/AHT-003" className="hover:text-head transition-colors">
                  Engineering Mathematics
                </Link>
              </li>
              <li>
                <Link href="/syllabus/EET-001" className="hover:text-head transition-colors">
                  Basic Electrical Engineering
                </Link>
              </li>
              <li>
                <Link href="/syllabus/CST-001" className="hover:text-head transition-colors">
                  Programming for Problem Solving (C)
                </Link>
              </li>
              <li>
                <Link href="/syllabus/BCA-001" className="hover:text-head transition-colors">
                  BCA Computer Science
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: 3D Interactive Labs */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-head">
              3D Virtual Labs
            </h4>
            <ul className="mt-3 space-y-2 text-sm font-bold text-muted">
              <li>
                <Link href="/labs" className="hover:text-head transition-colors">
                  All 3D Experiments
                </Link>
              </li>
              <li>
                <Link href="/labs?search=polarimeter" className="hover:text-head transition-colors">
                  Polarimeter Apparatus
                </Link>
              </li>
              <li>
                <Link href="/labs?search=emwave" className="hover:text-head transition-colors">
                  EM Wave Optics Bench
                </Link>
              </li>
              <li>
                <Link href="/labs?search=bjt" className="hover:text-head transition-colors">
                  BJT Transistor Tracer
                </Link>
              </li>
              <li>
                <Link href="/labs?search=transformer" className="hover:text-head transition-colors">
                  Power Transformer Core
                </Link>
              </li>
              <li>
                <Link href="/labs?search=otto" className="hover:text-head transition-colors">
                  4-Stroke IC Engine
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Tools & Practice */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-head">
              Exam & Practice
            </h4>
            <ul className="mt-3 space-y-2 text-sm font-bold text-muted">
              <li>
                <Link href="/quiz" className="hover:text-head transition-colors">
                  Unit Practice Quizzes
                </Link>
              </li>
              <li>
                <Link href="/exam" className="hover:text-head transition-colors">
                  Timed Mock Exams
                </Link>
              </li>
              <li>
                <Link href="/pyqs" className="hover:text-head transition-colors">
                  Past Question Papers
                </Link>
              </li>
              <li>
                <Link href="/revise" className="hover:text-head transition-colors">
                  Spaced Repetition
                </Link>
              </li>
              <li>
                <Link href="/daily" className="hover:text-head transition-colors">
                  Daily Challenge
                </Link>
              </li>
              <li>
                <Link href="/marks" className="hover:text-head transition-colors">
                  Marks & SGPA Calculator
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Platform & Support */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-head">
              Platform & Legal
            </h4>
            <ul className="mt-3 space-y-2 text-sm font-bold text-muted">
              <li>
                <Link href="/about" className="hover:text-head transition-colors">
                  About Lockin
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-head transition-colors">
                  Security
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-head transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-head transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-head transition-colors">
                  Cookie Preferences
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-head transition-colors">
                  Admin CMS
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Attribution */}
        <div className="flex flex-col items-center justify-between gap-3 border-t-2 border-line pt-6 text-xs text-muted sm:flex-row">
          <p>
            © {new Date().getFullYear()} <b className="text-head">lockin.</b> Unofficial student study platform. Not affiliated with UTU.
          </p>
          <p className="font-bold">
            Built for student academic excellence.
          </p>
        </div>
      </div>
    </footer>
  );
}

export function AppFooter() {
  return (
    <footer className="mt-16 border-t-2 border-line pt-6 text-center text-xs text-muted">
      <div className="flex flex-wrap items-center justify-center gap-4 font-bold">
        <Link href="/home" className="hover:text-head">Dashboard</Link>
        <span>•</span>
        <Link href="/labs" className="hover:text-head">3D Labs</Link>
        <span>•</span>
        <Link href="/marks" className="hover:text-head">SGPA Calc</Link>
        <span>•</span>
        <Link href="/privacy" className="hover:text-head">Privacy</Link>
        <span>•</span>
        <Link href="/terms" className="hover:text-head">Terms</Link>
        <span>•</span>
        <Link href="/about" className="hover:text-head">About</Link>
      </div>
      <p className="mt-2">lockin. — study smarter</p>
    </footer>
  );
}
