import { test, expect, type Locator } from "@playwright/test";
import { fakeYoutube, onboard, signIn, sql, uniqueEmail, watch } from "./helpers";

/** Predict "goes up" for every reading of the current task. */
async function predictAllUp(panel: Locator) {
  const groups = panel.getByRole("radiogroup");
  const n = await groups.count();
  for (let i = 0; i < n; i++) await groups.nth(i).getByRole("radio").first().click();
}

test("lab tasks: predict, test one change, fair-test warning, preset task, XP once, shown on Labs and Progress", async ({ page }) => {
  test.setTimeout(180_000);
  const problems = watch(page);
  const email = uniqueEmail();
  await fakeYoutube(page); // an admin test may have pinned a lecture to this unit
  await signIn(page, email); await onboard(page);
  await page.goto("/labs/diffraction");
  const panel = page.getByTestId("lab-tasks");
  await expect(panel.getByRole("heading", { name: "Predict, test, explain" })).toBeVisible({ timeout: 20_000 });
  await expect(panel.getByText(/^Task 1 of 3/)).toBeVisible({ timeout: 20_000 }); // appears once the lab's controls load

  // you cannot test before predicting every reading
  const lock = panel.getByRole("button", { name: "Lock in my prediction" });
  await expect(lock).toBeDisabled();
  await predictAllUp(panel);
  await lock.click();
  const check = panel.getByRole("button", { name: "Check what happened" });
  await expect(check).toBeDisabled(); // not moved yet

  // an unfair test: change a second control as well → explained, not graded
  const labSliders = page.locator('input[type=range]:not([aria-label$="(task)"])');
  await labSliders.nth(1).focus();
  for (let i = 0; i < 4; i++) await labSliders.nth(1).press("ArrowRight");
  const taskSlider = panel.getByRole("slider");
  const up = /raise/.test((await panel.getByRole("heading", { level: 3 }).textContent()) ?? "");
  await taskSlider.focus(); await taskSlider.press(up ? "End" : "Home");
  await expect(check).toBeEnabled();
  await check.click();
  await expect(panel.getByRole("alert")).toContainText("A fair test changes one thing only");

  // start again, fairly this time
  const reset = page.getByRole("button", { name: "Reset" });
  await reset.focus(); await reset.press("Enter"); // on phones the sticky 3D view can sit over it after a programmatic scroll
  await expect(panel.getByRole("alert")).toContainText("Lock in your prediction again"); // the reset spoils the locked prediction
  await panel.getByRole("button", { name: "Predict again" }).click();
  await panel.getByRole("button", { name: "Lock in my prediction" }).click();
  await taskSlider.focus(); await taskSlider.press(up ? "End" : "Home");
  await panel.getByRole("button", { name: "Check what happened" }).click();
  const did = panel.getByRole("list", { name: "What the lab did" });
  await expect(did).toBeVisible();
  // every row says what really happened, as before → after text from the lab
  for (const row of await did.getByRole("listitem").all()) await expect(row).toContainText("→");
  await panel.getByRole("button", { name: "Next task" }).click();

  // task 2: second slider
  await expect(panel.getByText(/^Task 2 of 3/)).toBeVisible();
  await predictAllUp(panel);
  await panel.getByRole("button", { name: "Lock in my prediction" }).click();
  const up2 = /raise/.test((await panel.getByRole("heading", { level: 3 }).textContent()) ?? "");
  await panel.getByRole("slider").focus(); await panel.getByRole("slider").press(up2 ? "End" : "Home");
  await panel.getByRole("button", { name: "Check what happened" }).click();
  await panel.getByRole("button", { name: "Next task" }).click();

  // task 3: a ready-made setup, loaded from the panel
  await expect(panel.getByText(/^Task 3 of 3/)).toBeVisible();
  await predictAllUp(panel);
  await panel.getByRole("button", { name: "Lock in my prediction" }).click();
  await panel.getByRole("button", { name: /^Load “/ }).click();
  await expect(page.getByText(/^Now showing:/)).toBeVisible();
  await panel.getByRole("button", { name: "Check what happened" }).click();
  await expect(did).toBeVisible();
  await panel.getByRole("button", { name: "See my result" }).click();
  await expect(panel.getByText(/^Lab tasks done · \d+% predicted right$/)).toBeVisible();
  await expect(panel.getByText(/^\+\d+ XP added to your progress\.$/)).toBeVisible();

  // recorded once on the server, and shown where students look
  const rows = await sql("select e.xp from xp_events e join auth.users u on u.id = e.user_id where u.email = $1 and e.ref = 'lab:tasks:diffraction'", [email]) as { xp: number }[];
  expect(rows).toHaveLength(1);
  expect(rows[0].xp).toBeGreaterThanOrEqual(5);
  await page.goto("/labs?course=AHT-001");
  await expect(page.getByRole("link", { name: /Diffraction by N slits/ })).toContainText("✓ done");
  await page.goto("/progress");
  await expect(page.getByRole("heading", { name: /^3D labs · 1 of \d+ done$/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Diffraction by N slits · tasks \d+%/ })).toBeVisible();
  expect(problems).toEqual([]);
});
