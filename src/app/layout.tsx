import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { cookies } from "next/headers";
import { connection } from "next/server";
import "./globals.css";
import { Notice } from "@/components/Notice";

const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"], weight: ["600", "700", "800", "900"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "lockin. — study smarter for UTU B.Tech", template: "%s · lockin." },
  description: "The whole first-year UTU syllabus, unit by unit, with practice, live labs and an AI tutor.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#44c95a" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await connection(); // per-request rendering so the CSP nonce reaches Next's scripts
  // Day is the default; "system" follows the device, "dark" forces night. Stored in a plain preference cookie.
  const pref = (await cookies()).get("lockin-theme")?.value;
  const theme = pref === "dark" ? "dark" : pref === "system" ? undefined : "light";
  return (
    <html lang="en" className={nunito.variable} data-theme={theme}>
      <body className="min-h-dvh">
        <Notice />
        {children}
      </body>
    </html>
  );
}
