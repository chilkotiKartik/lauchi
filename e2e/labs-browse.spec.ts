import { test, expect } from "@playwright/test";
import { fakeYoutube, onboard, signIn, uniqueEmail, watch } from "./helpers";

test("labs: pick subject, unit and topic, see matching labs and lecture videos", async ({ page }) => {
  test.setTimeout(90_000);
  const problems = watch(page);
  await fakeYoutube(page);
  await signIn(page, uniqueEmail());
  await onboard(page);
  await page.goto("/labs");
  await expect(page.getByRole("heading", { level: 1, name: "Live 3D labs" })).toBeVisible();
  // before picking anything every lab is listed and there is no video panel yet
  await expect(page.getByRole("heading", { name: /^All labs/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Thevenin equivalent/ })).toBeVisible();
  await expect(page.getByText("Pick a subject and a unit to see lecture videos for it.")).toBeVisible();

  // subject
  const subject = page.getByRole("button", { name: /Basic Elec\./ });
  await expect(subject).toHaveAttribute("aria-pressed", "false");
  await subject.click();
  await expect(page).toHaveURL(/[?&]course=EET-001/);
  await expect(subject).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: /2\. Pick a unit/ })).toBeVisible();

  // unit
  const unit1 = page.getByRole("button", { name: /DC Circuits/ });
  await unit1.click();
  await expect(page).toHaveURL(/unit=1/);
  await expect(unit1).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: /Watch: DC Circuits/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Thevenin equivalent/ })).toBeVisible();

  // topic narrows the labs
  const topic = page.getByRole("button", { name: "Thevenin theorem", exact: true });
  await topic.click();
  await expect(page).toHaveURL(/topic=8/);
  await expect(topic).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: /Watch: Thevenin theorem/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Thevenin equivalent/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Three-phase star and delta/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Show lectures|Search/ }).or(page.getByRole("link", { name: /Search lectures on YouTube/ })).first()).toBeVisible();

  // search box filters by title
  await page.getByLabel("Search labs by name").fill("zzzz-nothing");
  await expect(page.getByText("No lab matches that name here.")).toBeVisible();
  await page.getByLabel("Search labs by name").fill("");

  // the selection is shareable: a fresh load restores it
  await page.reload();
  await expect(page.getByRole("button", { name: "Thevenin theorem", exact: true })).toHaveAttribute("aria-pressed", "true");

  // no horizontal overflow at phone width
  await page.setViewportSize({ width: 390, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  // a lab page carries the "Watch this topic" block
  await page.goto("/labs/thevenin");
  await expect(page.getByRole("heading", { level: 1, name: "Thevenin equivalent & maximum power" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Watch this topic" })).toBeVisible();
  expect(problems.filter((p) => !/youtube|ytimg/i.test(p))).toEqual([]);
});
