import type { Metadata } from "next";
import { LegalPage, Mail } from "@/components/Legal";

export const metadata: Metadata = { title: "About Lockin" };

export default function About() {
  return (
    <LegalPage title="About the Lockin Platform">
      <div className="rounded-2xl border-2 border-purple-500/30 bg-purple-500/10 p-5">
        <h2 className="!mt-0 text-base !font-black text-purple-400">Mission & Purpose</h2>
        <p className="mt-1 text-sm font-bold text-body">
          <b>Lockin</b> is an advanced interactive learning ecosystem architected specifically for technical university students (B.Tech & BCA). It unifies official curriculum syllabi, real-time 3D WebGL physics and circuit laboratories, seeded mock examination engines, and AI-accelerated doubt resolution.
        </p>
      </div>

      <h2>1. Architectural Principles</h2>
      <p>
        Traditional engineering education often separates theoretical coursework from practical experimentation. Lockin bridges this divide through four key technical pillars:
      </p>
      <ul>
        <li>
          <b>Direct Phenomenological Simulation:</b> Over 30 interactive 3D WebGL laboratory apparatuses (such as polarimeters, transistor curve tracers, electromagnetic waveguides, and 4-stroke internal combustion engines) allow students to manipulate physical variables in real time.
        </li>
        <li>
          <b>Deterministic Seeded Assessment:</b> Mathematical problem generators dynamically create algorithmic question variants across hundreds of random seeds, guaranteeing infinite practice without memorizing static answer keys.
        </li>
        <li>
          <b>Cognitive Spaced Repetition (SM-2):</b> Algorithmic flashcards and daily streak queues adaptively resurface difficult concepts before exam deadlines based on memory decay curves.
        </li>
        <li>
          <b>Automated University Practical Records:</b> One-click generation of standard format university practical reports with real-time observation tables, circuit diagrams, and WebGL apparatus snapshots for PDF export.
        </li>
      </ul>

      <h2>2. Institutional Disclaimer & Academic Integrity</h2>
      <p>
        Lockin is an independent, student-centric academic software project. It is not officially affiliated with, maintained by, or endorsed by Veer Madho Singh Bhandari Uttarakhand Technical University (UTU) or any affiliated college.
      </p>
      <p>
        All syllabi, grading schemes, and past question papers are compiled from publicly accessible university ordinances and curriculum frameworks. Students must verify official exam dates, submission guidelines, and regulatory notifications directly with their respective university registrars.
      </p>

      <h2>3. Technical Governance & Reliability</h2>
      <p>
        Built on modern cloud primitives: Next.js App Router, React Three Fiber, Three.js PBR rendering, and Supabase PostgreSQL with strict Row-Level Security (RLS). All calculations, quiz scoring, and XP awards are verified through tamper-proof server-side execution.
      </p>

      <h2>4. Creator & Copyright</h2>
      <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/10 p-5">
        <h3 className="!mt-0 text-base !font-black text-emerald-600 dark:text-emerald-400">Architect & Copyright</h3>
        <p className="mt-1 text-sm font-bold text-body">
          <b>Created &amp; Copyright © {new Date().getFullYear()} by Kalu Don.</b> All rights reserved. Built and engineered to deliver the ultimate gamified learning, 3D interactive laboratories, and academic mastery ecosystem for technical university students.
        </p>
      </div>

      <h2>5. Academic Inquiries & Support</h2>
      <p>
        For bug reports, curriculum suggestions, or administrative support, contact our engineering team at <Mail />.
      </p>
    </LegalPage>
  );
}
