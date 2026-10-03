import { test, expect, type Page } from "@playwright/test";
import { generate } from "../src/lib/quiz-core";
import { onboard, signIn, sql, uniqueEmail, watch } from "./helpers";

async function sessionSeed(id: string) {
  const [row] = await sql("select course, unit, seed, total from quiz_sessions where id = $1", [id]);
  return row as { course: string; unit: number; seed: number; total: number };
}
const sessionIdFrom = (page: Page) => new URL(page.url()).pathname.split("/").pop()!;

/** Answers question `index` correctly or wrongly by regenerating it from the seed the server stored. */
async function answer(page: Page, s: { course: string; unit: number; seed: number }, index: number, right: boolean) {
  const q = generate(s.course, s.unit, s.seed, index)!;
  if (q.type === "nat") await page.getByLabel("Your answer").fill(right ? String(q.a) : String((q.a as number) + 1000));
  else if (q.type === "mcq") await page.locator(".choice").nth(right ? (q.a as number) : ((q.a as number) + 1) % q.o!.length).click();
  else {
    const set = q.a as number[];
    const wrong = q.o!.map((_, i) => i).filter((i) => !set.includes(i))[0];
    for (const i of right ? set : [wrong]) await page.locator(".choice").nth(i).click();
  }
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByRole("status").filter({ hasText: right ? "Correct!" : "Not quite" })).toBeVisible();
}

/** After the last Finish click: if the server refuses because the quiz was too fast, backdate it (test-only) and retry. */
async function settle(page: Page, id: string) {
  const err = page.locator(".err"); const result = page.locator("main h1").filter({ hasText: /Nice work!|Keep practising/ });
  await expect(err.or(result)).toBeVisible({ timeout: 15_000 });
  if (await err.isVisible()) {
    await expect(err).toContainText("That was quick");
    await sql("update quiz_sessions set created_at = now() - interval '5 minutes' where id = $1", [id]);
    await page.getByRole("button", { name: "Try again" }).click();
  }
  await expect(result).toBeVisible();
}

async function startTopicQuiz(page: Page, course = "AHT-003", unit = 1, topic = 1) {
  await page.goto(`/learn/${course}/${unit}/${topic}`);
  await page.getByRole("button", { name: /Take the (topic )?quiz/i }).click();
  await expect(page).toHaveURL(/\/quiz\/[0-9a-f-]{36}$/);
  return sessionIdFrom(page);
}

