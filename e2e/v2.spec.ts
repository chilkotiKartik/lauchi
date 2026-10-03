import { test, expect, type Page } from "@playwright/test";
import { generate } from "../src/lib/quiz-core";
import { MOCK, addXp, fakeYoutube, onboard, signIn, sql, uniqueEmail, watch } from "./helpers";

async function ready(page: Page, semester: 1 | 2 = 1) {
  const email = uniqueEmail();
  await fakeYoutube(page);
  await signIn(page, email);
  await onboard(page, "Kalu", semester);
  return email;
}

test("PYQ bank: subjects, units, filters, practised ticks and Ask Lochi links", async ({ page }) => {
  const problems = watch(page);
  await ready(page, 2);
  await page.goto("/pyq");
  await expect(page.getByRole("heading", { level: 1, name: "PYQ bank" })).toBeVisible();
  // a CSE semester-2 student starts on their first semester-2 subject with PYQs (Chemistry); Physics is semester 1
  await expect(page.getByRole("heading", { name: "Chemistry: most repeated questions" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Physics/ })).toHaveCount(0);
  await page.getByRole("link", { name: /Mechanical/ }).click();
  await expect(page).toHaveURL(/course=MET-001/);
  await page.getByRole("link", { name: /U4.*Thermodynamics/ }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Thermodynamics" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Predicted must-do" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Open: Piston–cylinder boundary work/ })).toBeVisible();
  // filters
  const cards = page.locator("li.pyq-card");
  const all = await cards.count();
  await page.getByRole("button", { name: "Numericals" }).click();
  await expect.poll(() => cards.count()).toBeLessThan(all);
  await expect(cards.first()).toHaveAttribute("data-kind", "numerical");
  await page.getByRole("button", { name: "All", exact: true }).click();
  // practised tick survives a reload (stored on the device)
  await cards.first().getByRole("button", { name: "Mark practised" }).click();
  await expect(page.getByText(/^1 of \d+ question sets practised$/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/^1 of \d+ question sets practised$/)).toBeVisible();
  const ask = cards.first().getByRole("link", { name: /Ask Lochi/ });
  await expect(ask).toHaveAttribute("href", /^\/ask\?course=MET-001&unit=4&pyq=[^&]+&q=Explain/);
  await page.getByRole("searchbox", { name: /Search this unit/ }).fill("Carnot");
  await expect(cards.first()).toContainText(/Carnot/);
  expect(problems).toEqual([]);
});

