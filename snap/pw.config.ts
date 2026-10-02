import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: ".", timeout: 900_000, workers: 1, reporter: [["list"]],
  use: { baseURL: "http://localhost:3100", actionTimeout: 10000, navigationTimeout: 30000, launchOptions: { executablePath: "/opt/pw-browsers/chromium", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] } },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
});
