import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

import { MOCK, addXp, onboard, signIn, uniqueEmail, watch } from "./helpers";

test("security headers and clean landing page", async ({ page }) => {
  const problems = watch(page);
  const res = await page.goto("/");
  const h = res!.headers();
  expect(h["content-security-policy"]).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["strict-transport-security"]).toContain("max-age=31536000");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["permissions-policy"]).toContain("camera=()");
  expect(h["x-powered-by"]).toBeUndefined();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Lock in on the units");
  expect(problems).toEqual([]);
});

test("signed-out visitors are sent to login and back", async ({ page }) => {
  await page.goto("/home");
  await expect(page).toHaveURL(/\/login\?next=%2Fhome/);
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/login\?next=%2Fprofile/);
});

test("login validates email and handles rate limits", async ({ page }) => {
  await page.goto("/login?tab=magic");
  await page.getByLabel("Email Address").fill("not-an-email");
  await page.getByRole("button", { name: /email me/i }).click();
  await expect(page.locator(".err")).toContainText("valid email");
  await page.getByLabel("Email Address").fill("limit@example.com");
  await page.getByRole("button", { name: /email me/i }).click();
  await expect(page.locator(".err")).toContainText("Too many emails");
});

test("new student: login, onboarding, dashboard, profile edit, logout", async ({ page }) => {
  const problems = watch(page);
  const email = uniqueEmail();
  await signIn(page, email);
  await onboard(page);

  await expect(page.getByRole("heading", { name: "Welcome back, Kalu" })).toBeVisible();
  await expect(page.getByText("Computer Science & Engineering · Semester I")).toBeVisible();
  await expect(page.getByRole("group", { name: "Your stats" })).toContainText("0 total XP");
  await expect(page.getByText("0 of 50 XP today")).toBeVisible();
  await expect(page.getByRole("group", { name: "Your stats" })).toContainText("Level 1");

  // onboarding cannot be repeated, login page bounces signed-in users
  await page.goto("/welcome");
  await expect(page).toHaveURL(/\/home$/);
  await page.goto("/login");
  await expect(page).toHaveURL(/\/home$/);

  // profile edit persists and shows on the dashboard
  await page.goto("/profile");
  await expect(page.getByText(email)).toBeVisible();
  await page.getByLabel("Name").fill("Kalu Don");
  await page.getByLabel("Semester").selectOption("2");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator(".ok")).toHaveText("Saved.");
  await page.goto("/home");
  await expect(page.getByRole("heading", { name: "Welcome back, Kalu Don" })).toBeVisible();
  await expect(page.getByText("Semester II")).toBeVisible();

  // session cookie is HttpOnly + SameSite
  const cookies = (await page.context().cookies()).filter((c) => c.name.startsWith("sb-"));
  expect(cookies.length).toBeGreaterThan(0);
  for (const c of cookies) { expect(c.httpOnly).toBe(true); expect(c.sameSite).toBe("Lax"); }

  // logout ends the session
  await page.goto("/profile");
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/home");
  await expect(page).toHaveURL(/\/login/);
  expect(problems).toEqual([]);
});

test("dashboard reflects trusted XP, streak and daily goal", async ({ page }) => {
  const email = uniqueEmail();
  await signIn(page, email);
  await onboard(page);
  for (const [xp, ago] of [[60, 0], [20, 1], [20, 2]]) await addXp(email, xp, ago);
  await page.goto("/home");
  const bar = page.getByRole("group", { name: "Your stats" });
  await expect(bar).toContainText("3 day streak");
  await expect(bar).toContainText("100 total XP");
  await expect(page.getByText("Daily goal done. Brilliant!")).toBeVisible();
  await expect(page.getByRole("img", { name: "Daily goal: 60 of 50" })).toBeVisible();
});

test("open redirects and forged callbacks are refused", async ({ page }) => {
  await page.goto("/auth/callback?code=forged&next=https://evil.example");
  await expect(page).toHaveURL(/\/login\?error=link/);
  await expect(page.locator(".err")).toContainText("expired or was already used");

  const email = uniqueEmail();
  await page.goto("/login?tab=magic&next=//evil.example");
  await page.getByLabel("Email Address").fill(email);
  await page.getByRole("button", { name: /email me/i }).click();
  await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
  const { link } = await (await fetch(`${MOCK}/__mail?email=${encodeURIComponent(email)}`)).json();
  expect(link).toContain("next=%2Fhome");
  const forged = link.replace("next=%2Fhome", "next=%2F%2Fevil.example");
  await page.goto(forged);
  await expect(page).toHaveURL(/localhost:3100\/welcome$/);
});

test("a link can only be used once", async ({ page, context }) => {
  const email = uniqueEmail();
  await signIn(page, email);
  const { link } = await (await fetch(`${MOCK}/__mail?email=${encodeURIComponent(email)}`)).json();
  await context.clearCookies();
  await page.goto(link);
  await expect(page).toHaveURL(/\/login\?error=link/);
});

for (const path of ["/", "/login"]) {
  test(`no overflow or serious a11y issues on ${path}`, async ({ page }) => {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical")).toEqual([]);
  });
}

test("signed-in pages have no overflow or serious a11y issues", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" }); // axe must not measure contrast mid-fade
  await signIn(page, uniqueEmail());
  const steps = ["welcome"];
  expect(steps.length).toBe(1);
  await expect(page.getByLabel("Your name")).toBeVisible();
  await page.waitForTimeout(600); // let the step's 0.2s fade-in finish; axe would measure half-transparent text
  const axe0 = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(axe0.violations.filter((v) => v.impact === "serious" || v.impact === "critical")).toEqual([]);
  await onboard(page);
  for (const path of ["/home", "/profile"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical"), path).toEqual([]);
  }
});
