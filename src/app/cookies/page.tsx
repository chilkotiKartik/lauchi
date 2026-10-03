import type { Metadata } from "next";
import { LegalPage, Mail } from "@/components/Legal";

export const metadata: Metadata = { title: "Cookie Notice & Storage Security" };

export default function Cookies() {
  return (
    <LegalPage title="Cookie Notice, Client Storage & Anti-Scraping Policy">
      <div className="rounded-2xl border-2 border-green/30 bg-green/10 p-5">
        <h2 className="!mt-0 text-base !font-black text-green-t">Privacy-First Architecture &amp; Data Integrity</h2>
        <p className="mt-1 text-sm font-bold text-body">
          <b>Summary:</b> lockin. operates strictly on privacy-first infrastructure. We only use essential cryptographic session cookies to protect your academic records. We do not use third-party tracking pixels, advertising networks, or data brokers.
        </p>
      </div>

      <h2>1. Cookies &amp; Local Storage Specification</h2>
      <p>The following table lists all items stored in your browser by lockin.:</p>

      <table>
        <thead>
          <tr>
            <th>Identifier</th>
            <th>Type</th>
            <th>Technical Purpose</th>
            <th>Lifespan</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>sb-*-auth-token</code></td>
            <td>Strictly Necessary (Cookie)</td>
            <td>Cryptographically signed JWT session token. Configured with <code>HttpOnly</code>, <code>SameSite=Lax</code>, and <code>Secure</code> flags to prevent cross-site leakage.</td>
            <td>30 days or until logout</td>
          </tr>
          <tr>
            <td><code>sb-*-auth-token-code-verifier</code></td>
            <td>Strictly Necessary (Cookie)</td>
            <td>PKCE cryptographic verifier for passwordless login handshakes.</td>
            <td>Transient (cleared post-auth)</td>
          </tr>
          <tr>
            <td><code>lockin-theme</code></td>
            <td>Functional Preference (Cookie)</td>
            <td>Preserves your chosen color theme (Light / Dark) across page visits.</td>
            <td>1 year</td>
          </tr>
          <tr>
            <td><code>lockin-notice-v1</code></td>
            <td>Preference (Local Storage)</td>
            <td>Remembers acknowledgment of critical platform notices.</td>
            <td>Persistent until cleared</td>
          </tr>
        </tbody>
      </table>

      <h2>2. Intellectual Property, Anti-Copy &amp; Anti-Scraping Protection</h2>
      <p>
        All proprietary learning materials, question banks, simulated 3D WebGL apparatuses, interactive lesson curricula, and examination algorithms on <b>lockin.</b> are protected under Indian and International Copyright &amp; Intellectual Property laws.
      </p>
      <ul>
        <li><b>Prohibition of Automated Extraction:</b> Automated data harvesting, web scraping, crawlers, offline mirroring, and unauthorized API extraction of lockin. content are strictly prohibited.</li>
        <li><b>Content Integrity &amp; Watermarking:</b> Systematic copying, reproduction, re-hosting, framing, or reselling of practice papers, questions, and 3D simulation models will result in immediate permanent account termination and legal remedies under the Copyright Act, 1957 and Information Technology Act, 2000.</li>
        <li><b>Authorized Educational Use:</b> Students and educators are granted a personal, revocable, non-exclusive, non-transferable license to access learning modules for individual, non-commercial study only.</li>
      </ul>

      <h2>3. Third-Party Trackers &amp; Telemetry</h2>
      <p>
        To ensure distraction-free studying and zero commercial surveillance:
      </p>
      <ul>
        <li><b>No Commercial Tracking:</b> We never embed Facebook Pixel, Google AdSense, telemetry beacons, or third-party behavioral scripts.</li>
        <li><b>Self-Hosted Typography:</b> Fonts and UI assets are served directly from our domain to protect your IP address.</li>
        <li><b>Privacy-Enhanced Video Embeds:</b> Curated lecture references use privacy-hardened <code>youtube-nocookie.com</code> embeds.</li>
      </ul>

      <h2>4. Managing Your Cookie Preferences</h2>
      <p>
        Essential session cookies are necessary for core authentication and security under DPDP Act / GDPR regulations. You can inspect or clear browser cookies at any time via your browser settings.
      </p>
      <p>
        For inquiries or permissions regarding educational materials, contact us at <Mail />.
      </p>
    </LegalPage>
  );
}
