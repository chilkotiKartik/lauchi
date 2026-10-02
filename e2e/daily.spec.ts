import { test, expect, type Page } from "@playwright/test";
import { fromTemplate } from "../src/lib/quiz-core";
import type { RawQuestion } from "../src/content/gen.generated.cjs";
import { onboard, signIn, sql, uniqueEmail, watch } from "./helpers";

type Item = { c: string; u: number; t: number; s: number };

async function choose(page: Page, q: RawQuestion, right: boolean) {
  if (q.type === "nat") await page.getByLabel("Your answer").fill(right ? String(q.a) : String((q.a as number) + 1000));
  else if (q.type === "mcq") await page.locator(".choice").nth(right ? (q.a as number) : ((q.a as number) + 1) % q.o!.length).click();
  else {
    const set = q.a as number[];
    const wrong = q.o!.map((_, i) => i).filter((i) => !set.includes(i))[0];
    for (const i of right ? set : [wrong]) await page.locator(".choice").nth(i).click();
  }
}

test("daily challenge: five graded questions, XP once, no retry; weekly goal saves", async ({ page }) => {
  test.setTimeout(120_000);
  const problems = watch(page);
  const email = uniqueEmail();
  await signIn(page, email); await onboard(page);

  await page.goto("/daily");
  await expect(page.getByRole("heading", { level: 1, name: "Daily challenge" })).toBeVisible();
  await expect(page.getByText("0 of 2 streak freezes banked")).toBeAttached();
  await expect(page.getByRole("list", { name: "Daily challenge history" }).locator("li")).toHaveCount(14);

  const [row] = await sql("select d.items, d.user_id from daily_challenges d join auth.users u on u.id = d.user_id where u.email = $1", [email]) as { items: Item[]; user_id: string }[];
  expect(row.items).toHaveLength(5);

  // question 2 wrong, the rest right
  for (let i = 0; i < 5; i++) {
    const q = fromTemplate(row.items[i].c, row.items[i].u, row.items[i].t, row.items[i].s)!;
    await expect(page.getByText(`Question ${i + 1} of 5`)).toBeVisible();
    await choose(page, q, i !== 1);
    await page.getByRole("button", { name: "Check", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: i === 1 ? "Not quite" : "Correct!" })).toBeVisible();
    await page.getByRole("button", { name: i === 4 ? "See my score" : "Next question" }).click();
  }

  await expect(page.getByRole("heading", { name: "Done for today!" })).toBeVisible();
  await expect(page.getByText("You got 4 of 5")).toBeVisible();
  await expect(page.getByText("+21 XP")).toBeVisible(); // 5 + 4 correct x 4
  await expect(page.getByRole("button", { name: "Check", exact: true })).toHaveCount(0);

  // XP was paid exactly once
  const paid = () => sql("select count(*)::int as n, coalesce(sum(xp),0)::int as xp from xp_events where user_id = $1 and ref like 'daily:%'", [row.user_id]);
  expect((await paid())[0]).toEqual({ n: 1, xp: 21 });

  // reloading shows the finished state, no second attempt, no second payment
  await page.reload();
  await expect(page.getByRole("heading", { name: "Done for today!" })).toBeVisible();
  await expect(page.locator("[data-done='1']")).toHaveCount(1);
  await expect(page.getByRole("list", { name: "Your answers" }).locator("li")).toHaveCount(5);
  await expect(sql("select daily_answer($1, (now() at time zone 'Asia/Kolkata')::date, 0, '1'::jsonb, true)", [row.user_id])).rejects.toThrow(/already completed/);
  expect((await paid())[0]).toEqual({ n: 1, xp: 21 });

  // weekly goals
  await page.goto("/goals");
  await expect(page.getByRole("heading", { level: 1, name: "Weekly goals" })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "XP earned" })).toBeVisible();
  await page.getByLabel("XP this week").fill("400");
  await page.getByLabel("Quizzes this week").fill("6");
  await page.getByRole("button", { name: "Save goal" }).click();
  await expect(page.getByText("Goal saved for this week.")).toBeVisible();
  const [g] = await sql("select xp_target, quizzes_target from weekly_goals where user_id = $1", [row.user_id]) as { xp_target: number; quizzes_target: number }[];
  expect(g).toEqual({ xp_target: 400, quizzes_target: 6 });
  await page.reload();
  await expect(page.getByRole("button", { name: "Update goal" })).toBeVisible();
  await expect(page.getByText("21 / 400")).toBeVisible();
  await expect(page.getByText("1 / 6")).toBeVisible(); // the daily challenge counts as a finished quiz
  await expect(page.getByRole("list", { name: "Previous weeks" }).locator("li")).toHaveCount(7);

  // targets below 10 XP are rejected by the browser and by the server
  await page.getByLabel("XP this week").fill("5");
  await page.getByRole("button", { name: "Update goal" }).click();
  expect(await page.getByLabel("XP this week").evaluate((el) => (el as HTMLInputElement).validity.valid)).toBe(false);

  expect(problems).toEqual([]);
});
