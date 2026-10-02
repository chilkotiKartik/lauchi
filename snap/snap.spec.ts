import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import { generate, sessionQuestion } from "../src/lib/quiz-core";
import { sql, signIn, uniqueEmail, addXp } from "../e2e/helpers";

const OUT = "/home/claude/shots";
test("snapshots", async ({ page }, info) => {
  let idx = 0; const log: string[] = [];
  test.setTimeout(900_000);
  const dir = `${OUT}/${info.project.name}`; fs.mkdirSync(dir, { recursive: true });
  const shot = async (name: string, full = true) => {
    await page.waitForTimeout(700);
    const f = `${dir}/${String(++idx).padStart(3, "0")}-${name}.png`;
    try { await page.screenshot({ path: f, fullPage: full, timeout: 30000 }); log.push(`${f} ${page.url()}`); } catch (e) { log.push(`FAIL shot ${name}: ${e}`); }
  };
  const step = async (name: string, fn: () => Promise<void>) => { try { await fn(); } catch (e) { log.push(`FAIL ${name}: ${String(e).slice(0, 300)}`); await shot(`ERR-${name}`); } };
  const go = async (path: string, name: string, full = true) => step(name, async () => { await page.goto(path, { waitUntil: "networkidle" }); await shot(name, full); });

  // ---- public ----
  await go("/", "landing");
  await step("cookie", async () => { await page.getByRole("button", { name: /got it/i }).click({ timeout: 3000 }); });
  await go("/about", "about"); await go("/privacy", "privacy"); await go("/terms", "terms"); await go("/cookies", "cookies"); await go("/security", "security");
  await go("/login", "login");
  const email = uniqueEmail();
  await step("login-inbox", async () => {
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: /email me a sign-in link/i }).click();
    await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
    await shot("login-check-inbox");
    const { link } = await (await fetch(`http://localhost:54321/__mail?email=${encodeURIComponent(email)}`)).json();
    await page.goto(link);
  });

  // ---- onboarding ----
  await step("onboarding", async () => {
    await expect(page).toHaveURL(/\/welcome$/);
    await shot("welcome-1-name");
    await page.getByLabel("Your name").fill("Kalu Don");
    await page.getByLabel(/I am 18 or older/).check();
    await page.getByRole("button", { name: "Continue" }).click();
    await shot("welcome-2-branch");
    await page.getByRole("button", { name: /Computer Science & Engineering/ }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await shot("welcome-3-semester");
    await page.getByRole("button", { name: /Semester I ·/ }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await shot("welcome-4-status");
    await page.getByRole("button", { name: /Regular/ }).click();
    await page.getByRole("button", { name: "Finish" }).click();
    await expect(page.getByText(`Welcome, Kalu`)).toBeVisible();
    await shot("welcome-5-done");
    await page.getByRole("button", { name: "Let's go" }).click();
    await expect(page).toHaveURL(/\/home$/);
  });
  await go("/home", "home-empty-new-user");

  // ---- seed some history so dashboards have real data ----
  await step("seed", async () => { for (const d of [1, 2, 3, 4, 6, 7, 9, 12, 15, 20]) await addXp(email, 20 + d * 3, d); });

  // ---- learn ----
  await go("/learn", "learn-all-courses");
  await go("/learn/AHT-003", "learn-course-intro-maths");
  await go("/learn/AHT-003/1", "learn-unit-calculus");
  await go("/learn/AHT-003/1/1", "learn-topic-lesson-limit");
  await step("selfcheck", async () => { const item = page.getByRole("radiogroup", { name: "Question 1" }); await item.getByRole("radio").nth(0).click(); await shot("learn-topic-selfcheck-answered"); });
  await go("/learn/AHT-001/1/1", "learn-topic-no-lesson-yet");
  await go("/learn/AHP-001/lab/1", "learn-practical-lab-viva");

  // ---- topic quiz ----
  await step("quiz", async () => {
    await page.goto("/learn/AHT-003/1/1");
    await page.getByRole("button", { name: /Take the (topic )?quiz/i }).click();
    await expect(page).toHaveURL(/\/quiz\/[0-9a-f-]{36}$/);
    const id = new URL(page.url()).pathname.split("/").pop()!;
    const [s] = await sql("select course, unit, seed from quiz_sessions where id=$1", [id]) as { course: string; unit: number; seed: number }[];
    await shot("quiz-question");
    for (let i = 0; i < 5; i++) {
      const right = i !== 1 && i !== 3; const q = generate(s.course, s.unit, s.seed, i)!;
      if (q.type === "nat") await page.getByLabel("Your answer").fill(right ? String(q.a) : String((q.a as number) + 1000));
      else if (q.type === "mcq") await page.locator(".choice").nth(right ? (q.a as number) : ((q.a as number) + 1) % q.o!.length).click();
      else { const set = q.a as number[]; const wrong = q.o!.map((_, k) => k).filter((k) => !set.includes(k))[0]; for (const k of right ? set : [wrong]) await page.locator(".choice").nth(k).click(); }
      if (i === 0) await shot("quiz-answer-selected");
      await page.getByRole("button", { name: "Check" }).click();
      if (i === 0) await shot("quiz-feedback-correct");
      if (i === 1) await shot("quiz-feedback-wrong");
      await page.getByRole("button", { name: i < 4 ? "Continue" : "Finish" }).click();
    }
    const err = page.locator(".err"); const result = page.locator("main h1").filter({ hasText: /Nice work!|Keep practising/ });
    await expect(err.or(result)).toBeVisible({ timeout: 15000 });
    if (await err.isVisible()) { await shot("quiz-too-fast-guard"); await sql("update quiz_sessions set created_at = now() - interval '5 minutes' where id=$1", [id]); await page.getByRole("button", { name: "Try again" }).click(); }
    await expect(result).toBeVisible();
    await shot("quiz-result");
    await page.goto(`/quiz/${id}/review`); await shot("quiz-review");
  });

  // ---- practice ----
  await go("/practice", "practice");
  await go("/practice/AHT-003", "practice-course");

  // ---- mock test ----
  await go("/mock", "mock-list");
  await step("mock", async () => {
    await page.getByRole("listitem").filter({ hasText: "AHT-003" }).getByRole("button", { name: "Start mock test" }).click();
    await expect(page).toHaveURL(/\/quiz\/[0-9a-f-]{36}$/);
    const id = new URL(page.url()).pathname.split("/").pop()!;
    const [s] = await sql("select course, unit, seed, kind from quiz_sessions where id=$1", [id]) as { kind: string; course: string; unit: number; seed: number }[];
    await shot("mock-in-progress");
    for (let i = 0; i < 12; i++) {
      const q = sessionQuestion(s, i)!; const right = i % 3 !== 2;
      if (q.type === "nat") await page.getByLabel("Your answer").fill(String(right ? q.a : (q.a as number) + 7));
      else if (q.type === "mcq") await page.locator(".choice").nth(right ? (q.a as number) : ((q.a as number) + 1) % q.o!.length).click();
      else for (const k of q.a as number[]) await page.locator(".choice").nth(k).click();
      await page.getByRole("button", { name: "Save answer" }).click();
    }
    await shot("mock-palette-partly-answered");
    await sql("update quiz_sessions set created_at = now() - interval '20 minutes' where id=$1", [id]);
    await page.getByRole("button", { name: "Submit test" }).click();
    await expect(page.getByRole("heading", { name: /Nice work|Keep practising/ })).toBeVisible({ timeout: 15000 });
    await shot("mock-result");
    await page.getByRole("link", { name: "Review every answer" }).click();
    await shot("mock-review");
  });

  // ---- assignment ----
  await step("assignment", async () => {
    await page.goto("/assignments"); await shot("assignments");
    const card = page.locator("details").filter({ hasText: "Engineering Physics" });
    if (!(await card.evaluate((el) => (el as HTMLDetailsElement).open))) await card.locator("summary").click();
    await shot("assignments-card-open");
    await card.getByRole("button", { name: "Start" }).first().click();
    await expect(page).toHaveURL(/\/quiz\//);
    await shot("assignment-question");
  });

  // ---- other sections ----
  await go("/syllabus", "syllabus");
  await go("/syllabus?q=taylor", "syllabus-search-taylor");
  await go("/formulas", "formulas");
  await step("formula-flip", async () => { await page.goto("/formulas?course=AHT-003&unit=1", { waitUntil: "networkidle" }); await shot("formulas-unit"); await page.getByRole("button", { name: /Card 1:/ }).click(); await shot("formulas-card-flipped"); });
  await go("/plan", "plan-no-exam-date");
  await step("settings-exam", async () => {
    await page.goto("/settings", { waitUntil: "networkidle" }); await shot("settings");
    const d = new Date(Date.now() + 40 * 864e5).toISOString().slice(0, 10);
    const date = page.getByLabel(/exam/i).first(); await date.fill(d);
    await page.getByRole("button", { name: "Save" }).first().click(); await page.waitForTimeout(1200); await shot("settings-exam-date-saved");
  });
  await go("/plan", "plan-with-exam-date");
  await go("/videos", "videos");
  await go("/mistakes", "mistakes");
  await go("/quests", "quests");
  await go("/progress", "progress");
  await go("/profile", "profile");
  await go("/more", "more-hub");
  await go("/papers", "papers");
  await go("/marks", "marks");
  await step("marks-interact", async () => { await page.getByRole("button", { name: "Physics", exact: true }).click(); await page.getByRole("button", { name: "O", exact: true }).first().click(); await shot("marks-physics-O-target"); });
  await go("/ask", "ask-lochi");
  await go("/league", "league");
  await step("league-join", async () => { await page.getByRole("button", { name: "Join the league" }).click(); await page.waitForTimeout(1000); await shot("league-joined"); });
  await go("/home", "home-with-activity");

  // ---- labs ----
  await go("/labs", "labs-list");
  for (const l of ["surface", "rlc", "projectile", "orbitals", "pendulum", "sorting", "boxmodel", "isometric", "gitgraph", "dna"]) {
    await step(`lab-${l}`, async () => { await page.goto(`/labs/${l}`, { waitUntil: "networkidle" }); await page.waitForTimeout(3500); await shot(`lab-${l}`); });
  }

  // ---- dark theme ----
  await step("dark", async () => {
    await page.goto("/settings"); await page.getByRole("radio", { name: "Night" }).click(); await page.waitForTimeout(800);
    for (const [p, n] of [["/home", "dark-home"], ["/learn/AHT-003/1/1", "dark-lesson"], ["/progress", "dark-progress"], ["/labs/surface", "dark-lab-surface"]]) { await page.goto(p, { waitUntil: "networkidle" }); if (p.startsWith("/labs")) await page.waitForTimeout(3000); await shot(n); }
    await page.goto("/settings"); await page.getByRole("radio", { name: "Day" }).click();
  });
  await go("/learn/NOPE-000", "not-found-404");

  fs.writeFileSync(`${dir}/_log.txt`, log.join("\n"));
});
