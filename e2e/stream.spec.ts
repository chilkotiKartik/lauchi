import { test, expect } from "@playwright/test";
import { onboard, onboardAs, signIn, uniqueEmail } from "./helpers";

test("a BCA student sees only BCA subjects and labs", async ({ page }) => {
  await signIn(page, uniqueEmail());
  await onboardAs(page, "Bachelor of Computer Applications");
  await page.goto("/learn");
  await expect(page.getByRole("heading", { level: 1, name: "Learn" })).toBeVisible();
  await expect(page.getByText("Programming using C").first()).toBeVisible();
  await expect(page.getByText("Engineering Physics")).toHaveCount(0);
  await page.goto("/labs");
  await expect(page.getByText("Engineering Physics")).toHaveCount(0);
  // pages stream behind a loading skeleton, so the status line is already sent: the visible 404 page (and noindex) is what counts
  await page.goto("/learn/AHT-001");
  await expect(page.getByText(/could not be found/i)).toBeVisible();
  await expect(page.locator("meta[name=robots][content*=noindex]").first()).toBeAttached();
  await page.goto("/labs/rings");
  await expect(page.getByText(/could not be found/i)).toBeVisible();
});

test("a CSE student sees B.Tech subjects and not BCA ones", async ({ page }) => {
  await signIn(page, uniqueEmail());
  await onboard(page);
  await page.goto("/learn");
  await expect(page.getByText("Engineering Physics").first()).toBeVisible();
  await expect(page.getByText("Programming using C")).toHaveCount(0);
  await page.goto("/learn/BCA-001");
  await expect(page.getByText(/could not be found/i)).toBeVisible();
});
