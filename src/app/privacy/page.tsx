import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Mail } from "@/components/Legal";
import { operator } from "@/lib/operator";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy">
      <div className="rounded-2xl border-2 border-blue/30 bg-blue/10 p-5">
        <h2 className="!mt-0 text-base !font-black text-blue-t">Student Data Commitment</h2>
        <p className="mt-1 text-sm font-bold text-body">
          <b>Plain-Language Summary:</b> You need an account to use lockin. We store only your email, name, branch, and academic progress so your syllabus status and flashcards synchronize across your devices. We never sell your data, run ads, or share student analytics with third parties.
        </p>
      </div>

      <h2>1. Data Fiduciary & Identity</h2>
      <p>
        lockin. is operated by {operator.name} (“we”, “our”). Under the Digital Personal Data Protection Act, 2023 (DPDP Act, India), we act as the Data Fiduciary for personal data processed on this platform.
      </p>
      <p>
        Official contact for data inquiries: <Mail />. Grievance officer contact: <Mail kind="grievance" />.
      </p>

      <h2>2. Categories of Data Collected</h2>
      <table>
        <thead>
          <tr>
            <th>Data Category</th>
            <th>Specific Attributes</th>
            <th>Operational Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><b>Identity & Account</b></td>
            <td>Email address, full name, hashed credentials</td>
            <td>User authentication, password recovery, and profile personalization.</td>
          </tr>
          <tr>
            <td><b>Academic Profile</b></td>
            <td>University branch, year, semester, target SGPA, daily XP goal, timezone</td>
            <td>Customizing your subject syllabus, calculating daily streaks accurately in your local timezone, and structuring study plans.</td>
          </tr>
          <tr>
            <td><b>Learning Analytics</b></td>
            <td>Quiz scores, mock exam answers, 3D lab observations, spaced repetition queues</td>
            <td>Powers adaptive question difficulty, revision schedules, and personalized doubt resolution.</td>
          </tr>
          <tr>
            <td><b>AI Tutor Queries</b></td>
            <td>Maths & engineering question text / photos submitted to Lochi</td>
            <td>Processed via Google Gemini API to generate instant step-by-step solutions. Question texts are not retained for model training.</td>
          </tr>
        </tbody>
      </table>

      <h2>3. Technical & Sub-Processor Infrastructure</h2>
      <ul>
        <li><b>Database & Auth (Supabase PostgreSQL):</b> User credentials and progress tables stored with Row-Level Security (RLS) enforcement.</li>
        <li><b>Hosting & Edge Runtime (Vercel):</b> Global CDN and serverless computing with HTTPS TLS 1.3 encryption in transit.</li>
        <li><b>AI Acceleration (Google Gemini API):</b> Powers step-by-step explanations and math step parsing under strict enterprise API terms.</li>
        <li><b>Video Caching (YouTube Privacy-Enhanced):</b> Embeds run in <code>youtube-nocookie.com</code> mode.</li>
      </ul>

      <h2>4. Data Retention & Student Rights</h2>
      <p>
        Under Indian DPDP Act & international standards, students hold absolute rights over their personal data:
      </p>
      <ul>
        <li><b>Right to Access & Portability:</b> Download your complete study history, question attempts, and lab logs at any time from your Profile settings.</li>
        <li><b>Right to Correction:</b> Update your name, branch, semester, or password instantly.</li>
        <li><b>Right to Erasure (Right to be Forgotten):</b> Delete your account in one click. All profile rows, study streaks, and activity logs are permanently deleted from database tables.</li>
        <li><b>Grievance Redressal:</b> Direct access to our designated Grievance Officer (<Mail kind="grievance" />) with response timelines mandated by law.</li>
      </ul>

      <h2>5. Security Assurance</h2>
      <p>
        All communication is secured using TLS 1.3 encryption. Database access is strictly sandboxed: students can only access their own private rows. For detailed technical architecture, read our <Link href="/security" className="font-bold text-blue-t hover:underline">Security Whitepaper</Link>.
      </p>
    </LegalPage>
  );
}
