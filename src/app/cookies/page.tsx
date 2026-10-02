import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/Legal";

export const metadata: Metadata = { title: "Cookie Notice" };

export default function Cookies() {
  return (
    <LegalPage title="Cookie Notice & Local Storage Policy">
      <div className="rounded-2xl border-2 border-green/30 bg-green/10 p-5">
        <h2 className="!mt-0 text-base !font-black text-green-t">Privacy-First Cookie Architecture</h2>
        <p className="mt-1 text-sm font-bold text-body">
          <b>Summary:</b> lockin. uses strictly necessary authentication cookies to keep you signed in securely across browser sessions. We do not use advertising cookies, third-party analytics trackers, or commercial pixels.
        </p>
      </div>

      <h2>1. Cookies & Storage Breakdown</h2>
      <p>The following table lists every item stored in your client browser by lockin.:</p>

      <table>
        <thead>
          <tr>
            <th>Identifier</th>
            <th>Classification</th>
            <th>Technical Purpose</th>
            <th>Lifespan</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>sb-*-auth-token</code></td>
            <td>Strictly Necessary (Cookie)</td>
            <td>Stores your secure JWT session token for authenticated Supabase API calls. Flagged <code>HttpOnly</code>, <code>SameSite=Lax</code>, <code>Secure</code>.</td>
            <td>30 days or until user logs out</td>
          </tr>
          <tr>
            <td><code>sb-*-auth-token-code-verifier</code></td>
            <td>Strictly Necessary (Cookie)</td>
            <td>PKCE code verifier for secure cryptographic passwordless and OAuth handshakes.</td>
            <td>Transient (cleared immediately post-authentication)</td>
          </tr>
          <tr>
            <td><code>lockin-theme</code></td>
            <td>Functional Preference (Cookie)</td>
            <td>Persists your chosen interface color theme (Light / Dark / System) across page navigations.</td>
            <td>1 year</td>
          </tr>
          <tr>
            <td><code>lockin-notice-v1</code></td>
            <td>Preference (Local Storage)</td>
            <td>Remembers your acknowledgment of essential system notices so you aren&apos;t prompted repeatedly.</td>
            <td>Persistent until cleared by browser</td>
          </tr>
        </tbody>
      </table>

      <h2>2. Third-Party Trackers & Advertising</h2>
      <p>
        We believe educational tools should respect student focus and digital rights. Therefore:
      </p>
      <ul>
        <li><b>Zero Advertising Pixels:</b> No Facebook Pixel, Google AdSense, or data broker scripts.</li>
        <li><b>Self-Hosted Assets:</b> Typography (Nunito) is bundled and served directly from our domain to prevent IP harvesting.</li>
        <li><b>Privacy-Enhanced YouTube Embeds:</b> Lecture video embeds strictly use <code>youtube-nocookie.com</code>.</li>
      </ul>

      <h2>3. Managing Your Cookie Preferences</h2>
      <p>
        Strictly necessary session cookies do not require prior consent under DPDP / GDPR regulations because authentication cannot function without them. You can delete or block all cookies at any time through your browser settings (e.g. Chrome → Settings → Privacy & Security → Clear Browsing Data).
      </p>
      <p>
        For details on how your profile and study progress are handled, please review our <Link href="/privacy" className="font-bold text-blue-t hover:underline">Privacy Policy</Link> and <Link href="/security" className="font-bold text-blue-t hover:underline">Security Architecture</Link>.
      </p>
    </LegalPage>
  );
}
