import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/Legal";

export const metadata: Metadata = { title: "Cookie Notice" };

export default function Cookies() {
  return (
    <LegalPage title="Cookie Notice">
      <p><b>Short version.</b> lockin. sets only the cookies it needs to keep you signed in. No advertising, analytics or tracking cookies.</p>
      <h2>What we store in your browser</h2>
      <table><thead><tr><th>Name</th><th>Purpose</th><th>Type</th><th>Lifetime</th></tr></thead><tbody>
        <tr><td><code>sb-…-auth-token</code></td><td>Keeps you signed in (set by our sign-in provider, Supabase)</td><td>Cookie, strictly necessary, HttpOnly, SameSite=Lax, Secure</td><td>Up to 30 days, or until you log out</td></tr>
        <tr><td><code>sb-…-auth-token-code-verifier</code></td><td>Completes the email-link or Google sign-in securely</td><td>Cookie, strictly necessary, HttpOnly, SameSite=Lax, Secure</td><td>Short-lived, removed after sign-in</td></tr>
        <tr><td><code>lockin-notice-v1</code></td><td>Remembers that you dismissed the privacy notice</td><td>Local storage</td><td>Until you clear it</td></tr>
      </tbody></table>
      <h2>Third parties</h2>
      <p>The Nunito font is served from our own site. We do not use Google Analytics, advertising pixels or social media trackers.</p>
      <h2>Your choices</h2>
      <p>Strictly necessary cookies do not need consent, and blocking them stops sign-in from working. Clear them any time in your browser settings. See the <Link href="/privacy">Privacy Policy</Link>.</p>
    </LegalPage>
  );
}
