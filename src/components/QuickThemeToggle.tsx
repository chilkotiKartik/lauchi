"use client";
import { useSyncExternalStore, useTransition } from "react";
import { setTheme } from "@/app/(app)/settings/actions";

function subscribeTheme(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function getThemeSnapshot(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function QuickThemeToggle({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, () => "light" as const);
  const [, startTransition] = useTransition();

  const changeTheme = (newTheme: "light" | "dark") => {
    document.documentElement.setAttribute("data-theme", newTheme);
    document.cookie = `lockin-theme=${newTheme}; path=/; max-age=31536000; SameSite=Lax`;
    startTransition(async () => {
      await setTheme(newTheme);
    });
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => changeTheme(theme === "dark" ? "light" : "dark")}
        title={theme === "dark" ? "Switch to Bright Mode" : "Switch to Dark Mode"}
        className={`pill cursor-pointer hover:border-blue transition-all ${className}`}
        aria-label="Toggle Theme"
      >
        <span className="text-sm">{theme === "dark" ? "🌙 Night" : "☀️ Day"}</span>
      </button>
    );
  }

  return (
    <div className={`flex items-center justify-between rounded-2xl border-2 border-line bg-soft p-2.5 ${className}`}>
      <div className="flex flex-col">
        <span className="text-xs font-black text-head">Theme Preference</span>
        <span className="text-[11px] font-bold text-muted">You can change this anytime</span>
      </div>
      <div className="flex items-center gap-1 bg-surface rounded-xl p-1 border border-line">
        <button
          type="button"
          onClick={() => changeTheme("light")}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-black transition-all ${
            theme === "light" ? "bg-[#58cc02] text-[#0d3a19] shadow-sm" : "text-muted hover:text-head"
          }`}
        >
          <span>☀️</span>
          <span>Bright</span>
        </button>
        <button
          type="button"
          onClick={() => changeTheme("dark")}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-black transition-all ${
            theme === "dark" ? "bg-[#1cb0f6] text-white shadow-sm" : "text-muted hover:text-head"
          }`}
        >
          <span>🌙</span>
          <span>Dark</span>
        </button>
      </div>
    </div>
  );
}
