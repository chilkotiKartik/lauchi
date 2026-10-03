import { test, expect, type Page } from "@playwright/test";
import { fromTemplate, generate, pickSeed } from "../src/lib/quiz-core";
import type { RawQuestion } from "../src/content/gen.generated.cjs";
import { splitSteps } from "../src/lib/steps";
import { parseQuizRef } from "../src/lib/revise";
import { onboard, signIn, sql, uniqueEmail, watch } from "./helpers";

type Sess = { course: string; unit: number; seed: number; total: number; picks: Record<string, number> };
const sessionIdFrom = (page: Page) => new URL(page.url()).pathname.split("/").pop()!;

/** Question i of an adaptive practice session: question 0 comes from the seed, later ones from the stored template pick. */
async function practiceQuestion(id: string, i: number): Promise<RawQuestion> {
  const [row] = await sql("select course, unit, seed, total, picks from quiz_sessions where id = $1", [id]) as Sess[];
  if (i === 0) return generate(row.course, row.unit, row.seed, 0)!;
  const t = row.picks[String(i)];
  expect(typeof t, `pick for question ${i}`).toBe("number");
  return fromTemplate(row.course, row.unit, t, pickSeed(row.seed, i))!;
}

async function choose(page: Page, q: RawQuestion, right: boolean) {
  if (q.type === "nat") await page.getByLabel("Your answer").fill(right ? String(q.a) : String((q.a as number) + 1000));
  else if (q.type === "mcq") await page.locator(".choice").nth(right ? (q.a as number) : ((q.a as number) + 1) % q.o!.length).click();
  else {
    const set = q.a as number[];
    const wrong = q.o!.map((_, i) => i).filter((i) => !set.includes(i))[0];
    for (const i of right ? set : [wrong]) await page.locator(".choice").nth(i).click();
  }
}

