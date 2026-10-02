import { test, expect, type Page } from "@playwright/test";
import { onboard, signIn, uniqueEmail, watch } from "./helpers";

/** On phones the panel starts collapsed under the page header; open it if its tabs are hidden. */
async function openPanel(page: Page) {
  const panel = page.getByTestId("experiment-panel");
  await expect(panel).toBeVisible();
  const tabs = panel.getByRole("tablist", { name: "Experiment sections" });
  if (!(await tabs.isVisible())) await panel.getByRole("button", { expanded: false }).first().click();
  await expect(tabs).toBeVisible();
  return panel;
}

test("guided experiment on the Thevenin lab: live steps, questions, score, best score kept", async ({ page }) => {
  test.setTimeout(90_000);
  const problems = watch(page);
  await signIn(page, uniqueEmail());
  await onboard(page);
  await page.goto("/labs/thevenin");
  await expect(page.getByRole("heading", { level: 1, name: /Thevenin/ })).toBeVisible();
  const panel = await openPanel(page);

  // Aim & Equipment is the first tab
  await expect(panel.getByRole("tab", { name: "Aim & Equipment", selected: true })).toBeVisible();
  await expect(panel.getByRole("heading", { name: "Equipment" })).toBeVisible();

  // Steps: nothing is ticked until the real lab changes
  await panel.getByRole("tab", { name: "Steps" }).click();
  const firstStep = panel.getByRole("listitem").first();
  await expect(firstStep).toHaveAttribute("data-done", "false");
  const slider = page.getByRole("slider", { name: "Load R_L" });
  await slider.scrollIntoViewIfNeeded();
  await slider.focus();
  for (let i = 0; i < 4; i++) await slider.press("ArrowRight");
  await panel.scrollIntoViewIfNeeded();
  await expect(firstStep).toHaveAttribute("data-done", "true");

  // Questions: first one wrong -> solution is shown
  await panel.getByRole("tab", { name: "Questions" }).click();
  await expect(panel.getByText("Question 1 of 8")).toBeVisible();
  await panel.getByRole("radio", { name: "R1 + R2" }).check();
  await panel.getByRole("button", { name: "Check answer" }).click();
  await expect(panel.getByRole("status").filter({ hasText: "Not quite" })).toBeVisible();
  await expect(panel.getByText("Solution", { exact: true })).toBeVisible();
  await panel.getByRole("button", { name: "Next question" }).click();

  // Answer the other seven correctly: mcq/tf by option index, numeric by value
  // q2 mcq 1, q3 mcq 1, q4 false (second radio), q5 true (first radio), q6-q8 numeric
  const plan: (number | string)[] = [1, 1, 1, 0, "18", "2.4", "6.75"];
  for (let i = 0; i < plan.length; i++) {
    const a = plan[i];
    if (typeof a === "string") await panel.getByRole("textbox", { name: /Your answer/ }).fill(a);
    else await panel.getByRole("radio").nth(a).check();
    await panel.getByRole("button", { name: "Check answer" }).click();
    await expect(panel.getByRole("status").filter({ hasText: "Correct" })).toBeVisible();
    await panel.getByRole("button", { name: i === plan.length - 1 ? "See results" : "Next question" }).click();
  }

  // Results: 14 of 16 marks = 88%
  await expect(panel.getByRole("tab", { name: "Results", selected: true })).toBeVisible();
  await expect(panel.getByTestId("exp-score")).toHaveText("88%");
  await expect(panel.getByText("14 / 16 marks")).toBeVisible();
  await expect(panel.getByRole("button", { name: "Retry questions" })).toBeVisible();

  // The best score survives a reload
  await page.reload();
  await expect(page.getByTestId("experiment-panel").getByText("Best 88%")).toBeVisible();
  expect(problems).toEqual([]);
});
