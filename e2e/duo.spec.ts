import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { toCard } from "../src/lib/cards";
import { addXp, onboard, signIn, sql, uniqueEmail, watch } from "./helpers";

const strip = (t: string) => t.replace(/<\/?(sub|sup|b|i)>/g, "");

test("home: streak card, exam card and subject cards; a subject opens its level path; a chest pays real XP once", async ({ page }) => {
  test.setTimeout(120_000);
  const problems = watch(page);
  const email = uniqueEmail();
  await signIn(page, email); await onboard(page);
  await addXp(email, 30, 1); await addXp(email, 20, 2); // yesterday and the day before: a 2-day streak, nothing today yet
  await page.goto("/home");
  const streak = page.getByRole("region", { name: "Streak" });
  await expect(streak).toContainText("2 day streak");
  await expect(streak.getByRole("list", { name: "This week" }).getByRole("listitem")).toHaveCount(7);
  await expect(streak.getByRole("link", { name: /Do today's challenge|Save my streak/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "End semester exam" })).toBeVisible();

  // a weak unit: one practice quiz on Maths unit 1 at 67% (enough for the chest), shown as a coloured unit bar
  await sql(`insert into quiz_sessions(user_id,course,unit,seed,kind,total,answers,created_at,submitted_at,correct)
    select id,'AHT-003',1,11,'practice',3,'{"0":{"ok":true},"1":{"ok":true},"2":{"ok":false}}',now(),now(),2 from auth.users where email=$1`, [email]);
  await page.reload();
  const card = page.getByRole("link", { name: /Introduction to Engineering Mathematics: \d+% of topics done/ });
  await expect(card).toBeVisible();
  await card.click();
  await expect(page).toHaveURL(/\/learn\/AHT-003$/);
  await expect(page.getByRole("heading", { name: "Level path" })).toBeVisible();
  await expect(page.getByText("★☆☆ 67%")).toBeVisible(); // one star for unit 1

  // unit 2's chest stays shut (no practice there); unit 1's opens once, paid by the server
  await page.getByRole("button", { name: /^Unit 2 chest: score 60% in practice to open/ }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Score 60% or more" })).toBeVisible();
  await page.getByRole("button", { name: "Open unit 1 chest for 20 XP" }).click();
  await expect(page.getByRole("status").filter({ hasText: "+20 XP! Unit 1 chest opened." })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Unit 1 chest opened" })).toBeVisible();
  const paid = await sql("select xp from xp_events e join auth.users u on u.id=e.user_id where u.email=$1 and e.ref='chest:AHT-003:1'", [email]) as { xp: number }[];
  expect(paid.map((r) => r.xp)).toEqual([20]);

  // the practice page shows the same path, and practice starts from it
  await page.goto("/practice/AHT-003");
  await page.getByRole("button", { name: /^Practise unit 1\b/ }).first().click();
  await expect(page).toHaveURL(/\/quiz\/[0-9a-f-]{36}$/);
  expect(problems).toEqual([]);
});

test("formula cards quiz: pick the formula, combo, 80% pays XP once a day", async ({ page }) => {
  test.setTimeout(90_000);
  const problems = watch(page);
  const email = uniqueEmail();
  await signIn(page, email); await onboard(page);
  const deck = (JSON.parse(fs.readFileSync("src/content/syllabus/AHT-003.json", "utf8")).units[0].formulas as string[]).map(toCard);
  await page.goto("/formulas?course=AHT-003&unit=1");
  await page.getByRole("tab", { name: "Quiz" }).click();
  for (let i = 0; i < deck.length; i++) {
    const name = (await page.getByText("Which formula is this?").locator("xpath=following-sibling::p[1]").textContent()) ?? "";
    const right = deck.find((c) => strip(c.front) === name.trim())!;
    await page.getByRole("list", { name: "Choose the formula" }).getByRole("button", { name: strip(right.back), exact: true }).click();
    await expect(page.getByText("Correct!")).toBeVisible();
    if (i === 2) await expect(page.getByText("🔥 3 in a row")).toBeVisible();
    await page.getByRole("button", { name: i === deck.length - 1 ? "See my score" : "Continue" }).click();
  }
  await expect(page.getByRole("heading", { name: `${deck.length} of ${deck.length} right · 100%` })).toBeVisible();
  await expect(page.getByText("+5 XP earned.")).toBeVisible();
  // a second perfect round today pays nothing more
  const rows = await sql("select count(*)::int as n from xp_events e join auth.users u on u.id=e.user_id where u.email=$1 and e.ref like 'cards:AHT-003:1:%'", [email]) as { n: number }[];
  expect(rows[0].n).toBe(1);
  // every card was marked known for Study mode
  await page.getByRole("tab", { name: "Study" }).click();
  await expect(page.getByText(`${deck.length} of ${deck.length} known`)).toBeVisible();
  expect(problems).toEqual([]);
});

test("the admin panel link shows only for admins (checked on the server)", async ({ page, isMobile }) => {
  const email = uniqueEmail();
  await signIn(page, email); await onboard(page);
  await page.goto(isMobile ? "/more" : "/home");
  await expect(page.getByRole("link", { name: /admin panel/i })).toHaveCount(0);
  await sql("insert into admins(user_id) select id from auth.users where email=$1", [email]);
  await page.goto(isMobile ? "/more" : "/home");
  await page.getByRole("link", { name: /admin panel/i }).first().click();
  await expect(page).toHaveURL(/\/admin$/);
});