test("revise today: a missed practice question comes back, and a right review moves it up the ladder", async ({ page }) => {
  test.setTimeout(120_000);
  const problems = watch(page);
  const email = uniqueEmail();
  await signIn(page, email); await onboard(page);
  await page.goto("/revise");
  await expect(page.getByRole("heading", { level: 1, name: "Revise today" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Nothing to revise yet" })).toBeVisible();

  await page.goto("/practice");
  await page.getByRole("link", { name: /Engineering Physics/ }).click();
  await page.getByRole("button", { name: /^Practise unit 1\b/ }).first().click();
  await expect(page).toHaveURL(/\/quiz\/[0-9a-f-]{36}$/);
  const id = sessionIdFrom(page);
  await expect(page.getByText(/^Level: (warming up|steady|challenge)$/)).toBeVisible();

  // question 1 wrong
  const q0 = await practiceQuestion(id, 0);
  await choose(page, q0, false);
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Not quite" })).toBeVisible();
  const method = page.getByRole("region", { name: "Worked solution" });
  await expect(method).toBeVisible();
  await expect(method.locator("li")).toHaveCount(1);
  // the next question was chosen adaptively and stored, so a reload shows the same one
  const [after] = await sql("select picks from quiz_sessions where id = $1", [id]) as { picks: Record<string, number> }[];
  expect(typeof after.picks["1"]).toBe("number");

  // StepByStep: find a question whose working has 2+ steps (answering right) and reveal it one step at a time
  let shown = splitSteps(q0.why).length > 1;
  if (shown) {
    await method.getByRole("button", { name: "Next step" }).click();
    await expect(method.locator("li")).toHaveCount(2);
    if (splitSteps(q0.why).length > 2) await method.getByRole("button", { name: "Show all" }).click();
    await expect(method.locator("li")).toHaveCount(splitSteps(q0.why).length);
    await expect(method.getByText("Final answer")).toBeVisible();
  }
  for (let i = 1; i < 10 && !shown; i++) {
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText(`Question ${i + 1} of 10`)).toBeVisible();
    const q = await practiceQuestion(id, i);
    await choose(page, q, true);
    await page.getByRole("button", { name: "Check" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Correct!" })).toBeVisible();
    const n = splitSteps(q.why).length;
    await expect(method.locator("li")).toHaveCount(1);
    if (n > 1) {
      await expect(method.getByText("Try the next step yourself first")).toBeVisible();
      await method.getByRole("button", { name: "Next step" }).click();
      await expect(method.locator("li")).toHaveCount(2);
      if (n > 2) await method.getByRole("button", { name: "Show all" }).click();
      await expect(method.locator("li")).toHaveCount(n);
      await expect(method.getByText("Final answer")).toBeVisible();
      shown = true;
    }
  }
  expect(shown, "found a multi-step worked solution").toBe(true);

  // the miss is queued, due tomorrow (India day)
  const items = await sql("select r.ref, r.step, (r.due = revise_today() + 1) as tomorrow from revise_items r join auth.users u on u.id = r.user_id where u.email = $1 and r.kind = 'quiz'", [email]);
  expect(items).toHaveLength(1);
  expect(items[0]).toMatchObject({ step: 0, tomorrow: true });
  const ref = parseQuizRef(items[0].ref as string)!;
  expect(fromTemplate(ref.course, ref.unit, ref.t, ref.s)!.q).toBe(q0.q);

  await page.goto("/revise");
  await expect(page.getByRole("heading", { name: "All caught up for today!" })).toBeVisible();
  await sql("update revise_items set due = revise_today() where user_id = (select id from auth.users where email = $1)", [email]);
  await page.reload();
  await expect(page.getByTestId("due-count")).toHaveText("1 due");
  await expect(page.getByText("Review 1 of 1")).toBeVisible();
  await choose(page, q0, true);
  await page.getByRole("button", { name: "Check" }).click();
  const verdict = page.getByRole("status").filter({ hasText: "Correct!" });
  await expect(verdict).toBeVisible();
  await expect(verdict).toContainText("Next review in 3 days");
  await expect(page.getByRole("region", { name: "Worked solution" })).toBeVisible();
  await expect(page.getByTestId("due-count")).toHaveText("0 due");
  const [moved] = await sql("select r.step, (r.due = revise_today() + 3) as in3 from revise_items r join auth.users u on u.id = r.user_id where u.email = $1", [email]);
  expect(moved).toMatchObject({ step: 1, in3: true });
  const [xp] = await sql("select count(*)::int as n from xp_events e join auth.users u on u.id = e.user_id where u.email = $1 and e.ref like 'revise:%'", [email]);
  expect(xp.n).toBe(1);
  await page.getByRole("button", { name: "Finish session" }).click();
  await expect(page.getByRole("heading", { name: "Session done!" })).toBeVisible();
  expect(problems).toEqual([]);
});

test("PYQ practised ticks are stored on the account and follow the student to a fresh browser", async ({ page, browser }) => {
  const problems = watch(page);
  const email = uniqueEmail();
  // a tick saved on this device by the old version is moved to the account once
  await page.addInitScript(() => { if (!sessionStorage.getItem("seeded")) { localStorage.setItem("lockin.pyq.done", JSON.stringify(["AHT-001:Q1.1"])); sessionStorage.setItem("seeded", "1"); } });
  await signIn(page, email); await onboard(page);
  await page.goto("/pyq?course=MET-001&unit=4");
  const cards = page.locator("li.pyq-card");
  await expect(page.getByText(/^0 of \d+ question sets practised$/)).toBeVisible();
  await cards.first().getByRole("button", { name: "Mark practised" }).click();
  await expect(page.getByText(/^1 of \d+ question sets practised$/)).toBeVisible();
  await expect.poll(async () => (await sql("select r.ref from revise_items r join auth.users u on u.id = r.user_id where u.email = $1 and r.kind = 'pyq' order by r.ref", [email])).map((r) => r.ref))
    .toEqual(["AHT-001:Q1.1", expect.stringMatching(/^MET-001:/)]);
  expect(await page.evaluate(() => localStorage.getItem("lockin.pyq.done"))).toBeNull();

  const other = await browser.newContext();
  const p2 = await other.newPage();
  await signIn(p2, email);
  await expect(p2).toHaveURL(/\/home$/);
  await p2.goto("/pyq?course=MET-001&unit=4");
  await expect(p2.getByText(/^1 of \d+ question sets practised$/)).toBeVisible();
  await expect(p2.locator("li.pyq-card").getByRole("button", { name: "✓ Practised" })).toHaveCount(1);
  await p2.goto("/pyq?course=AHT-001&unit=1");
  await expect(p2.getByText(/^1 of \d+ question sets practised$/)).toBeVisible();

  // practised PYQs come back for review with a self-grade
  await sql("update revise_items set due = revise_today() where user_id = (select id from auth.users where email = $1)", [email]);
  await p2.goto("/revise");
  await expect(p2.getByTestId("due-count")).toHaveText("2 due");
  await p2.getByRole("button", { name: "I need more practice" }).click();
  await expect(p2.getByRole("status").filter({ hasText: "bring it back soon" })).toContainText("Next review tomorrow");
  await other.close();

  // unticking removes it from the queue
  await page.goto("/pyq?course=MET-001&unit=4");
  await page.locator("li.pyq-card").getByRole("button", { name: "✓ Practised" }).click();
  await expect(page.getByText(/^0 of \d+ question sets practised$/)).toBeVisible();
  await expect.poll(async () => (await sql("select count(*)::int as n from revise_items r join auth.users u on u.id = r.user_id where u.email = $1 and r.course = 'MET-001'", [email]))[0].n).toBe(0);
  expect(problems).toEqual([]);
});
