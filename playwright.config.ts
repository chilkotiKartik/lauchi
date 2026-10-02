import { defineConfig, devices } from "@playwright/test";

// The sandbox ships its own Chromium; set PW_CHROMIUM to use it instead of Playwright's download.
const SERVICE_KEY = "e2e-service-key-e2e-service-key";
const executablePath = process.env.PW_CHROMIUM || undefined;

export default defineConfig({
  testDir: "e2e",
  timeout: 30_000,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3100", trace: "retain-on-failure", launchOptions: { executablePath, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] } },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
  ],
  webServer: [
    { command: "node e2e/supabase-pg.mjs", url: "http://localhost:54321/__mail", reuseExistingServer: false, stdout: "pipe", stderr: "pipe", env: { E2E_DEBUG: process.env.E2E_DEBUG ?? "", E2E_SERVICE_KEY: SERVICE_KEY, PGHOST: process.env.PGHOST ?? "/tmp", PGPORT: process.env.PGPORT ?? "5544", PGUSER: process.env.PGUSER ?? "pgtest" } },
    {
      command: "npx next start -p 3100",
      url: "http://localhost:3100/login",
      reuseExistingServer: false,
      env: { NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321", NEXT_PUBLIC_SUPABASE_ANON_KEY: "e2e-anon-key-e2e-anon-key", NEXT_PUBLIC_SITE_URL: "http://localhost:3100", SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY, YOUTUBE_API_KEY: "e2e-yt-key", YOUTUBE_API_BASE: "http://localhost:54321" },
    },
  ],
});
