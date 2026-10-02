import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Mail } from "@/components/Legal";

export const metadata: Metadata = { title: "Terms of Use" };

export default function Terms() {
  return (
    <LegalPage title="Terms of Use">
      <p><b>Short version.</b> lockin. is a free study helper. It is not the university, it can be wrong, and you use it at your own responsibility. Be fair to other students.</p>
      <h2>1. About lockin.</h2>
      <p>lockin. is an independent study app. It is not affiliated with, endorsed by or run by Uttarakhand Technical University or any college. For official rules, dates, syllabus and results, check the university and your college.</p>
      <h2>2. Using the app</h2>
      <ul>
        <li>Use a real email address that belongs to you and keep your sign-in link private.</li>
        <li>You must be 18 or over to create an account (see the <Link href="/privacy">Privacy Policy</Link>).</li>
      </ul>
      <h2>3. What you must not do</h2>
      <ul>
        <li>Cheat XP or the leaderboard, for example by tampering with the app or the network.</li>
        <li>Scrape, copy in bulk, resell or republish the content, or overload the service.</li>
        <li>Try to break in or interfere with other students’ use. To report a weakness responsibly, see <Link href="/security">Security</Link>.</li>
        <li>Use the AI to produce illegal, abusive or unsafe content, or to cheat in a real exam.</li>
      </ul>
      <p>We may limit or close accounts that break these rules.</p>
      <h2>4. Study material and predictions</h2>
      <p>Questions, lessons, formula cards and labs are study aids. Predicted papers are statistical estimates from past papers; they are not leaked papers and not a promise about what will be asked. If you own something that appears here and want it removed, write to <Mail /> and we will act promptly.</p>
      <h2>5. AI answers</h2>
      <p>Lochi is an AI and can make mistakes, including in maths and science. Check important steps against your textbook or teacher.</p>
      <h2>6. No guarantees, limited liability</h2>
      <p>The app is provided “as is”. We do not promise that it is error-free, always online, or that it will improve your marks. To the extent the law allows, we are not liable for indirect or consequential loss. Nothing here limits rights you have under law that cannot be limited.</p>
      <h2>7. Changes and ending</h2>
      <p>We may update the app or these terms and will ask for your agreement again if a change matters. You can stop using lockin. or delete your account at any time.</p>
      <h2>8. Law and contact</h2>
      <p>These terms are governed by the laws of India. Contact: <Mail />.</p>
    </LegalPage>
  );
}
