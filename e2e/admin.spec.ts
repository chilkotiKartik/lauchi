import { test, expect } from "@playwright/test";
import { fakeYoutube, onboard, signIn, sql, uniqueEmail, watch } from "./helpers";

test("admin panel: 404 for students, then custom PYQ, pinned video, report inbox and analytics for an admin", async ({ page, browser }, info) => {
  test.setTimeout(90_000);
  await fakeYoutube(page);
  const tag = Date.now().toString(36); // the database outlives a run (mobile, then desktop), so titles must be unique
  const pyqTitle = `E2E Gauss law on a sphere ${tag}`;
  const videoTitle = `E2E pinned lecture ${tag}`;
  const reportText = `E2E the answer key looks wrong ${tag}`;
  const adminEmail = uniqueEmail();
  await signIn(page, adminEmail);
  await onboard(page, "Teacher");

  // a normal student cannot see the admin panel, and the API never reveals it exists
  const denied = await page.goto("/admin");
  expect(denied?.status()).toBe(404);
  expect((await page.goto("/admin/reports"))?.status()).toBe(404);

  // make them an admin with SQL, exactly as the site owner would
  await sql("insert into admins(user_id) select id from auth.users where email=$1", [adminEmail]);

  const problems = watch(page);
  const ok = await page.goto("/admin");
  expect(ok?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Admin" })).toBeVisible();

  // custom PYQ
  await page.goto("/admin/pyqs");
  await expect(page.getByRole("heading", { level: 1, name: "Custom PYQs" })).toBeVisible();
  await page.getByRole("button", { name: "Add question" }).click();
  await expect(page.getByText("Give the question a short title")).toBeVisible(); // zod error is shown
  await page.getByLabel("Title", { exact: true }).fill(pyqTitle);
  await page.getByLabel("Part 1 question").fill("State Gauss's law and find the field of a charged sphere.");
  await page.getByLabel("Part 1 marks").fill("5");
  await page.getByRole("button", { name: "Add question" }).click();
  await expect(page.getByText(/Question added/)).toBeVisible();
  await expect(page.getByRole("list", { name: "Custom questions" }).getByText(pyqTitle)).toBeVisible();
  const [row] = await sql("select id, title, hidden from custom_pyqs where title=$1", [pyqTitle]);
  expect(row.hidden).toBe(false);

  // pinned video
  await page.goto("/admin/videos");
  await page.getByLabel("YouTube link or video id").fill("aaaaaaaaaa1");
  await page.getByLabel("Video title").fill(videoTitle);
  await page.getByRole("button", { name: "Pin video" }).click();
  await expect(page.getByText(/Video pinned/)).toBeVisible();
  await expect(page.getByRole("list", { name: /^Pinned for / }).getByText(videoTitle)).toBeVisible();
  const pinned = await sql("select video_id from pinned_videos where title=$1", [videoTitle]);
  expect(pinned[0].video_id).toBe("aaaaaaaaaa1");
  // an invalid link is refused with a readable error
  await page.getByLabel("YouTube link or video id").fill("not a video");
  await page.getByLabel("Video title").fill("Bad one");
  await page.getByRole("button", { name: "Pin video" }).click();
  await expect(page.getByText("That isn't a YouTube link or 11-character video id")).toBeVisible();

  // a different student files a report
  const ctx = await browser.newContext({ ...info.project.use, baseURL: info.project.use.baseURL ?? "http://localhost:3100" });
  const student = await ctx.newPage();
  await signIn(student, uniqueEmail());
  await onboard(student, "Student");
  expect((await student.goto("/admin"))?.status()).toBe(404);
  const bad = await ctx.request.post("/api/report", { data: { where: "quiz", ref: "AHT-001:1:t1:s1", text: "x".repeat(501) } });
  expect(bad.status()).toBe(400);
  const sent = await ctx.request.post("/api/report", { data: { where: "quiz", ref: "AHT-001:1:t1:s77", course: "AHT-001", unit: 1, text: reportText } });
  expect(sent.ok()).toBe(true);
  await ctx.close();
  expect((await fetch("http://localhost:3100/api/report", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" })).status).toBe(401);

  // the admin sees it in the inbox and can mark it fixed
  await page.goto("/admin/reports");
  const card = page.getByRole("listitem").filter({ hasText: reportText });
  await expect(card).toBeVisible();
  await expect(card.getByText("AHT-001:1:t1:s77")).toBeVisible();
  await card.getByLabel("Status").selectOption("fixed");
  await card.getByLabel("Fix note").fill("Fixed template in gen_a.js");
  await card.getByRole("button", { name: "Save" }).click();
  // a fixed report leaves the Open list and shows up under Fixed
  await expect(card).toHaveCount(0);
  await page.getByRole("link", { name: "Fixed" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: reportText }).getByLabel("Fix note")).toHaveValue("Fixed template in gen_a.js");
  const [rep] = await sql("select status, fix_note from question_reports where text=$1", [reportText]);
  expect(rep).toMatchObject({ status: "fixed", fix_note: "Fixed template in gen_a.js" });

  // analytics renders (small groups stay hidden)
  await page.goto("/admin/analytics");
  await expect(page.getByRole("heading", { level: 1, name: "Analytics" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Weakest units first" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Active students per day" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Most reported questions" })).toBeVisible();
  await page.getByRole("link", { name: "Last 30 days" }).click();
  await expect(page).toHaveURL(/days=30/);
  await expect(page.getByRole("heading", { name: "Weakest units first" })).toBeVisible();

  // no horizontal overflow on any admin page
  for (const p of ["/admin", "/admin/pyqs", "/admin/videos", "/admin/reports", "/admin/analytics"]) {
    await page.goto(p);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  expect(problems.filter((p) => !p.includes("http 404"))).toEqual([]);
});
