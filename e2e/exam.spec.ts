import { test, expect } from "@playwright/test";
import { onboard, signIn, sql, uniqueEmail, watch } from "./helpers";

test("exam prep: set the date, build a schedule, tick tasks, narrow the syllabus and regenerate", async ({ page }) => {
  test.setTimeout(120_000);
  const problems = watch(page);
  const email = uniqueEmail();
  await signIn(page, email);
  await onboard(page, "Examinee");

  await page.goto("/exam");
  await expect(page.getByRole("heading", { name: "When is your exam?" })).toBeVisible();
  const date = new Date(Date.now() + 20 * 86_400_000).toISOString().slice(0, 10);
  await page.getByLabel("Exam date").fill(date);
  await page.getByRole("button", { name: "Set exam date" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Exam prep" })).toBeVisible(); // the page re-renders into the full hub once the date is saved
  expect((await sql("select exam_date::text as d from profiles p join auth.users u on u.id=p.id where u.email=$1", [email]))[0].d).toBe(date);

  await page.goto("/exam");
  await expect(page.getByRole("heading", { level: 1, name: "Exam prep" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Countdown" })).toBeVisible();
  await page.getByRole("button", { name: "Build my schedule" }).click();
  const bar = page.getByRole("progressbar", { name: "Schedule progress" });
  await expect(bar).toHaveAttribute("aria-valuenow", "0");
  const total = Number((await sql("select count(*)::int as n from exam_tasks t join auth.users u on u.id=t.user_id where u.email=$1", [email]))[0].n);
  expect(total).toBeGreaterThan(5);
  expect((await sql("select count(*)::int as n from exam_tasks t join auth.users u on u.id=t.user_id where u.email=$1 and t.day >= $2::date", [email, date]))[0].n).toBe(0);

  // tick the first task of today
  await page.getByRole("checkbox").first().check();
  await expect(bar).not.toHaveAttribute("aria-valuenow", "0");
  await expect.poll(async () => Number((await sql("select count(*)::int as n from exam_tasks t join auth.users u on u.id=t.user_id where u.email=$1 and t.done", [email]))[0].n)).toBe(1);
  await page.reload();
  await expect(page.getByRole("checkbox", { checked: true }).first()).toBeChecked();

  // narrow the syllabus to one unit and rebuild: ticked work stays, the rest only covers the chosen unit
  await page.getByText(/Choose subjects and units/).click();
  const boxes = page.locator('input[name="unit"]');
  for (const b of await boxes.all()) await b.uncheck();
  await boxes.first().check();
  await page.getByRole("button", { name: "Save my syllabus" }).click();
  await expect(page.getByText(/Saved 1 unit/)).toBeVisible();
  await page.getByRole("button", { name: "Regenerate schedule" }).click();
  await expect.poll(async () => (await sql("select count(distinct (t.course, t.unit))::int as n from exam_tasks t join auth.users u on u.id=t.user_id where u.email=$1 and not t.done and t.kind <> 'mock'", [email]))[0].n)
    .toBe(1);
  expect(Number((await sql("select count(*)::int as n from exam_tasks t join auth.users u on u.id=t.user_id where u.email=$1 and t.done", [email]))[0].n)).toBe(1);
  expect(problems).toEqual([]);
});
