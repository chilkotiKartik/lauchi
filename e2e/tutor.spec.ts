import { test, expect } from "@playwright/test";
import { onboard, signIn, uniqueEmail, watch } from "./helpers";

test("Ask Lochi shows what it can see, and says so when the AI is not switched on", async ({ page }) => {
  const problems = watch(page);
  await signIn(page, uniqueEmail());
  await onboard(page);
  await page.goto("/ask?course=EET-001&unit=1");
  await expect(page.getByRole("heading", { level: 1, name: "Ask Lochi" })).toBeVisible();
  const chips = page.getByRole("region", { name: "What Lochi can see" });
  await expect(chips).toBeVisible();
  await expect(chips.getByText("Unit 1 syllabus")).toBeVisible();
  await expect(page.getByText(/isn't switched on/)).toBeVisible();
  // a plain /ask has no chips
  await page.goto("/ask");
  await expect(page.getByRole("region", { name: "What Lochi can see" })).toHaveCount(0);
  expect(problems).toEqual([]);
});

test("POST /api/ask answers 503 not_configured without a Gemini key", async ({ page }) => {
  await signIn(page, uniqueEmail());
  await onboard(page);
  const body = { messages: [{ role: "user", content: "hi" }], ctx: { course: "EET-001", unit: 1 } };
  for (const data of [body, { ...body, mode: "similar" }]) {
    const r = await page.request.post("/api/ask", { data });
    expect(r.status()).toBe(503);
    expect((await r.json()).code).toBe("not_configured");
  }
});
