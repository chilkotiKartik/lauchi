import { test, expect, type Page } from "@playwright/test";
import { onboard, shotPixels, signIn, uniqueEmail, watch } from "./helpers";

/** Distinct colours of the 3D canvas inside `testid` as the user sees it (a blank, transparent canvas shows only the flat
 * page behind it: a handful of colours). Read from a screenshot because the canvas does not preserve its drawing buffer. */
async function opaque(page: Page, testid: string) {
  const cv = page.locator(`[data-testid=${testid}] canvas`);
  if (!(await cv.count())) return 0;
  return (await shotPixels(page, cv.first())).all;
}

test("home shows a live 3D lock-in scene that draws pixels and logs no errors", async ({ page }) => {
  const problems = watch(page);
  await signIn(page, uniqueEmail());
  await onboard(page);
  await page.goto("/home");
  await expect(page.getByRole("heading", { name: "Welcome back, Kalu" })).toBeVisible(); // text paints first
  await expect(page.getByRole("heading", { name: "Today's mission" })).toBeVisible();
  const scene = page.getByTestId("home3d");
  await scene.scrollIntoViewIfNeeded(); // the scene mounts only once it is on screen
  await expect(scene).toHaveAttribute("data-mode", "live", { timeout: 20_000 });
  await expect(scene.locator("canvas")).toHaveCount(1);
  await expect(scene.locator("canvas")).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(1500);
  await expect.poll(() => opaque(page, "home3d"), { timeout: 15_000, message: "the lock and blocks should draw (a blank canvas shows only the flat page)" }).toBeGreaterThan(12);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  expect(problems).toEqual([]);
});

test("home scene stays a flat picture with reduced motion", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await signIn(page, uniqueEmail());
  await onboard(page);
  await page.goto("/home");
  const scene = page.getByTestId("home3d");
  await scene.scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
  await expect(scene).toHaveAttribute("data-mode", "static");
  await expect(scene.locator("canvas")).toHaveCount(0);
  await expect(page.getByTestId("home3d-fallback")).toBeAttached();
  await ctx.close();
});

test("landing 'See it move' loads lazily, draws, reacts to the slider, and is flat with reduced motion", async ({ page, browser }) => {
  const problems = watch(page);
  await page.goto("/");
  const sim = page.getByTestId("sim");
  await expect(sim).toHaveAttribute("data-mode", "static"); // nothing 3D until it scrolls into view
  await page.getByRole("heading", { name: "See it move" }).scrollIntoViewIfNeeded();
  await sim.scrollIntoViewIfNeeded();
  await expect(sim).toHaveAttribute("data-mode", "live", { timeout: 20_000 });
  await expect(sim.locator("canvas")).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => opaque(page, "sim"), { timeout: 15_000 }).toBeGreaterThan(12);
  await page.getByRole("slider", { name: /Wave number k/ }).fill("5");
  await expect(page.getByTestId("sim-k")).toHaveText("5.0");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  expect(problems).toEqual([]);

  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const flat = await ctx.newPage();
  await flat.goto("/");
  await flat.getByTestId("sim").scrollIntoViewIfNeeded();
  await flat.waitForTimeout(2000);
  await expect(flat.getByTestId("sim")).toHaveAttribute("data-mode", "static");
  await expect(flat.getByTestId("sim").locator("canvas")).toHaveCount(0);
  await ctx.close();
});