test("a wrong answer shows the coach: lecture in place, re-read, 3D lab, PYQs and Ask Lochi", async ({ page }) => {
  const problems = watch(page);
  await ready(page);
  await page.goto("/learn/AHT-003/1/1");
  await page.getByRole("button", { name: /Take the (topic )?quiz/i }).click();
  await expect(page).toHaveURL(/\/quiz\/[0-9a-f-]{36}$/);
  const id = new URL(page.url()).pathname.split("/").pop()!;
  const [s] = await sql("select course, unit, seed from quiz_sessions where id=$1", [id]) as { course: string; unit: number; seed: number }[];
  const q = generate(s.course, s.unit, s.seed, 0)!;
  if (q.type === "nat") await page.getByLabel("Your answer").fill(String((q.a as number) + 1000));
  else if (q.type === "mcq") await page.locator(".choice").nth(((q.a as number) + 1) % q.o!.length).click();
  else { const set = q.a as number[]; await page.locator(".choice").nth(q.o!.map((_, i) => i).filter((i) => !set.includes(i))[0]).click(); }
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByText("Not quite")).toBeVisible();
  const coach = page.getByLabel("Fix it now");
  await expect(coach.getByRole("link", { name: "Re-read Unit 1" })).toHaveAttribute("href", "/learn/AHT-003/1");
  await expect(coach.getByRole("link", { name: /Ask Lochi why/ })).toHaveAttribute("href", /^\/ask\?course=AHT-003&unit=1&mistake=[^&]+&q=I%20got%20this/);
  await expect(coach.getByRole("link", { name: /See it in 3D/ })).toBeVisible();
  await coach.getByRole("button", { name: /Watch an explainer/ }).click();
  const dlg = page.getByRole("dialog");
  await expect(dlg.locator("iframe")).toHaveAttribute("src", /youtube-nocookie\.com\/embed\/aaaaaaaaaa1/);
  await dlg.getByRole("button", { name: /lecture 3/ }).click();
  await expect(dlg.locator("iframe")).toHaveAttribute("src", /cccccccccc3\?.*autoplay=1/);
  await dlg.getByRole("button", { name: "Close videos" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();
  expect(problems).toEqual([]);
});

test("video search results are cached on the server", async ({ page }) => {
  await ready(page);
  const before = (await (await fetch(`${MOCK}/__yt`)).json()).calls as number;
  const q = `cache check ${Date.now()}`;
  const a = await page.request.get(`/api/videos?q=${encodeURIComponent(q)}`);
  expect(a.status()).toBe(200);
  const body = await a.json();
  expect(body.videos[0]).toMatchObject({ id: "aaaaaaaaaa1", channel: "Teacher 1" });
  expect(body.videos[0].title).toContain("& lecture 1"); // HTML entities decoded, plain text only
  await page.request.get(`/api/videos?q=${encodeURIComponent(q.toUpperCase())}`);
  const after = (await (await fetch(`${MOCK}/__yt`)).json()).calls as number;
  expect(after - before).toBe(1);
  expect((await page.request.get("/api/videos?q=a")).status()).toBe(400);
});

test("focus timer counts down, pauses and keeps the tab title in sync", async ({ page }) => {
  const problems = watch(page);
  await ready(page);
  await page.goto("/focus");
  const timer = page.getByRole("timer", { name: "Time left" });
  await expect(timer).toHaveText("25:00");
  await page.getByRole("radio", { name: "Short break" }).click();
  await expect(timer).toHaveText("05:00");
  await page.getByRole("button", { name: "Start" }).click();
  await expect(timer).not.toHaveText("05:00", { timeout: 5000 });
  await expect(page).toHaveTitle(/04:5\d break · lockin\./);
  await page.getByRole("button", { name: "Pause" }).click();
  const paused = await timer.textContent();
  await page.waitForTimeout(1300);
  await expect(timer).toHaveText(paused!);
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(timer).toHaveText("05:00");
  expect(problems).toEqual([]);
});

test("voice and motion settings persist on the device", async ({ page }) => {
  const problems = watch(page);
  await ready(page);
  await page.goto("/settings");
  const calm = page.getByRole("switch", { name: /Calm mode/ });
  await calm.check();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "calm");
  await page.getByRole("switch", { name: /Lochi talks/ }).check();
  await page.reload();
  await expect(page.getByRole("switch", { name: /Calm mode/ })).toBeChecked();
  await expect(page.getByRole("switch", { name: /Lochi talks/ })).toBeChecked();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "calm");
  expect(problems).toEqual([]);
});

test("reaching a new level shows a celebration that does not block the page", async ({ page }) => {
  const email = await ready(page);
  await page.goto("/home");
  await addXp(email, 120, 0);
  await page.goto("/quests");
  await expect(page.getByRole("heading", { name: "Level 2!" })).toBeVisible();
  await page.getByRole("button", { name: "Keep going" }).click();
  await expect(page.getByRole("heading", { name: "Level 2!" })).toHaveCount(0);
  await page.goto("/home");
  await page.waitForTimeout(800);
  await expect(page.getByRole("heading", { name: "Level 2!" })).toHaveCount(0); // only once
});

test("dashboard shows today's boost and Ask Lochi accepts a prefilled question", async ({ page }) => {
  const problems = watch(page);
  await ready(page);
  await page.goto("/home");
  await expect(page.getByRole("heading", { name: "Today's boost" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Start a 25-min focus/ })).toHaveAttribute("href", "/focus");
  await page.goto("/ask?q=Explain%20Thevenin");
  // without a Gemini key the page explains instead of showing the box
  await expect(page.getByText(/isn.t switched on/)).toBeVisible();
  expect(problems).toEqual([]);
});

test("the new 3D labs are listed under their subjects, and follow the student's semester", async ({ page }) => {
  const email = await ready(page, 2);
  const shows = async (titles: string[], visible: boolean) => {
    for (const t of titles) {
      const link = page.getByRole("link", { name: new RegExp(t.slice(0, 14).replace(/[()+]/g, ".")) });
      if (visible) await expect(link.first(), t).toBeVisible(); else await expect(link, t).toHaveCount(0);
    }
  };
  const sem2 = ["Truss forces by the method of joints", "Karnaugh map minimiser", "¹H NMR spectrometer"]; // Mechanical, Electronics, Chemistry
  const sem1 = ["Two-wattmeter method (3-phase)", "He–Ne laser: pumping, gain & threshold"]; // Electrical, Physics
  await page.goto("/labs");
  await shows(sem2, true); await shows(sem1, false);
  await sql("update profiles set semester = 1 where id = (select id from auth.users where email = $1)", [email]);
  await page.goto("/labs");
  await shows(sem1, true); await shows(sem2, false);
});
