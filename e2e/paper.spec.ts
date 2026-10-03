import { test, expect, type Page } from "@playwright/test";
import { onboard, signIn, uniqueEmail, watch } from "./helpers";

async function ready(page: Page) {
  await signIn(page, uniqueEmail());
  await onboard(page, "Kalu", 2); // Mechanical and Electronics are CSE semester 2
}

test("full paper: start, tick two parts per question, submit, self-mark, reload, history", async ({ page }) => {
  const problems = watch(page);
  await ready(page);

  await page.goto("/paper/MET-001");
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  await expect(page.getByText(/Attempt any TWO parts of each question/).first()).toBeVisible();
  await expect(page.getByText("UTU-style pattern based on recent papers; check your own paper's instructions.").first()).toBeVisible();
  await expect(page.getByLabel("Practice mode", { exact: false }).first()).toBeChecked();
  await page.getByRole("button", { name: "Start the paper" }).click();
  await expect(page).toHaveURL(/\/paper\/MET-001\/[0-9a-f-]{36}$/);

  // the paper: 5 questions × 3 parts, the instruction text, a running clock
  await expect(page.getByText(/Attempt any TWO parts of each question/).first()).toBeVisible();
  await expect(page.locator("li.pp-q")).toHaveCount(5);
  await expect(page.locator("li.pp-part")).toHaveCount(15);
  await expect(page.getByRole("timer")).toContainText(/^2:59:|^3:00:00$/);

  // practice mode can pause; the clock stops and then resumes
  await page.getByRole("button", { name: "Pause the clock" }).click();
  await expect(page.getByRole("button", { name: "Resume the clock" })).toBeVisible();
  await page.getByRole("button", { name: "Resume the clock" }).click();
  await expect(page.getByRole("button", { name: "Pause the clock" })).toBeVisible();

  // two parts of question 1 are attempted; a third one cannot be
  await page.getByRole("button", { name: "Mark Q1 (a) as attempted" }).click();
  await page.getByRole("button", { name: "Mark Q1 (b) as attempted" }).click();
  await expect(page.getByRole("button", { name: "Mark Q1 (a) as attempted" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Mark Q1 (c) as attempted" })).toBeDisabled();
  await page.getByLabel("Scratch notes").fill("remember: efficiency = 1 - Tc/Th");
  await expect(page.getByText("All changes saved")).toBeVisible();

  // state survives a reload
  await page.reload();
  await expect(page.getByRole("button", { name: "Mark Q1 (b) as attempted" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Scratch notes")).toHaveValue("remember: efficiency = 1 - Tc/Th");

  // hand in
  await page.getByRole("button", { name: "Submit paper" }).click();
  await page.getByRole("button", { name: "Yes, submit" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Mark your paper" })).toBeVisible();

  // review: rubric checkboxes add to the total
  const total = page.getByTestId("paper-total");
  await expect(total).toHaveText("0");
  const part = page.locator('article[data-part="1a"]');
  const boxes = part.getByRole("checkbox");
  expect(await boxes.count()).toBeGreaterThanOrEqual(2);
  await boxes.first().check();
  await expect.poll(async () => Number(await total.textContent())).toBeGreaterThan(0);
  const one = Number(await total.textContent());
  await boxes.nth(1).check();
  await expect.poll(async () => Number(await total.textContent())).toBeGreaterThan(one);
  await expect(page.getByText("Marks saved")).toBeVisible();
  const saved = await total.textContent();

  // reload keeps the ticks and the total
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Mark your paper" })).toBeVisible();
  await expect(page.getByTestId("paper-total")).toHaveText(saved!);
  await expect(page.locator('article[data-part="1a"]').getByRole("checkbox").first()).toBeChecked();

  // photo check is not switched on without a key, and nothing is stored
  await expect(page.getByText(/never stored|isn't switched on yet/).first()).toBeVisible();

  // history lists the attempt with its score
  await page.goto("/paper/MET-001");
  const item = page.getByTestId("paper-history-item");
  await expect(item).toHaveCount(1);
  await expect(item.first()).toContainText(`${saved}/100`);
  await page.goto("/paper");
  await expect(page.getByTestId("paper-history-item")).toHaveCount(1);
  expect(problems).toEqual([]);
});

test("exam mode has no pause button", async ({ page }) => {
  await ready(page);
  await page.goto("/paper/ECT-001");
  await page.getByLabel(/Exam mode/).check();
  await page.getByRole("button", { name: "Start the paper" }).click();
  await expect(page).toHaveURL(/\/paper\/ECT-001\/[0-9a-f-]{36}$/);
  await expect(page.getByText(/Exam mode/).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Pause the clock/ })).toHaveCount(0);
});

test("POST /api/check: 401 signed out, 503 without a key", async ({ page, request, baseURL }) => {
  const body = { course: "MET-001", id: "Q1.1", image: "A".repeat(200) };
  const out = await request.post(`${baseURL}/api/check`, { data: body, maxRedirects: 0 }); // needs "/api/check" public in src/proxy.ts
  expect(out.status()).toBe(401);
  await ready(page);
  test.skip(!!process.env.GEMINI_API_KEY, "a Gemini key is set, so the check is switched on");
  const res = await page.request.post("/api/check", { data: body });
  expect(res.status()).toBe(503);
  expect((await res.json()).message).toMatch(/isn't switched on yet/);
});
