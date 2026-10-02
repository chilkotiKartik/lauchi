import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { requireOnboarded } from "@/lib/auth";
import { localDay } from "@/lib/insights";
import { ThemePicker } from "@/components/ThemePicker";
import { VoiceSettings } from "@/components/VoiceSettings";
import { isAdmin } from "@/lib/admin";
import { InstallButton } from "@/components/pwa/InstallButton";
import { NotificationSettings } from "@/components/pwa/NotificationSettings";
import { ArtGear } from "@/components/art";
import { DeleteForm, ExamForm } from "./SettingsForms";

export const metadata: Metadata = { title: "Settings" };

export default async function Settings() {
  const { profile } = await requireOnboarded();
  const admin = await isAdmin();
  const pref = (await cookies()).get("lockin-theme")?.value;
  const theme = pref === "dark" ? "dark" : pref === "system" ? "system" : "light";
  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3"><ArtGear size={56} /><h1 className="text-3xl">Settings</h1></header>
      <section className="card flex flex-col gap-3" aria-labelledby="th"><h2 id="th" className="text-xl">Appearance</h2><ThemePicker initial={theme} /></section>
      <section className="card flex flex-col gap-3" aria-labelledby="vo"><h2 id="vo" className="text-xl">Voice, sound &amp; motion</h2><VoiceSettings /></section>
      <section className="card flex flex-col gap-3" aria-labelledby="pw">
        <h2 id="pw" className="text-xl">Install &amp; notifications</h2>
        <InstallButton />
        <NotificationSettings />
      </section>
      <section id="exam" className="card flex flex-col gap-3" aria-labelledby="ex">
        <h2 id="ex" className="text-xl">Exam date &amp; study time</h2>
        <p className="text-muted">Used for your countdown and the <Link href="/plan">study plan</Link>. Leave the date empty to clear it.</p>
        <ExamForm examDate={profile.exam_date} hours={profile.study_hours} min={localDay(new Date(), profile.timezone)} />
      </section>
      <section className="card flex flex-col gap-2" aria-labelledby="pf"><h2 id="pf" className="text-xl">Your details</h2><p className="text-muted">Change your name, branch, semester or daily goal on the <Link href="/profile">Profile</Link> page.</p></section>
      <section className="card flex flex-col gap-3" aria-labelledby="dt">
        <h2 id="dt" className="text-xl">Your data</h2>
        <p className="text-muted">Download everything lockin. stores about you as a JSON file. See the <Link href="/privacy">Privacy Policy</Link> for what we keep and why.</p>
        <a href="/settings/export" className="btn btn-blue w-fit" download>Download my data</a>
      </section>
      {admin && <section className="card flex flex-col gap-2" aria-labelledby="ad"><h2 id="ad" className="text-xl">Admin</h2><p className="text-muted">Add PYQs, pin videos and read student reports.</p><Link href="/admin" className="btn btn-blue w-fit">Open admin</Link></section>}
      <section className="card flex flex-col gap-3 !border-red" aria-labelledby="dl"><h2 id="dl" className="text-xl">Delete account</h2><DeleteForm /></section>
    </div>
  );
}
