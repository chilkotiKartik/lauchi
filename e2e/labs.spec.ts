import { test, expect, type Page } from "@playwright/test";
import { LABS } from "../src/labs/registry";
import { visibleLabs } from "../src/lib/stream";
import { fakeYoutube, onboard, onboardAs, shotPixels, signIn, uniqueEmail, watch } from "./helpers";

/** Distinct lit colours of the lab as the user sees it: the studio bench and backdrop are dark, so only the lab's own
 * apparatus produces bright colours. A lab that rendered nothing scores ≤ 2. */
async function colours(page: Page) {
  const stage = page.getByTestId("lab-stage");
  if (!(await stage.locator("canvas").count())) return 0;
  return (await shotPixels(page, stage.locator("canvas"), 72)).lit;
}

test("labs need a session", async ({ page }) => {
  await page.goto("/labs/surface");
  await expect(page).toHaveURL(/\/login\?next=%2Flabs%2Fsurface/);
});

test.describe("live 3D labs", () => {
  test.setTimeout(120_000);
  test("the labs page lists every lab", async ({ page }) => {
    await signIn(page, uniqueEmail());
    await onboard(page);
    await page.goto("/labs");
    await expect(page.getByRole("heading", { name: "Live 3D labs" })).toBeVisible();
    const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    for (const l of visibleLabs("CSE", LABS)) await expect(page.getByRole("link", { name: new RegExp(esc(l.title.slice(0, 12))) }).first()).toBeVisible();
  });

  for (const l of LABS) {
    test(`lab ${l.id}: real pixels, reacts to controls, resets, no errors`, async ({ page }) => {
      test.setTimeout(60_000 + l.presets.length * 30_000); // CI renders WebGL in software; each preset remounts the lab
      const problems = watch(page);
      await signIn(page, uniqueEmail());
      if (visibleLabs("CSE", [l]).length) await onboard(page); else await onboardAs(page, "Bachelor of Computer");
      await page.goto(`/labs/${l.id}`);
      await expect(page.getByRole("heading", { level: 1, name: l.title })).toBeVisible();
      const stage = page.getByTestId("lab-stage");
      await expect(stage.locator("canvas")).toBeVisible({ timeout: 20_000 });
      await expect.poll(() => colours(page), { timeout: 15_000, message: `${l.id} rendered blank` }).toBeGreaterThan(6);
      // first readout before/after moving a slider
      const before = (await page.getByTestId("readouts").textContent()) ?? "";
      const slider = page.getByRole("slider").first();
      await slider.focus();
      for (let i = 0; i < 6; i++) await slider.press("ArrowRight");
      await expect.poll(() => page.getByTestId("readouts").textContent(), { message: `${l.id} readouts did not react` }).not.toBe(before);
      await page.getByRole("button", { name: "Reset" }).click();
      await expect(page.getByTestId("readouts")).toHaveText(before, { timeout: 5000 });
      // every preset button loads its values without an error
      for (const pr of l.presets) {
        await page.getByRole("button", { name: pr.name, exact: true }).click();
        await expect(page.getByText(`Now showing: ${pr.name}`)).toBeVisible();
        await stage.scrollIntoViewIfNeeded(); // the canvas only draws while it is on screen
        await expect(stage.locator("canvas")).toBeVisible({ timeout: 20_000 });
        await expect.poll(() => colours(page), { timeout: 25_000, message: `${l.id} preset "${pr.name}" rendered blank` }).toBeGreaterThan(6);
      }
      expect(problems).toEqual([]);
    });
  }

  test("animated labs pause when off-screen and via the button; no horizontal overflow", async ({ page }) => {
    await signIn(page, uniqueEmail());
    await onboard(page);
    await page.goto("/labs/interference");
    const stage = page.getByTestId("lab-stage");
    await expect(stage.locator("canvas")).toBeVisible({ timeout: 20_000 });
    await expect(stage).toHaveAttribute("data-visible", "true");
    const play = page.getByRole("button", { name: /^(Pause|Play)$/ });
    if ((await play.textContent()) === "Play") await play.click();
    await expect(stage).toHaveAttribute("data-playing", "true");
    await play.click();
    await expect(stage).toHaveAttribute("data-playing", "false");
    await play.click();
    await page.evaluate(() => { document.body.style.paddingBottom = "3000px"; window.scrollTo(0, document.body.scrollHeight); });
    await expect(stage).toHaveAttribute("data-visible", "false", { timeout: 5000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(stage).toHaveAttribute("data-visible", "true", { timeout: 5000 });
    await page.evaluate(() => { document.body.style.paddingBottom = ""; });
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(over).toBeLessThanOrEqual(0);
  });

  test("unknown lab is a 404", async ({ page }) => {
    await signIn(page, uniqueEmail());
    await onboard(page);
    // The app streams pages behind a loading skeleton, so the status line is already sent; the visible 404 page is what counts.
    await page.goto("/labs/nope");
    await expect(page.getByText(/could not be found/i)).toBeVisible();
    await expect(page.locator("meta[name=robots][content*=noindex]").first()).toBeAttached();
  });
});

test("landing hero becomes a live 3D Lochi when WebGL is available", async ({ page }) => {
  const problems = watch(page);
  await page.addInitScript(() => Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 8 }));
  await page.goto("/");
  await expect(page.getByTestId("hero")).toBeVisible();
  await expect(page.getByTestId("hero").locator("canvas")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("hero").locator("canvas")).toHaveCount(1);
  await page.getByTestId("hero").scrollIntoViewIfNeeded(); // labs and the hero pause while off-screen, so draw only after it is in view
  await expect.poll(async () => (await shotPixels(page, page.getByTestId("hero").locator("canvas"))).green,
    { timeout: 15_000, message: "the padlock should draw green pixels" }).toBeGreaterThan(150);
  expect(problems).toEqual([]);
});

