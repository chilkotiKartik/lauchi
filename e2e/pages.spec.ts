import { test, expect, request as pwRequest, type Page } from "@playwright/test";
import { generate } from "../src/lib/quiz-core";
import { addXp, onboard, signIn, sql, uniqueEmail, watch } from "./helpers";

const sessionIdFrom = (page: Page) => new URL(page.url()).pathname.split("/").pop()!;

test("new pages load, are in the menu and are error free", async ({ page }) => {
  const problems = watch(page);
  await signIn(page, uniqueEmail()); await onboard(page);
  for (const [path, h1] of [["/assignments", "Assignments"], ["/papers", "Question Papers & PYQ Bank"], ["/ask", "Ask Lochi"], ["/league", "Weekly league"]] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: h1 })).toBeVisible();
  }
  await page.goto("/papers");
  const links = page.locator("main a[target=_blank]");
  await expect(links).toHaveCount(3);
  for (const a of await links.all()) { await expect(a).toHaveAttribute("rel", /noopener/); await expect(a).toHaveAttribute("href", /^https:\/\/(online\.)?uktech\.ac\.in\//); }
  expect(problems).toEqual([]);
});

test("assignment: no verdicts, resumable, graded once, XP once, review afterwards", async ({ page }) => {
  test.setTimeout(120_000);
  const problems = watch(page);
  const email = uniqueEmail();
  await signIn(page, email); await onboard(page);
  await page.goto("/assignments");
  const card = page.locator("details").filter({ hasText: "Engineering Physics" });
  const openCard = async () => { if (!(await card.evaluate((el) => (el as HTMLDetailsElement).open))) await card.locator("summary").click(); };
  await openCard();
  await card.getByRole("button", { name: "Start" }).first().click();
  await expect(page).toHaveURL(/\/quiz\/[0-9a-f-]{36}$/);
  const id = sessionIdFrom(page);
  const [row] = await sql("select course, unit, seed, total, kind from quiz_sessions where id = $1", [id]);
  const s = row as { course: string; unit: number; seed: number; total: number; kind: string };
  expect(s.kind).toBe("assignment"); expect(s.total).toBe(10);
  await expect(page.getByText(/Assignment · Physics · Unit 1/)).toBeVisible();

  const save = async (index: number, right: boolean) => {
    const q = generate(s.course, s.unit, s.seed, index)!;
    if (q.type === "nat") await page.getByLabel("Your answer").fill(right ? String(q.a) : String((q.a as number) + 1000));
    else if (q.type === "mcq") await page.locator(".choice").nth(right ? (q.a as number) : ((q.a as number) + 1) % q.o!.length).click();
    else {
      const set = q.a as number[]; const wrong = q.o!.map((_, i) => i).filter((i) => !set.includes(i))[0];
      for (const i of right ? set : [wrong]) await page.locator(".choice").nth(i).click();
    }
    await page.getByRole("button", { name: "Save answer" }).click();
  };
  await save(0, false);
  await expect(page.getByText("Question 2 of 10")).toBeVisible();
  await expect(page.getByText("Not quite")).toHaveCount(0); // no verdict while working
  await expect(page.getByText("Correct!")).toHaveCount(0);
  await page.reload();
  await expect(page.getByText("Question 2 of 10")).toBeVisible(); // resumed
  // leave and come back through the list: the button now says Resume and reopens the same set
  await page.goto("/assignments");
  await openCard();
  await expect(card.getByText("In progress")).toBeVisible();
  await card.getByRole("button", { name: "Resume" }).first().click();
  await expect(page).toHaveURL(new RegExp(id));
  for (let i = 1; i < 10; i++) { await save(i, true); if (i < 9) await expect(page.getByText(`Question ${i + 2} of 10`)).toBeVisible(); }
  await expect(page.getByRole("heading", { name: "All answered" })).toBeVisible();
  await sql("update quiz_sessions set created_at = now() - interval '5 minutes' where id = $1", [id]);
  await page.getByRole("button", { name: "Finish quiz" }).click();
  await expect(page.getByText("You got 9 of 10 right.")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("+36 XP")).toBeVisible();
  const xp = await sql("select xp, ref from xp_events where user_id=(select id from auth.users where email=$1) and kind='assignment_completed'", [email]);
  expect(xp).toEqual([{ xp: 36, ref: `${s.course}:${s.unit}` }]);
  await page.getByRole("link", { name: "Review every answer" }).click();
  await expect(page.getByRole("heading", { name: "Your answers" })).toBeVisible();
  await page.goto("/assignments");
  await openCard();
  await expect(card.getByText("Best score 9 / 10")).toBeVisible();
  await expect(card.getByRole("button", { name: "Retake" }).first()).toBeVisible();
  expect(problems.filter((p) => !/404/.test(p))).toEqual([]);
});

test("league: opt-in only, first name and weekly XP, leave any time", async ({ page }) => {
  const problems = watch(page);
  const email = uniqueEmail();
  await signIn(page, email); await onboard(page, "Kalu Don");
  await addXp(email, 40, 0);
  await page.goto("/league");
  await expect(page.getByText("Nobody has earned XP this week yet.")).toBeVisible(); // not joined: not listed
  await page.getByRole("button", { name: "Join the league" }).click();
  const me = page.getByRole("listitem").filter({ hasText: "Kalu" });
  await expect(me).toContainText("40 XP"); await expect(me).toContainText("You");
  await expect(page.getByText("Don", { exact: true })).toHaveCount(0); // last name never shown
  await page.getByRole("button", { name: "Leave the league" }).click();
  await expect(page.getByText("Nobody has earned XP this week yet.")).toBeVisible();
  expect(problems).toEqual([]);
});

test("Ask Lochi says plainly when the AI key is missing, and the API refuses safely", async ({ page }) => {
  await signIn(page, uniqueEmail()); await onboard(page);
  await page.goto("/ask");
  await expect(page.getByText(/isn.t switched on for this site yet/)).toBeVisible();
  const r = await page.request.post("/api/ask", { data: { messages: [{ role: "user", content: "hi" }] } });
  expect(r.status()).toBe(503);
  expect((await r.json()).code).toBe("not_configured");
  const anon = await pwRequest.newContext({ baseURL: "http://localhost:3100" });
  const out = await anon.post("/api/ask", { data: {}, maxRedirects: 0 });
  expect(out.status()).toBe(307); // signed-out visitors are sent to log in
  expect(out.headers().location).toContain("/login");
});

test("a lab still explains itself when WebGL is unavailable", async ({ page }) => {
  const problems = watch(page);
  await page.addInitScript(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, t: string, ...a: unknown[]) { return /webgl/.test(t) ? null : (g as (...x: unknown[]) => unknown).call(this, t, ...a); } as typeof g; });
  await signIn(page, uniqueEmail()); await onboard(page);
  await page.goto("/labs/rlc");
  await expect(page.getByText(/can.t run WebGL/)).toBeVisible();
  await expect(page.getByRole("slider").first()).toBeVisible(); // the controls still work
  expect(problems).toEqual([]);
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  for (const path of ["/assignments", "/league", "/papers", "/ask"]) {
    test(`no horizontal overflow on ${path}`, async ({ page }) => {
      await signIn(page, uniqueEmail()); await onboard(page);
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    });
  }
});
