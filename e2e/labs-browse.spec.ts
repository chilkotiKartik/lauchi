import { test, expect } from "@playwright/test";
import { fakeYoutube, onboard, signIn, uniqueEmail, watch } from "./helpers";

test("labs: tap a subject to see its labs by unit, pick a unit for lecture videos", async ({ page }) => {
  test.setTimeout(90_000);
  const problems = watch(page);
  await fakeYoutube(page);
  await signIn(page, uniqueEmail());
  await onboard(page);
  await page.goto("/labs");
  await expect(page.getByRole("heading", { level: 1, name: "Live 3D labs" })).toBeVisible();
  // before picking anything every lab is listed and there is no video panel yet
  await expect(page.getByRole("button", { name: /^All labs · \d+/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("link", { name: /Thevenin equivalent/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^Watch:/ })).toHaveCount(0);

  // tapping a subject shows its labs grouped by unit straight away
  const subject = page.getByRole("button", { name: /^Basic Elec\. · \d+/ });
  await subject.click();
  await expect(page).toHaveURL(/[?&]course=EET-001/);
  await expect(subject).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { level: 2, name: /DC Circuits/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Thevenin equivalent/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Diffraction by N slits/ })).toHaveCount(0); // other subjects are hidden

  // a unit chip narrows to that unit and brings its lectures
  const unit1 = page.getByRole("button", { name: /^Unit 1 · \d+/ });
  await unit1.click();
  await expect(page).toHaveURL(/unit=1/);
  await expect(unit1).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: /Watch: DC Circuits/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Thevenin equivalent/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Three-phase star and delta/ })).toHaveCount(0);

  // search box filters by title
  await page.getByLabel("Search labs by name").fill("zzzz-nothing");
  await expect(page.getByText("No lab matches that name here.")).toBeVisible();
  await page.getByLabel("Search labs by name").fill("");

  // the selection is shareable: a fresh load restores it
  await page.reload();
  await expect(page.getByRole("button", { name: /^Unit 1 · \d+/ })).toHaveAttribute("aria-pressed", "true");

  // no horizontal overflow at phone width
  await page.setViewportSize({ width: 390, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  // a lab page carries the "Watch this topic" block
  await page.goto("/labs/thevenin");
  await expect(page.getByRole("heading", { level: 1, name: "Thevenin equivalent & maximum power" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Watch this topic" })).toBeVisible();
  expect(problems.filter((p) => !/youtube|ytimg/i.test(p))).toEqual([]);
});
