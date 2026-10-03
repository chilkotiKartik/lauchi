import { test, expect } from "@playwright/test";
import { onboard, signIn, sql, uniqueEmail, watch } from "./helpers";

const COURSE = "AHT-002";
const UNIT = 3;
const BANK = `/bank?course=${COURSE}&unit=${UNIT}`;

test("question bank CMS: draft is hidden, publish goes live, edits show up, unpublish hides it, answers are checked on the server", async ({ page, browser }, info) => {
  test.setTimeout(150_000);
  const tag = Date.now().toString(36);
  const stem = `E2E which of these is a vector ${tag}?`;
  const stem2 = `E2E edited: which of these is a vector quantity ${tag}?`;
  const explanation = `E2E velocity has a direction ${tag}`;
  const csvStem = `E2E imported question ${tag}`;
  const adminEmail = uniqueEmail();
  const studentEmail = uniqueEmail();

  await signIn(page, adminEmail);
  await onboard(page, "Teacher", 2); // Chemistry is CSE semester 2
  // students get a 404 on the admin pages; then make this user an admin the way the site owner would
  expect((await page.goto("/admin/questions"))?.status()).toBe(404);
  await sql("insert into admins(user_id) select id from auth.users where email=$1", [adminEmail]);
  const problems = watch(page);

  const ctx = await browser.newContext({ ...info.project.use, baseURL: info.project.use.baseURL ?? "http://localhost:3100" });
  const student = await ctx.newPage();
  await signIn(student, studentEmail);
  await onboard(student, "Student", 2);
  expect((await student.goto("/admin/questions/new"))?.status()).toBe(404);

  // ---- admin creates a draft (validation first)
  await page.goto("/admin/questions");
  await expect(page.getByRole("heading", { level: 1, name: "Questions" })).toBeVisible();
  await page.getByRole("link", { name: "New question" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "New question" })).toBeVisible();
  await page.getByRole("button", { name: "Save question" }).click();
  await expect(page.getByText("Please fix the highlighted fields.")).toBeVisible();
  await page.getByLabel("Subject").selectOption(COURSE);
  await page.getByLabel("Unit", { exact: true }).selectOption(String(UNIT));
  await page.getByLabel("Question", { exact: true }).fill(stem);
  await page.getByLabel("Option A", { exact: true }).fill("Mass");
  await page.getByLabel("Option B", { exact: true }).fill("Velocity");
  await page.getByRole("button", { name: "Add option" }).click();
  await page.getByLabel("Option C", { exact: true }).fill("Temperature");
  await page.getByLabel("Option B is correct").check();
  await page.getByLabel("Explanation").fill(explanation);
  await page.getByLabel("Steps (one per line)").fill("Vectors have size and direction.\nVelocity is speed with a direction.");
  // live preview shows the question as typed
  await expect(page.getByRole("heading", { name: "Live preview" })).toBeVisible();
  await expect(page.getByRole("radiogroup", { name: "Preview answer" }).getByRole("radio")).toHaveCount(3);
  await page.getByRole("button", { name: "Save question" }).click();
  await expect(page).toHaveURL(/\/admin\/questions\/[0-9a-f-]{36}\?created=1/);
  await expect(page.getByText("Saved as a draft").first()).toBeVisible();
  const id = new URL(page.url()).pathname.split("/").pop()!;
  const [row] = await sql("select status, answer, published_at from cms_questions where id=$1", [id]);
  expect(row.status).toBe("draft");
  expect(row.answer).toBe(1);
  expect(row.published_at).toBeNull();

  // ---- the student does not see the draft
  await student.goto(BANK);
  await expect(student.getByRole("heading", { level: 1, name: "Question bank" })).toBeVisible();
  await expect(student.getByText(stem)).toHaveCount(0);

  // ---- admin publishes it
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByText("1 question published.")).toBeVisible();
  expect((await sql("select status from cms_questions where id=$1", [id]))[0].status).toBe("published");

  // ---- the student sees it at once; the key is not in the page before answering
  await student.goto(BANK);
  await expect(student.getByText(stem)).toBeVisible();
  expect(await student.content()).not.toContain(explanation);
  await student.getByRole("radio", { name: /Velocity/ }).click();
  await student.getByRole("button", { name: "Check answer" }).click();
  const verdict = student.getByRole("status").filter({ hasText: "Correct!" });
  await expect(verdict).toBeVisible();
  await expect(verdict.getByText(explanation)).toBeVisible();
  await expect(student.getByRole("list", { name: "Worked steps" }).getByRole("listitem")).toHaveCount(2);
  const xp = await sql("select xp from xp_events where ref like $1 and user_id=(select id from auth.users where email=$2)", [`cms:${id}:%`, studentEmail]);
  expect(xp).toHaveLength(1);
  expect(Number(xp[0].xp)).toBe(3);
  await expect(student.getByRole("button", { name: "See my result" })).toBeVisible();

  // ---- a wrong answer is graded on the server too, shows the right answer, and pays no second XP
  await student.goto(BANK);
  await student.getByRole("radio", { name: /Mass/ }).click();
  await student.getByRole("button", { name: "Check answer" }).click();
  await expect(student.getByRole("status").filter({ hasText: "Not quite." })).toContainText("Velocity");
  expect(await sql("select 1 from xp_events where ref like $1", [`cms:${id}:%`])).toHaveLength(1);
  expect((await sql("select correct from cms_question_attempts where question_id=$1", [id]))[0].correct).toBe(false);
  await student.getByRole("button", { name: "See my result" }).click();
  await student.getByRole("link", { name: "Practise the ones I missed" }).click();
  await expect(student.getByText(stem)).toBeVisible();

  // ---- admin edits the stem; the student sees the update
  await page.getByLabel("Question", { exact: true }).fill(stem2);
  await page.getByRole("button", { name: "Save question" }).click();
  await expect(page.getByText(/^Saved\./)).toBeVisible();
  await student.goto(BANK);
  await expect(student.getByText(stem2)).toBeVisible();
  await expect(student.getByText(stem, { exact: true })).toHaveCount(0);

  // ---- the list shows it with a status badge, and it is searchable
  await page.goto(`/admin/questions?q=${encodeURIComponent(tag)}&status=published`);
  const item = page.getByRole("list", { name: "Questions" }).getByRole("listitem").filter({ hasText: stem2 });
  await expect(item).toBeVisible();
  await expect(item.getByText("Published", { exact: true })).toBeVisible();

  // ---- admin unpublishes from the list (bulk); it disappears for the student
  await item.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Unpublish selected" }).click();
  await expect(page.getByText("1 question unpublished.")).toBeVisible();
  expect((await sql("select status from cms_questions where id=$1", [id]))[0].status).toBe("draft");
  await student.goto(BANK);
  await expect(student.getByText(stem2)).toHaveCount(0);
  await expect(student.getByText("No questions are published for this unit yet.")).toBeVisible();
  // and the grading action refuses a question that is no longer published
  const refused = await sql("select count(*)::int as n from cms_questions where id=$1 and status='published'", [id]);
  expect(refused[0].n).toBe(0);

  // ---- CSV import is all-or-nothing, with a preview
  await page.goto("/admin/questions/import");
  const header = "course,unit,kind,stem,options,answer,tolerance,explanation,steps,difficulty,tags";
  await page.getByLabel("CSV text").fill(`${header}\n${COURSE},${UNIT},mcq,${csvStem},Only one option,A,,,,2,\n`);
  await page.getByRole("button", { name: "Check the CSV" }).click();
  await expect(page.getByText(/Nothing was imported/)).toBeVisible();
  await expect(page.getByRole("list", { name: "Rows to fix" })).toContainText("Add at least 2 options");
  await page.getByLabel("CSV text").fill(`${header}\n${COURSE},${UNIT},mcq,${csvStem},Yes|No,B,,Because,,2,e2e\n`);
  await page.getByRole("button", { name: "Check the CSV" }).click();
  await expect(page.getByText(/1 question looks good/)).toBeVisible();
  expect(await sql("select 1 from cms_questions where stem=$1", [csvStem])).toHaveLength(0);
  await page.getByRole("button", { name: /^Import 1 questions/ }).click();
  await expect(page.getByText("Imported 1 question as drafts.")).toBeVisible();
  expect(await sql("select status from cms_questions where stem=$1", [csvStem])).toEqual([{ status: "draft" }]);

  // ---- bank pages have no horizontal overflow
  for (const [p, pg] of [["/bank", student], [BANK, student], ["/admin/questions", page], ["/admin/questions/new", page]] as const) {
    await pg.goto(p);
    expect(await pg.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }

  // ---- delete the test data, through the UI for one of them
  await page.goto(`/admin/questions?q=${encodeURIComponent(tag)}`);
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: /^Delete: E2E/ }).first().click();
  await page.waitForTimeout(800);
  await sql("delete from cms_questions where stem like $1", [`%${tag}%`]);
  await ctx.close();
  expect(problems.filter((p) => !p.includes("http 404"))).toEqual([]);
});
