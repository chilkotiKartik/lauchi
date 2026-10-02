import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Mail } from "@/components/Legal";

export const metadata: Metadata = { title: "Terms of Use" };

export default function Terms() {
  return (
    <LegalPage title="Terms of Service & Intellectual Property">
      <div className="rounded-2xl border-2 border-green/30 bg-green/10 p-5">
        <h2 className="!mt-0 text-base !font-black text-green-t">Platform Terms Summary</h2>
        <p className="mt-1 text-sm font-bold text-body">
          lockin. is an independent study and simulation suite. By accessing our services, you agree to these fair-use, anti-scraping, and intellectual property terms.
        </p>
      </div>

      <h2>1. Independent Academic Platform</h2>
      <p>
        lockin. is an independent educational technology platform. It is not affiliated with, endorsed by, or administered by Uttarakhand Technical University or any university or college. For official examination timetables, formal ordinances, and official results, refer directly to your institution.
      </p>

      <h2>2. Account Security &amp; Access</h2>
      <ul>
        <li>You must provide an authentic email address and maintain the confidentiality of your authentication credentials.</li>
        <li>Account sharing, credential pooling, or multi-user access on single student accounts is prohibited.</li>
      </ul>

      <h2>3. Intellectual Property, Anti-Copy &amp; Anti-Scraping Rules</h2>
      <p>
        All proprietary software, 3D interactive laboratory models, question sets, curricula, and predictive simulation tools are the exclusive intellectual property of lockin. Users agree not to:
      </p>
      <ul>
        <li><b>Scrape or Harvest:</b> Use bots, crawlers, scrapers, or automated tools to extract questions, syllabus notes, or lab models.</li>
        <li><b>Copy or Republish:</b> Reproduce, distribute, mirror, or commercialize any course content, 3D simulations, or question databases without explicit written authorization.</li>
        <li><b>Tamper with Integrity:</b> Reverse-engineer, intercept network traffic, tamper with server verification routines, or artificially inflate XP or exam marks.</li>
        <li><b>Misuse AI:</b> Use Lochi AI for generating unlawful, defamatory, or abusive content.</li>
      </ul>
      <p>
        Violations of these terms will result in immediate permanent account termination and legal action under the Indian Copyright Act, 1957 and Information Technology Act, 2000.
      </p>

      <h2>4. 3D Simulations &amp; Model Predictions</h2>
      <p>
        Interactive 3D laboratories, virtual apparatus simulations, formula cards, and mock questions are designed as study aids. Examination predictions are statistical analyses based on historical university patterns and do not represent leaked papers.
      </p>

      <h2>5. AI Study Assistant (Lochi)</h2>
      <p>
        Lochi is an educational AI designed to clarify technical concepts. While highly accurate, students should verify complex engineering derivations against their recommended standard textbooks and faculty lectures.
      </p>

      <h2>6. Limitation of Liability</h2>
      <p>
        lockin. is provided &ldquo;as is&rdquo; without warranties of any kind. We strive for 100% uptime and academic accuracy, but are not liable for incidental or consequential damages.
      </p>

      <h2>7. Governing Law &amp; Contact</h2>
      <p>
        These Terms are governed by and construed in accordance with the laws of India. For licensing inquiries, permissions, or support, contact <Mail />.
      </p>
    </LegalPage>
  );
}
