import { test, expect, type Page } from "@playwright/test";
import { generate, sessionQuestion } from "../src/lib/quiz-core";
import { fakeYoutube, onboard, signIn, sql, uniqueEmail, watch } from "./helpers";

const ROUTES = ["/pyq", "/focus", "/home", "/learn", "/practice", "/labs", "/syllabus", "/formulas", "/mock", "/plan", "/videos", "/mistakes", "/quests", "/progress", "/settings", "/profile", "/more", "/assignments", "/papers", "/ask", "/league", "/revise", "/paper", "/friends"];

test("every section loads clean: no errors, no overflow, no serious a11y issues", async ({ page }) => {
  test.setTimeout(120_000);
  const AxeBuilder = (await import("@axe-core/playwright")).default;
  const problems = watch(page);
  await fakeYoutube(page);
  await page.emulateMedia({ reducedMotion: "reduce" }); // axe must not measure contrast mid-fade
  await signIn(page, uniqueEmail()); await onboard(page);
  for (const r of ROUTES) {
    const res = await page.goto(r);
    expect(res?.status(), r).toBe(200);
    await expect(page.locator("main h1").first()).toBeVisible();
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${r} overflow`).toBeLessThanOrEqual(0);
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes[0].html.slice(0, 100)}`), r).toEqual([]);
  }
  expect(problems).toEqual([]);
});

test("navigation reaches the new sections and the mobile More hub lists them all", async ({ page, isMobile }) => {
  await signIn(page, uniqueEmail()); await onboard(page);
  if (isMobile) {
    await page.getByRole("navigation", { name: "Main" }).last().getByRole("link", { name: "More" }).click();
    await expect(page).toHaveURL(/\/more$/);
    for (const n of ["Formula Cards", "Mock Test", "Quests", "Progress", "Settings"]) await expect(page.getByRole("link", { name: new RegExp(n) }).first()).toBeVisible();
  } else {
    const nav = page.getByRole("navigation", { name: "Main" }).first();
    for (const n of ["Dashboard", "Learn", "Practice", "3D Labs", "Quests", "Formula Cards", "Mock Test", "Progress", "Settings", "Profile"]) await expect(nav.getByRole("link", { name: new RegExp(n) })).toBeVisible();
  }
});

test("syllabus search finds topics and experiments", async ({ page }) => {
  await signIn(page, uniqueEmail()); await onboard(page);
  await page.goto("/syllabus");
  await expect(page.getByRole("link", { name: /Intro Maths|Introduction to Engineering Mathematics/ }).first()).toBeVisible();
  await page.getByRole("searchbox", { name: /Search topics/ }).fill("taylor");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page).toHaveURL(/q=taylor/);
  const hit = page.getByRole("link", { name: /Taylor's theorem for one variable/ });
  await expect(hit).toBeVisible();
  await hit.click();
  await expect(page).toHaveURL(/\/learn\/AHT-003\/1\/6$/);
  await page.goto("/syllabus?q=zzzzzz");
  await expect(page.getByText(/No topic matches/)).toBeVisible();
  await page.goto("/syllabus?q=<script>alert(1)</script>");
  await expect(page.getByRole("searchbox")).toHaveValue("<script>alert(1)</script>"); // rendered as text, never as markup
});

test("formula cards: study one card at a time, flip, mark known, see all", async ({ page }) => {
  await signIn(page, uniqueEmail()); await onboard(page);
  await page.goto("/formulas?course=AHT-003&unit=1");
  await expect(page.getByText(/^Card 1 of \d+/)).toBeVisible();
  await page.getByRole("button", { name: "Show formula" }).click();
  await expect(page.locator('.flip[data-on="true"]')).toHaveCount(1);
  await page.getByRole("button", { name: "Knew it" }).click();
  await expect(page.getByText(/^1 of \d+ known$/)).toBeVisible();
  await expect(page.getByText(/^Card 2 of \d+/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/^1 of \d+ known$/)).toBeVisible(); // remembered on this device
  await page.getByRole("tab", { name: "See all" }).click();
  await expect(page.getByText("✓ known")).toHaveCount(1);
});

test("exam date drives the countdown and a study plan that shortens with progress", async ({ page }) => {
  const email = uniqueEmail();
  await signIn(page, email); await onboard(page);
  await page.goto("/plan");
  await expect(page.getByRole("link", { name: "Set my exam date" })).toBeVisible();
  await page.goto("/settings");
  const future = new Date(Date.now() + 20 * 86_400_000).toISOString().slice(0, 10);
  const past = new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10);
  await page.getByLabel("Exam date", { exact: true }).evaluate((el) => el.removeAttribute("min")); // skip the browser check to prove the server refuses too
  await page.getByLabel("Exam date", { exact: true }).fill(past);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("alert").filter({ hasText: /in the past|Pick/ })).toBeVisible();
  await page.getByLabel("Exam date", { exact: true }).fill(future);
  await page.getByLabel("Hours you can study per day").fill("3");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeVisible();
  const [row] = await sql("select exam_date::text as d, study_hours from profiles p join auth.users u on u.id=p.id where u.email=$1", [email]);
  expect(row).toMatchObject({ d: future, study_hours: 3 });
  await page.goto("/home");
  await expect(page.getByText(/\d+ days to go/)).toBeVisible();
  await page.goto("/plan");
  await expect(page.getByRole("heading", { name: "Study plan" })).toBeVisible();
  await expect(page.getByText("days left")).toBeVisible();
  await expect(page.locator("summary").first()).toBeVisible();
  const before = await page.getByText("topics to learn").locator("xpath=preceding-sibling::b").innerText();
  // completing topics through the DB (test-only) shortens the plan: it re-spreads from what is left
  await sql("insert into topic_progress(user_id,topic_key,best_score) select id, k, 100 from auth.users, unnest(array['AHT-003:1:1','AHT-003:1:2','AHT-003:1:3','AHT-003:1:4','AHT-003:1:5','AHT-003:1:6']) k where email=$1", [email]);
  await page.reload();
  const after = await page.getByText("topics to learn").locator("xpath=preceding-sibling::b").innerText();
  expect(after).not.toBe(before);
  // clear it again
  await page.goto("/settings");
  await page.getByLabel("Exam date", { exact: true }).fill("");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status").filter({ hasText: "cleared" })).toBeVisible();
});