test("browse syllabus: subjects, units, topics, lesson and self-check", async ({ page }) => {
  const problems = watch(page);
  await signIn(page, uniqueEmail());
  await onboard(page);

  await page.goto("/learn");
  await expect(page.getByText("26 courses, 963 topics and experiments")).toBeVisible();
  for (const g of ["Theory subjects", "Labs and practicals", "Minor: Advance Web Development"]) await expect(page.getByRole("heading", { name: g })).toBeVisible();
  await expect(page.locator("main li a")).toHaveCount(26);

  await page.getByRole("link", { name: /Introduction to Engineering Mathematics/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Introduction to Engineering Mathematics");
  await page.getByRole("link", { name: /Calculus I/ }).first().click();
  await expect(page.locator("ol li a").filter({ hasText: "Lagrange's multipliers" })).toBeVisible();
  await expect(page.getByText("0 of 11 topics done")).toBeVisible();

  await page.getByRole("link", { name: /^Limit/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Limit");
  for (const h of ["Worked examples", "Common mistakes", "Check yourself", "Topic quiz"]) await expect(page.getByRole("heading", { name: h })).toBeVisible();
  const item = page.getByRole("radiogroup", { name: "Question 1" });
  await item.getByRole("radio").nth(0).click();
  await expect(page.getByText("Factorise: (x − 1)(x + 1)/(x − 1) = x + 1 → 2.")).toBeVisible();
  await expect(item.getByRole("radio").nth(2)).toContainText("✓");

  await page.goto("/learn/AHT-001/1/1");
  await expect(page.getByText("A step-by-step lesson for this topic is not written yet")).toBeVisible();
  await page.goto("/learn/AHT-003/1/999"); await expect(page.getByRole("heading", { name: "This page could not be found." })).toBeVisible();
  await page.goto("/learn/NOPE-000"); await expect(page.getByRole("heading", { name: "This page could not be found." })).toBeVisible();

  await page.goto("/learn/AHP-001/lab/1");
  await expect(page.getByRole("heading", { name: "Viva questions" })).toBeVisible();
  expect(problems.filter((p) => !/404/.test(p))).toEqual([]);
});

test("topic quiz: server-scored, XP once, topic completes, no answers leak", async ({ page, browser }) => {
  test.setTimeout(90_000);
  const email = uniqueEmail();
  await signIn(page, email);
  await onboard(page);
  const id = await startTopicQuiz(page);
  const s = await sessionSeed(id);

  // the page payload must not contain any explanation or answer key
  const html = await (await page.request.get(`/quiz/${id}`)).text();
  const q0 = generate(s.course, s.unit, s.seed, 0)!;
  expect(html).not.toContain(q0.why.slice(0, 40));
  expect(html).not.toContain(String(s.seed));

  for (let i = 0; i < 5; i++) {
    await answer(page, s, i, true);
    await page.getByRole("button", { name: i < 4 ? "Continue" : "Finish" }).click();
  }
  await settle(page, id);
  await expect(page.getByText("5 of 5")).toBeVisible();
  await expect(page.getByText("+45 XP")).toBeVisible();
  await expect(page.getByText("Topic completed!")).toBeVisible();

  // trusted state
  const [xp] = await sql("select coalesce(sum(xp),0)::int as t from xp_events e join auth.users u on u.id=e.user_id where u.email=$1", [email]);
  expect(xp.t).toBe(45);
  await page.goto("/home");
  await expect(page.getByRole("group", { name: "Your stats" })).toContainText("45 total XP");
  await page.goto("/learn/AHT-003/1");
  await expect(page.getByText("1 of 11 topics done")).toBeVisible();
  await page.goto("/learn/AHT-003/1/1");
  await expect(page.getByText("Completed · best score 100%")).toBeVisible();

  // reopening a finished quiz cannot pay again
  await page.goto(`/quiz/${id}`);
  await expect(page.getByRole("heading", { name: "Quiz finished" })).toBeVisible();

  // another student cannot open it
  const other = await browser.newContext(); const op = await other.newPage();
  await signIn(op, uniqueEmail()); await onboard(op);
  const res = await op.goto(`/quiz/${id}`);
  expect(res!.status()).toBe(404);
  await other.close();

  // a second perfect attempt pays the quiz XP but not the topic bonus
  const id2 = await startTopicQuiz(page);
  const s2 = await sessionSeed(id2);
  for (let i = 0; i < 5; i++) { await answer(page, s2, i, true); await page.getByRole("button", { name: i < 4 ? "Continue" : "Finish" }).click(); }
  await settle(page, id2);
  await expect(page.getByText("+25 XP")).toBeVisible();
  await expect(page.getByText("Topic completed!")).toHaveCount(0);
});

test("failing a topic quiz gives partial XP and does not complete the topic", async ({ page }) => {
  const email = uniqueEmail();
  await signIn(page, email); await onboard(page);
  const id = await startTopicQuiz(page, "AHT-003", 1, 2);
  const s = await sessionSeed(id);
  for (let i = 0; i < 5; i++) { await answer(page, s, i, i < 2); await page.getByRole("button", { name: i < 4 ? "Continue" : "Finish" }).click(); }
  await settle(page, id);
  await expect(page.getByRole("heading", { name: "Keep practising" })).toBeVisible();
  await expect(page.getByText("2 of 5")).toBeVisible();
  await expect(page.getByText("+6 XP")).toBeVisible();
  await expect(page.getByText("Score 60% or more to complete this topic.")).toBeVisible();
  await page.goto("/learn/AHT-003/1");
  await expect(page.getByText("0 of 11 topics done")).toBeVisible();
});

test("practice: pick subject and unit, first answer is final, quiz resumes after reload", async ({ page }) => {
  await signIn(page, uniqueEmail()); await onboard(page);
  await page.goto("/practice");
  await expect(page.locator("main li a")).toHaveCount(13);
  await page.getByRole("link", { name: /Engineering Physics/ }).click();
  await page.getByRole("button", { name: /^Practise unit 1\b/ }).first().click();
  await expect(page).toHaveURL(/\/quiz\//);
  const id = sessionIdFrom(page); const s = await sessionSeed(id);
  expect(s.total).toBe(10);
  await answer(page, s, 0, false);
  await expect(page.getByText("Answer:")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Question 2 of 10")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Question 2 of 10")).toBeVisible();
  const [row] = await sql("select answers from quiz_sessions where id=$1", [id]);
  expect(Object.keys(row.answers as object)).toEqual(["0"]);
});

test("learn and quiz pages are accessible with no overflow", async ({ page }) => {
  const AxeBuilder = (await import("@axe-core/playwright")).default;
  await page.emulateMedia({ reducedMotion: "reduce" }); // axe must not measure contrast mid-fade
  await signIn(page, uniqueEmail()); await onboard(page);
  const id = await startTopicQuiz(page, "AHT-003", 1, 3);
  const pages = ["/learn", "/learn/AHT-003", "/learn/AHT-003/1", "/learn/AHT-003/1/8", "/learn/AHT-001/1/1", "/practice", "/practice/AHT-003", "/learn/AHP-001/lab/1", `/quiz/${id}`];
  for (const p of pages) {
    await page.goto(p);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, p).toBeLessThanOrEqual(0);
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id + " " + v.nodes[0].html.slice(0, 90)), p).toEqual([]);
  }
});