test("hero falls back to the flat mascot with reduced motion", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto("/");
  await page.waitForTimeout(2500);
  await expect(page.getByTestId("hero").locator("canvas")).toHaveCount(0);
  await expect(page.getByTestId("hero").locator("svg").first()).toBeVisible();
  await ctx.close();
});

test("hero stays a flat mascot on low-end devices", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 2 }));
  await page.goto("/");
  await page.waitForTimeout(2500);
  await expect(page.getByTestId("hero").locator("canvas")).toHaveCount(0);
});

test("topic pages load lectures on demand and play them inside the page", async ({ page }) => {
  await fakeYoutube(page);
  await signIn(page, uniqueEmail());
  await onboard(page);
  await page.goto("/learn/AHT-003/1/1");
  await expect(page.locator("iframe")).toHaveCount(0); // nothing is fetched until asked
  await page.getByRole("button", { name: /Show lectures/ }).click();
  const thumbs = page.getByRole("button", { name: /lecture 2/ });
  await expect(thumbs).toBeVisible();
  await thumbs.click();
  await expect(page.locator("iframe")).toHaveAttribute("src", /^https:\/\/www\.youtube-nocookie\.com\/embed\/bbbbbbbbbb2\?/);
});

test("lab values: type exact numbers, try presets, save, reload and delete setups, share links", async ({ page }) => {
  test.setTimeout(90_000);
  const problems = watch(page);
  await signIn(page, uniqueEmail()); await onboard(page);
  await page.goto("/labs/rlc");
  await expect(page.getByTestId("lab-stage").locator("canvas")).toBeVisible({ timeout: 20_000 });
  const readouts = page.getByTestId("readouts");
  // exact value, clamped to the allowed range
  const f = page.getByLabel(/^Frequency f: type an exact value/);
  await f.fill("159"); await f.press("Enter");
  await expect(readouts).toContainText("Power factor1.000");
  await f.fill("99999"); await f.press("Enter");
  await expect(f).toHaveValue("1000");
  // a ready-made experiment
  await page.getByRole("button", { name: "Inductive (lagging)" }).click();
  await expect(page.getByText(/Now showing:.*Inductive/)).toBeVisible();
  await expect(page.getByLabel(/^Frequency f: type/)).toHaveValue("400");
  // save it, reload, load it back
  await page.getByLabel(/^Resistance R: type/).fill("77"); await page.getByLabel(/^Resistance R: type/).press("Enter");
  await page.getByRole("button", { name: "Save setup" }).click();
  await page.getByLabel("Setup name").fill("My 77 ohm run");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Saved to your account" })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel(/^Resistance R: type/)).toHaveValue("20");
  await page.getByRole("button", { name: "My 77 ohm run", exact: true }).click();
  await expect(page.getByLabel(/^Resistance R: type/)).toHaveValue("77");
  await expect(page.getByLabel(/^Frequency f: type/)).toHaveValue("400");
  // share link reproduces the values; a tampered link is clamped, not trusted
  await page.getByRole("button", { name: "Share" }).click();
  const link = await page.getByLabel("Share link").inputValue();
  expect(link).toMatch(/\/labs\/rlc\?v=[A-Za-z0-9_-]+$/);
  await page.goto(link);
  await expect(page.getByLabel(/^Resistance R: type/)).toHaveValue("77");
  const evil = Buffer.from(JSON.stringify({ R: 1e12, f: "x", zz: 1 })).toString("base64url");
  await page.goto(`/labs/rlc?v=${evil}`);
  await expect(page.getByLabel(/^Resistance R: type/)).toHaveValue("200");
  await expect(page.getByLabel(/^Frequency f: type/)).toHaveValue("150");
  await page.goto("/labs/rlc?v=%%%garbage");
  await expect(page.getByLabel(/^Resistance R: type/)).toHaveValue("20");
  // delete
  await page.getByRole("button", { name: "Delete setup My 77 ohm run" }).click();
  await expect(page.getByRole("button", { name: "My 77 ohm run", exact: true })).toHaveCount(0);
  expect(problems).toEqual([]);
});