test("theme choice is remembered", async ({ page }) => {
  await signIn(page, uniqueEmail()); await onboard(page);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light"); // Day is the default
  await page.goto("/settings");
  await page.getByRole("radio", { name: "Night" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("radio", { name: "Match my device" }).click();
  await expect.poll(() => page.locator("html").getAttribute("data-theme")).toBeNull();
  await page.getByRole("radio", { name: "Day" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("data export contains only my data; account deletion removes everything", async ({ page, browser }) => {
  test.setTimeout(60_000);
  const a = uniqueEmail(), b = uniqueEmail();
  const other = await (await browser.newContext()).newPage();
  await signIn(other, b); await onboard(other, "Other");
  await signIn(page, a); await onboard(page, "Alice");
  await sql("insert into xp_events(user_id,kind,ref,xp) select id,'quiz_completed','e2e-export',7 from auth.users where email=$1", [a]);
  const res = await page.request.get("/settings/export");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-disposition"]).toContain("lockin-data-");
  expect(res.headers()["cache-control"]).toContain("no-store");
  const json = await res.json();
  expect(json.account.email).toBe(a);
  expect(json.profile).toHaveLength(1);
  expect(json.profile[0].name).toBe("Alice");
  expect(json.xpEvents.map((e: { ref: string }) => e.ref)).toContain("e2e-export");
  expect(JSON.stringify(json)).not.toContain(b);
  expect(JSON.stringify(json)).not.toContain('"seed"');
  expect((await (await fetch("http://localhost:3100/settings/export", { redirect: "manual" })).status)).toBe(307); // signed out → login

  await page.goto("/settings");
  await page.getByLabel(/Type DELETE/).fill("delete");
  await page.getByRole("button", { name: "Delete my account" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "DELETE in capital" })).toBeVisible();
  expect((await sql("select 1 from auth.users where email=$1", [a])).length).toBe(1);
  await page.getByLabel(/Type DELETE/).fill("DELETE");
  await page.getByRole("button", { name: "Delete my account" }).click();
  await expect(page).toHaveURL(/localhost:3100\/$/);
  expect((await sql("select 1 from auth.users where email=$1", [a])).length).toBe(0);
  expect((await sql("select 1 from xp_events where ref='e2e-export'")).length).toBe(0);
  expect((await sql("select 1 from auth.users where email=$1", [b])).length).toBe(1); // nobody else touched
  await page.goto("/home");
  await expect(page).toHaveURL(/\/login/);
});

async function answerMock(page: Page, s: { kind: string; course: string; unit: number; seed: number }, i: number) {
  const q = sessionQuestion(s, i)!;
  if (q.type === "nat") await page.getByLabel("Your answer").fill(String(q.a));
  else if (q.type === "mcq") await page.locator(".choice").nth(q.a as number).click();
  else for (const k of q.a as number[]) await page.locator(".choice").nth(k).click();
  await page.getByRole("button", { name: "Save answer" }).click();
}

test("mock test: timer, palette, no verdicts, submit, review, mistakes, XP once", async ({ page, browser }) => {
  test.setTimeout(120_000);
  const email = uniqueEmail();
  await signIn(page, email); await onboard(page);
  await page.goto("/mock");
  await page.getByRole("listitem").filter({ hasText: "AHT-003" }).getByRole("button", { name: "Start mock test" }).click();
  await expect(page).toHaveURL(/\/quiz\/[0-9a-f-]{36}$/);
  const id = new URL(page.url()).pathname.split("/").pop()!;
  const [row] = await sql("select course, unit, seed, kind, total from quiz_sessions where id=$1", [id]);
  const s = row as { kind: string; course: string; unit: number; seed: number; total: number };
  expect(s).toMatchObject({ kind: "mock", total: 20 });

  await expect(page.getByRole("timer")).toBeVisible();
  await expect(page.getByRole("group", { name: "Question palette" }).getByRole("button")).toHaveCount(20);
  // the page must not leak answers or explanations
  const html = await (await page.request.get(`/quiz/${id}`)).text();
  expect(html).not.toContain(String(s.seed));
  expect(html).not.toContain(sessionQuestion(s, 0)!.why.slice(0, 40));

  await answerMock(page, s, 0);
  await expect(page.getByText("Correct!")).toHaveCount(0); // no verdict during the exam
  await expect(page.getByRole("button", { name: /Question 1, answered/ })).toBeDisabled();
  await answerMock(page, s, 1);
  // jump ahead with the palette
  await page.getByRole("button", { name: /Question 10, not answered/ }).click();
  await expect(page.getByText("Question 10 of 20")).toBeVisible();

  // submitting instantly is refused (anti-farming), then allowed once enough time has passed
  await page.getByRole("button", { name: "Submit test" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "That was quick" })).toBeVisible();
  await sql("update quiz_sessions set created_at = now() - interval '5 minutes' where id=$1", [id]);
  await page.getByRole("button", { name: "Submit test" }).click();
  await expect(page.getByRole("heading", { name: /Nice work|Keep practising/ })).toBeVisible({ timeout: 15_000 });
  const [{ n_ok }] = await sql("select correct as n_ok from quiz_sessions where id=$1", [id]) as { n_ok: number }[];
  expect(n_ok).toBe(2); // only the two answered questions were right; the 18 blanks count as wrong
  const [xp] = await sql("select xp, kind from xp_events e join auth.users u on u.id=e.user_id where u.email=$1 and ref=$2", [email, id]);
  expect(xp).toMatchObject({ xp: 6, kind: "mock_completed" });

  await page.getByRole("link", { name: "Review every answer" }).click();
  await expect(page.getByRole("heading", { name: "Your answers" })).toBeVisible();
  await expect(page.getByText("No answer").first()).toBeVisible();
  await expect(page.locator("ol.gap-4 > li")).toHaveCount(20);

  await page.goto("/mistakes");
  await expect(page.locator("ol > li").first()).toBeVisible();
  await page.goto("/mock");
  await expect(page.getByRole("link", { name: /2 \/ 20/ })).toBeVisible();

  // another student cannot read this session's review
  const ctx = await browser.newContext(); const p2 = await ctx.newPage();
  await signIn(p2, uniqueEmail()); await onboard(p2, "Mallory");
  expect((await p2.goto(`/quiz/${id}/review`))?.status()).toBe(404);
  await p2.goto("/mistakes");
  await expect(p2.getByText("Nothing to fix yet.")).toBeVisible();
  await ctx.close();

  await page.goto("/progress");
  await expect(page.getByText("Exam ready")).toBeVisible();
  await expect(page.getByText("First steps")).toBeVisible();
  void generate;
});

test("a mock can only be submitted early by its owner, and only if it is a mock", async ({ page }) => {
  await signIn(page, uniqueEmail()); await onboard(page);
  await page.goto("/practice/AHT-003");
  await page.getByRole("button", { name: /^Practise unit 1\b/ }).first().click();
  await expect(page).toHaveURL(/\/quiz\/[0-9a-f-]{36}$/);
  // a practice quiz has no "Submit test" shortcut
  await expect(page.getByRole("button", { name: "Submit test" })).toHaveCount(0);
});

test("quests and progress reflect real activity", async ({ page }) => {
  const email = uniqueEmail();
  await signIn(page, email); await onboard(page);
  await page.goto("/quests");
  await expect(page.getByRole("heading", { level: 1, name: "Quests" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Daily challenge/ })).toContainText("5 questions waiting");
  await expect(page.getByRole("link", { name: /Sunday Quest/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Revise today/ })).toContainText("All caught up");
  await sql("insert into xp_events(user_id,kind,ref,xp) select id,'quiz_completed','q-1',60 from auth.users where email=$1", [email]);
  await page.goto("/progress");
  await expect(page.getByText("XP, last 30 days")).toBeVisible();
  await expect(page.getByText("Warm-up")).toBeVisible();
});

test("topic and lab pages keep working with the new shell", async ({ page }) => {
  const problems = watch(page);
  await fakeYoutube(page);
  await signIn(page, uniqueEmail()); await onboard(page);
  await page.goto("/videos?course=AHT-003");
  await page.getByRole("link", { name: /Calculus I/ }).first().click();
  await expect(page).toHaveURL(/unit=1/);
  await expect(page.locator("iframe")).toHaveAttribute("src", /youtube-nocookie\.com\/embed\/aaaaaaaaaa1/);
  await page.getByRole("link", { name: "Need a boost?" }).click();
  await expect(page.getByRole("heading", { name: "When you need a push" })).toBeVisible();
  expect(problems).toEqual([]);
});
