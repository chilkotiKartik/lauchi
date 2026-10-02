import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Mail } from "@/components/Legal";
import { operator } from "@/lib/operator";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy">
      <p><b>Plain-language summary.</b> You need an account to use lockin. We store your email, your name and your study progress so they follow you between devices. We do not sell your data, show ads or use tracking cookies. You can download or delete everything from your Profile page.</p>
      <h2>1. Who we are</h2>
      <p>lockin. is run by {operator.name} (“we”). For the Digital Personal Data Protection Act, 2023 (India) we are the Data Fiduciary for the information below. Questions or requests: <Mail />. Grievances: <Mail kind="grievance" />.</p>
      <h2>2. What we collect and why</h2>
      <table><thead><tr><th>Information</th><th>Why</th></tr></thead><tbody>
        <tr><td>Email address and name</td><td>To sign you in and greet you</td></tr>
        <tr><td>Branch, year, semester, daily goal, time zone, language</td><td>To set up your subjects and work out your streak in your own time zone</td></tr>
        <tr><td>Study activity: XP events, topic progress, quiz, mock and practical attempts, study plan</td><td>To run the app, your streak, level and (only if you join) the weekly league</td></tr>
        <tr><td>Your choice to join the weekly league (off by default)</td><td>If you join, other joined students see your first name and this week’s XP, nothing else. You can leave at any time and you disappear straight away</td></tr>
        <tr><td>Questions you ask Lochi</td><td>Sent to Google’s Gemini service to write a reply. We keep only a usage counter, not the text</td></tr>
        <tr><td>Video searches</td><td>The topic name (not who you are) is sent to YouTube to find lectures; results are cached for a day. A per-student counter of new searches is kept in server memory for the day</td></tr>
        <tr><td>Study preferences, focus minutes</td><td>Stored only in your browser on this device (local storage). Never sent to us</td></tr>
        <tr><td>Questions to revise and PYQs you mark as practised</td><td>Saved on your account so “Revise today” can bring them back at the right time</td></tr>
        <tr><td>Push notification address (only if you turn reminders on)</td><td>Your browser gives us an endpoint address, which we store so we can send you study reminders. Turn reminders off in Settings and it is deleted</td></tr>
        <tr><td>Friends and groups (only if you use them)</td><td>Friends and group members can see your first name, your streak and whether you studied today. Nobody else can</td></tr>
        <tr><td>Photos you ask Lochi to check</td><td>The image is sent to Google’s Gemini service to read your working, and is not stored by us</td></tr>
        <tr><td>IP address (short-lived)</td><td>To rate-limit abuse. Held briefly in a counter and in our hosting provider’s logs</td></tr>
        <tr><td>Consent record: policy version and time</td><td>To prove and manage your consent</td></tr>
      </tbody></table>
      <p>We do not ask for your phone number, address, government ID or payment details.</p>
      <h2>3. Legal basis</h2>
      <p>Your consent, given when you tick the box during setup and withdrawable at any time (section 7), and limited uses the Act allows, such as keeping the service secure.</p>
      <h2>4. Who else handles your data</h2>
      <ul>
        <li><b>Supabase</b>: database and sign-in provider.</li>
        <li><b>Vercel</b>: hosts the website and the server that talks to Gemini. Keeps standard server logs.</li>
        <li><b>Google (Gemini API)</b>: receives what you send to Lochi, under Google’s own terms. Google (Sign in with Google) if you choose it.</li>
        <li><b>YouTube (Google)</b>: videos play in YouTube’s privacy-enhanced player (youtube-nocookie.com) only after you choose one; YouTube then applies its own terms. Thumbnails load from i.ytimg.com.</li>
        <li><b>Your browser’s speech service</b>: if you use voice typing, Chrome and Edge send the audio to Google or Microsoft to turn it into text. Read-aloud uses your device’s own voices.</li>
      </ul>
      <p>These providers may process data on servers outside India. We do not sell your data or share it for advertising.</p>
      <h2>5. How long we keep it</h2>
      <p>Account data stays until you delete your account. Rate-limit counters are short-lived.</p>
      <h2>6. How we protect it</h2>
      <p>Traffic is encrypted. Database rules let each student read and change only their own private data. XP can only be written by the server. Secret keys never reach your browser. See <Link href="/security">Security</Link>. No system is perfectly safe; if a breach affects you we will tell you and the authorities as the law requires.</p>
      <h2>7. Your rights</h2>
      <ul>
        <li><b>Access and download:</b> Profile → “Download my data”.</li>
        <li><b>Correction:</b> edit your details on the Profile page.</li>
        <li><b>Erasure and withdrawing consent:</b> Profile → “Delete my account” removes your login, profile, progress and consent records.</li>
        <li><b>Grievance:</b> write to <Mail kind="grievance" />. If we do not resolve it you may complain to the Data Protection Board of India.</li>
        <li><b>Nominate</b> someone to exercise these rights for you if you cannot.</li>
      </ul>
      <h2>8. Age</h2>
      <p>lockin. is for university students aged 18 or over. If we learn that an account belongs to someone under 18 we will delete it.</p>
      <h2>9. Changes</h2>
      <p>If we change this policy in a way that matters we will update the date above and ask for your agreement again.</p>
    </LegalPage>
  );
}
