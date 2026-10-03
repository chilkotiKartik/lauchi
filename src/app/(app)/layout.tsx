import { Nav } from "@/components/Nav";
import { PwaShell } from "@/components/pwa/PwaShell";
import { TopBar } from "@/components/TopBar";
import { Ambient, LevelWatcher } from "@/components/Ambient";
import { AppFooter } from "@/components/Footer";
import { requireOnboarded } from "@/lib/auth";
import { levelFromXp } from "@/lib/xp";
import { isAdmin } from "@/lib/admin";

type Stats = { total_xp: number; today_xp: number; streak: number };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, profile } = await requireOnboarded();
  const [{ data }, admin] = await Promise.all([supabase.rpc("dashboard_stats"), isAdmin()]);
  const s = (data as Stats | null) ?? { total_xp: 0, today_xp: 0, streak: 0 };
  return (
    <div className="md:pl-64">
      <Ambient />
      <LevelWatcher level={levelFromXp(s.total_xp).level} />
      <PwaShell />
      <Nav admin={admin} />
      <div className="mx-auto max-w-6xl px-4 pb-28 pt-4 md:pb-10">
        <TopBar streak={s.streak} xp={s.total_xp} level={levelFromXp(s.total_xp).level} goalPct={Math.min(100, Math.round((s.today_xp / profile.daily_goal_xp) * 100))} />
        <main className="pt-4">{children}</main>
        <AppFooter />
      </div>
    </div>
  );
}
