import type { Metadata } from "next";
import { LegalPage, Mail } from "@/components/Legal";

export const metadata: Metadata = { title: "Security" };

export default function Security() {
  return (
    <LegalPage title="Security">
      <p><b>Short version.</b> A student can only see their own private data, secret keys never reach your browser, and XP can’t be typed in. If you find a weakness, tell us privately.</p>
      <h2>What protects your data</h2>
      <ul>
        <li><b>Encrypted connections</b> with strict transport security.</li>
        <li><b>Row-level security</b> on every database table, enforced by the database itself.</li>
        <li><b>Server-controlled XP.</b> The browser cannot write XP. Quizzes are scored on the server, each attempt pays once, and there is a daily cap.</li>
        <li><b>HttpOnly session cookies.</b> Page scripts cannot read your login session.</li>
        <li><b>Secrets stay on the server.</b> The AI key and any service keys are never sent to your browser.</li>
        <li><b>AI abuse limits</b> per person, per IP and globally.</li>
        <li><b>Browser hardening:</b> a strict content security policy with per-request nonces, clickjacking protection and other security headers.</li>
        <li><b>Your controls:</b> download or delete your data from the Profile page.</li>
      </ul>
      <h2>Report a security problem</h2>
      <p>Email <Mail /> with what you found and how to reproduce it. Please give us reasonable time to fix it, test only with your own account, and do not access other people’s data or disrupt the service. We will acknowledge your report and keep you updated.</p>
    </LegalPage>
  );
}
