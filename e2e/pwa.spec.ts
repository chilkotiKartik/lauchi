import { test, expect } from "@playwright/test";
import { onboard, signIn, uniqueEmail, watch } from "./helpers";

test("manifest is served with name, icons and start_url", async ({ request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.ok()).toBe(true);
  const m = await res.json();
  expect(m.name).toMatch(/lockin/);
  expect(m.short_name).toBe("lockin.");
  expect(m.start_url).toBe("/home");
  expect(m.display).toBe("standalone");
  const sizes = m.icons.map((i: { sizes: string; purpose?: string }) => `${i.sizes}:${i.purpose}`);
  expect(sizes).toEqual(expect.arrayContaining(["192x192:any", "512x512:any", "512x512:maskable"]));
  for (const i of m.icons) expect((await request.get(i.src)).ok(), i.src).toBe(true);
});

test("offline page renders without signing in", async ({ page }) => {
  await page.goto("/offline");
  await expect(page.getByRole("heading", { level: 1, name: "You're offline" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Formula cards" })).toBeVisible();
});

test("push API rejects signed-out users and bad input", async ({ page, request }) => {
  const signedOut = await request.post("/api/push/subscribe", { data: { endpoint: "https://push.example.com/abc", keys: { p256dh: "x", auth: "y" } } });
  expect(signedOut.status()).toBe(401);
  expect((await request.post("/api/push/unsubscribe", { data: { endpoint: "https://push.example.com/abc" } })).status()).toBe(401);
  expect((await request.post("/api/cron/reminders")).status()).toBe(401);

  await signIn(page, uniqueEmail());
  await onboard(page);
  const bad = await page.request.post("/api/push/subscribe", { data: { endpoint: "http://not-https.example.com/x", keys: { p256dh: "x", auth: "y" } } });
  expect(bad.status()).toBe(400);
  const badTime = await page.request.post("/api/push/subscribe", { data: { endpoint: "https://push.example.com/abcdefghij", keys: { p256dh: "B".repeat(87), auth: "a".repeat(22) }, prefs: { streak: true, exam: true, studyTime: "25:99" } } });
  expect(badTime.status()).toBe(400);
  expect((await page.request.post("/api/push/unsubscribe", { data: {} })).status()).toBe(400);
});

test("service worker registers and recently opened pages work offline", async ({ page, context }) => {
  const problems = watch(page);
  await signIn(page, uniqueEmail());
  await onboard(page);
  // registration happens from the signed-in layout (PwaShell); make sure it is controlling pages
  await page.goto("/formulas");
  await page.waitForFunction(() => navigator.serviceWorker.ready.then(() => true));
  await page.reload(); // now controlled by the worker, and the page is stored on this visit
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  const title = await page.title();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await page.reload();

  await context.setOffline(true);
  await page.reload();
  await expect(page).toHaveURL(/\/formulas/);
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  expect(await page.title()).toBe(title);
  // a page that was never opened falls back to the offline page
  // Chromium does not apply context.setOffline to a service worker's own fetches, so cut the network for this path explicitly
  await context.route("**/progress", (route) => route.abort("internetdisconnected"));
  await page.goto("/progress").catch(() => {});
  await expect(page.getByRole("heading", { level: 1, name: "You're offline" })).toBeVisible();
  await context.setOffline(false);
  expect(problems.filter((p) => !/ERR_INTERNET_DISCONNECTED|Failed to load resource/.test(p))).toEqual([]);
});
