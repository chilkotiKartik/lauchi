import { test, expect, type Page } from "@playwright/test";
import { fromTemplate } from "../src/lib/quiz-core";
import type { RawQuestion } from "../src/content/gen.generated.cjs";
import { onboard, signIn, sql, uniqueEmail, watch } from "./helpers";

type Item = { c: string; u: number; t: number; s: number };
const indiaDow = () => new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })).getDay(); // 0 = Sunday

async function choose(page: Page, q: RawQuestion) {
  if (q.type === "nat") await page.getByLabel("Your answer").fill(String(q.a));
  else if (q.type === "mcq") await page.locator(".choice").nth(q.a as number).click();
  else for (const i of q.a as number[]) await page.locator(".choice").nth(i).click();
}

test("Sunday Quest: built from this week's practice, prepared during the week, graded once on Sunday", async ({ page }) => {
  test.setTimeout(150_000);
  const problems = watch(page);
  const email = uniqueEmail();
  await signIn(page, email); await onboard(page);

  // this week the student practised Physics unit 1 and got 2 of 3 wrong (on a Sunday, record it as Saturday's work)
  const when = indiaDow() === 0 ? "now() - interval '1 day'" : "now()";
  await sql(`insert into quiz_sessions(user_id,course,unit,seed,kind,total,answers,created_at,submitted_at,correct)
    select id,'AHT-001',1,7,'practice',3,'{"0":{"ok":false},"1":{"ok":false},"2":{"ok":true}}',${when},${when},1 from auth.users where email=$1`, [email]);

  await page.goto("/sunday");
  await expect(page.getByRole("heading", { level: 1, name: "Sunday Quest" })).toBeVisible();

  if (indiaDow() !== 0) {
    await expect(page.getByRole("heading", { name: /^Opens (tomorrow|in \d days)/ })).toBeVisible();
    await expect(page.getByText("3 answered this week, 2 wrong")).toBeVisible();
    await expect(page.getByText("12 questions on Sunday")).toBeVisible(); // the only unit studied gets the whole quest
    // the dashboard card points here
    await page.goto("/home");
    await expect(page.getByRole("link", { name: "Sunday Quest" })).toContainText(/Opens/);
  } else {
    const [row] = await sql("select q.items from sunday_quests q join auth.users u on u.id = q.user_id where u.email = $1", [email]) as { items: Item[] }[];
    expect(row.items).toHaveLength(12);
    expect(row.items.every((i) => i.c === "AHT-001" && i.u === 1)).toBe(true);
    for (let i = 0; i < 12; i++) {
      const it = row.items[i];
      await expect(page.getByText(`Question ${i + 1} of 12`)).toBeVisible();
      await choose(page, fromTemplate(it.c, it.u, it.t, it.s)!);
      await page.getByRole("button", { name: "Check", exact: true }).click();
      await expect(page.getByRole("status").filter({ hasText: "Correct!" })).toBeVisible();
      await page.getByRole("button", { name: i === 11 ? "See my score" : "Next question" }).click();
    }
    await expect(page.getByRole("heading", { name: "Quest complete!" })).toBeVisible();
    await expect(page.getByText("+78 XP")).toBeVisible();
    const xp = await sql("select sum(xp)::int as n from xp_events e join auth.users u on u.id = e.user_id where u.email = $1 and e.ref like 'sunday:%'", [email]);
    expect(xp[0].n).toBe(78);
  }
  expect(problems).toEqual([]);
});
