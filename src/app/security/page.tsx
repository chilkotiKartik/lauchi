import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Mail } from "@/components/Legal";

export const metadata: Metadata = { title: "Security Architecture" };

export default function Security() {
  return (
    <LegalPage title="Security Architecture & Data Protection">
      <div className="rounded-2xl border-2 border-green/30 bg-green/10 p-5">
        <h2 className="!mt-0 text-base !font-black text-green-t">Enterprise-Grade Zero-Trust Security</h2>
        <p className="mt-1 text-sm font-bold text-body">
          Lockin is designed under Defense-in-Depth and Zero-Trust principles. Student credentials, academic records, and session data are isolated at the database engine level with strict cryptographic protections.
        </p>
      </div>

      <h2>1. Threat Model & Architectural Defenses</h2>
      <table>
        <thead>
          <tr>
            <th>Security Domain</th>
            <th>Defense Implementation</th>
            <th>Protective Outcome</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><b>Data Isolation</b></td>
            <td>PostgreSQL Row-Level Security (RLS)</td>
            <td>Every database query is sandboxed to the authenticated user ID. No student can read or alter another student&apos;s records.</td>
          </tr>
          <tr>
            <td><b>Authentication & Session</b></td>
            <td>HttpOnly, Secure, SameSite=Lax JWT Cookies</td>
            <td>Tokens are immune to JavaScript extraction (XSS attacks) and CSRF exploits.</td>
          </tr>
          <tr>
            <td><b>Tamper-Proof Progression</b></td>
            <td>Server-Side XP & Quiz Computation</td>
            <td>Client browsers cannot fabricate XP, streak days, or quiz marks. All computations execute inside protected Next.js Server Actions.</td>
          </tr>
          <tr>
            <td><b>API Key & Secret Isolation</b></td>
            <td>Zero-Leak Server Environment Variables</td>
            <td>Database service role keys, Gemini API tokens, and cron secrets are never transmitted to client bundles or browser consoles.</td>
          </tr>
          <tr>
            <td><b>Browser Hardening</b></td>
            <td>Strict Content Security Policy (CSP) with Nonces</td>
            <td>Enforces per-request cryptographic nonces, clickjacking headers (<code>X-Frame-Options: DENY</code>), and strict MIME-type sniffing defenses.</td>
          </tr>
          <tr>
            <td><b>High-Concurrency & Anti-DDoS</b></td>
            <td>Stateless Edge Autoscaling + Rate Limiting</td>
            <td>Next.js serverless functions and Supabase connection poolers handle thousands of simultaneous logins without degradation.</td>
          </tr>
        </tbody>
      </table>

      <h2>2. Concurrency, Load Handling & Performance</h2>
      <p>
        Lockin is deployed on high-availability serverless infrastructure capable of handling sudden traffic spikes (e.g. 1,000+ simultaneous students taking mock exams before semester finals):
      </p>
      <ul>
        <li><b>Stateless Edge Scaling:</b> Serverless compute instances spawn horizontally within milliseconds across global regions.</li>
        <li><b>PostgreSQL Connection Pooling:</b> Database connections utilize Supavisor / PgBouncer poolers to prevent connection exhaustion under heavy load.</li>
        <li><b>Static Caching & ISR:</b> Heavy assets (3D GLTF meshes, syllabus indices, question templates) are cached at the edge CDN, reducing database load to near-zero for non-mutating requests.</li>
      </ul>

      <h2>3. Responsible Vulnerability Disclosure</h2>
      <p>
        We welcome security researchers and students to audit our systems. If you identify a vulnerability:
      </p>
      <ol className="list-decimal pl-5 space-y-1 text-sm text-body">
        <li>Email technical details to <Mail />.</li>
        <li>Provide reasonable time for our team to triage and deploy a patch before public disclosure.</li>
        <li>Test solely against your own authenticated account; do not attempt unauthorized data extraction.</li>
      </ol>
      <p className="mt-2 text-sm text-muted">
        We commit to acknowledging valid security reports within 24 hours.
      </p>
    </LegalPage>
  );
}
