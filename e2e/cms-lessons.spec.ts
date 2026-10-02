import { test, expect, type Page } from "@playwright/test";
import { onboard, signIn, sql, uniqueEmail, watch } from "./helpers";

// AHT-003 unit 2 topic 1 has no built-in lesson, so students see the "not written yet" notes until a lesson is published.
const TOPIC = "/learn/AHT-003/2/1";
const NEW = "/admin/lessons/new?course=AHT-003&unit=2&topic=1";
const NOT_WRITTEN = /A step-by-step lesson for this topic is not written yet/;

async function fill(page: Page, tag: string, intro: string) {
  await page.getByLabel("Intro", { exact: true }).fill(intro);
  await page.getByLabel("Section 1 heading", { exact: true }).fill(`Big idea ${tag}`);
  await page.getByLabel("Section 1 paragraphs", { exact: true }).fill("An integral adds up many tiny slices to find a total.");
  await page.getByLabel("Section 2 heading", { exact: true }).fill(`Properties ${tag}`);
  await page.getByLabel("Section 2 paragraphs", { exact: true }).fill("Swapping the limits flips the sign of the answer.");
  await page.getByLabel("Example 1 question", { exact: true }).fill("Find the integral of 2x from 0 to 1.");
  await page.getByLabel("Example 1 steps", { exact: true }).fill("Integrate 2x to get x^2.\nPut in the limits: 1 - 0.");
  await page.getByLabel("Example 1 answer", { exact: true }).fill("1");
  await page.getByLabel("Mistakes", { exact: true }).fill("Forgetting the lower limit.\nMixing up the sign when limits swap.");
  await page.getByLabel("Check 1 question", { exact: true }).fill("What does swapping the limits do?");
  await page.getByLabel("Check 1 options", { exact: true }).fill("Flips the sign\nDoubles it\nNothing\nSquares it");
  await page.getByLabel("Check 1 correct option number", { exact: true }).fill("1");
  await page.getByLabel("Check 1 explanation", { exact: true }).fill("The sign flips.");
  await page.getByLabel("Check 2 question", { exact: true }).fill("The integral of 0 is?");
  await page.getByLabel("Check 2 options", { exact: true }).fill("0\n1");
  await page.getByLabel("Check 2 correct option number", { exact: true }).fill("1");
  await page.getByLabel("Check 2 explanation", { exact: true }).fill("Adding zeros gives zero.");
}

test("admin lesson CMS: draft is invisible, publish shows, edit updates, unpublish removes", async ({ page }) => {
  test.setTimeout(120_000);
  const tag = Date.now().toString(36);
  const intro1 = `Version one intro ${tag}: an integral adds up many tiny slices into a total.`;
  const intro2 = `Version two intro ${tag}: an integral adds up many tiny slices into a total.`;
  await sql("delete from cms_lessons where course='AHT-003' and unit=2 and topic=1");
  const email = uniqueEmail();
  await signIn(page, email);
  await onboard(page, "Teacher");
  expect((await page.goto("/admin/lessons"))?.status()).toBe(404);
  await sql("insert into admins(user_id) select id from auth.users where email=$1", [email]);
  const problems = watch(page);

  // nothing yet on the student page
  await page.goto(TOPIC);
  await expect(page.getByText(NOT_WRITTEN)).toBeVisible();

  // create a draft; an incomplete publish is refused with readable errors
  await page.goto(NEW);
  await expect(page.getByRole("heading", { level: 1, name: "New lesson" })).toBeVisible();
  await fill(page, tag, "Too short.");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByRole("alert").getByText(/intro needs more than 40 characters/)).toBeVisible();
  await page.getByLabel("Intro", { exact: true }).fill(intro1);
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page).toHaveURL(/\/admin\/lessons\/[0-9a-f-]{36}$/);
  await expect(page.getByText("Version 1")).toBeVisible();
  expect((await sql("select status from cms_lessons where course='AHT-003' and unit=2 and topic=1"))[0].status).toBe("draft");

  // the list shows it
  await page.goto("/admin/lessons?status=draft&course=AHT-003");
  await expect(page.getByRole("list", { name: "Lessons" }).getByText("Draft")).toBeVisible();

  // student still sees none while it is a draft
  await page.goto(TOPIC);
  await expect(page.getByText(NOT_WRITTEN)).toBeVisible();
  await expect(page.getByText(intro1)).toHaveCount(0);

  // publish
  await page.goto("/admin/lessons?course=AHT-003");
  await page.getByRole("list", { name: "Lessons" }).getByRole("link").first().click();
  await page.getByRole("button", { name: "Show preview" }).click();
  await expect(page.getByRole("region", { name: "Lesson preview" }).getByText(intro1)).toBeVisible(); // real LessonView
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByText("Version 2")).toBeVisible();
  await page.goto(TOPIC);
  await expect(page.getByText(intro1)).toBeVisible();
  await expect(page.getByRole("heading", { name: `Big idea ${tag}` })).toBeVisible();
  await expect(page.getByText(NOT_WRITTEN)).toHaveCount(0);

  // edit while published
  await page.goto("/admin/lessons?course=AHT-003&status=published");
  await page.getByRole("list", { name: "Lessons" }).getByRole("link").first().click();
  await page.getByLabel("Intro", { exact: true }).fill(intro2);
  await page.getByRole("button", { name: "Save and keep published" }).click();
  await expect(page.getByText("Version 3")).toBeVisible();
  await page.goto(TOPIC);
  await expect(page.getByText(intro2)).toBeVisible();
  await expect(page.getByText(intro1)).toHaveCount(0);

  // unpublish: gone again
  await page.goto("/admin/lessons?course=AHT-003&status=published");
  await page.getByRole("list", { name: "Lessons" }).getByRole("link").first().click();
  await page.getByRole("button", { name: "Unpublish" }).click();
  await expect(page.getByText("Version 4")).toBeVisible();
  await page.goto(TOPIC);
  await expect(page.getByText(NOT_WRITTEN)).toBeVisible();
  await expect(page.getByText(intro2)).toHaveCount(0);

  // import the built-in lesson as a draft for a topic that has one
  await sql("delete from cms_lessons where course='AHT-003' and unit=1 and topic=1");
  await page.goto("/admin/lessons/new?course=AHT-003&unit=1&topic=1");
  await page.getByRole("button", { name: "Start from the built-in lesson" }).click();
  await expect(page).toHaveURL(/\/admin\/lessons\/[0-9a-f-]{36}$/);
  await expect(page.getByLabel("Intro", { exact: true })).not.toHaveValue("");

  // delete the unpublished one
  await page.getByRole("button", { name: "Delete lesson" }).click();
  await page.getByRole("button", { name: "Yes, delete lesson" }).click();
  await expect(page).toHaveURL(/\/admin\/lessons$/);

  await sql("delete from cms_lessons where course='AHT-003' and unit in (1,2) and topic=1");
  expect(problems.filter((p) => !/\/_next\/|favicon/.test(p))).toEqual([]);
});
