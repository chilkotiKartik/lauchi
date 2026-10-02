import { test, expect } from "@playwright/test";
import { onboard, signIn, sql, uniqueEmail, watch } from "./helpers";

test("doubt box: ask, AI says when it is off, admin answers and publishes, the library never shows the asker or private doubts", async ({ page, browser }, info) => {
  test.setTimeout(120_000);
  const problems = watch(page);
  const tag = `zq${Date.now().toString(36)}`;
  const title = `Why does KVL hold ${tag}`;
  const answer = `Because energy is conserved ${tag}`;
  const studentEmail = uniqueEmail();
  await signIn(page, studentEmail);
  await onboard(page, "Asker");

  await page.goto("/doubts");
  await expect(page.getByRole("heading", { level: 1, name: "Doubt box" })).toBeVisible();
  await page.getByLabel("Subject").selectOption("EET-001");
  await page.getByLabel("Title", { exact: true }).fill(title);
  await page.getByRole("textbox", { name: /^Your doubt/ }).fill(`Please explain Kirchhoff's voltage law properly ${tag}`);
  await page.getByLabel(/Make this public after answering/).check();
  await page.getByRole("button", { name: "Ask my doubt" }).click();
  await expect(page).toHaveURL(/\/doubts\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  const [row] = await sql("select d.id, d.visibility, d.published, d.status from doubts d where d.title=$1", [title]);
  expect(row.visibility).toBe("public");
  expect(row.published).toBe(false);
  expect(row.status).toBe("open");

  // no Gemini key in the test server: a clear message, never a made-up answer
  await page.getByRole("button", { name: "Ask AI for a first answer" }).click();
  await expect(page.getByRole("alert").filter({ hasText: /isn't switched on/ })).toBeVisible();
  expect((await sql("select 1 from doubt_answers where doubt_id=$1", [row.id])).length).toBe(0);

  // a private, answered doubt of the same student must never reach the library
  await sql("insert into doubts(user_id,course,title,body,status) select id,'EET-001',$2,'private body text here','answered' from auth.users where email=$1", [studentEmail, `${title} PRIVATE`]);

  // not published yet: the library does not list it
  await page.goto(`/doubts?q=${tag}`);
  await expect(page.getByText(/No published doubts match/)).toBeVisible();

  // admin answers and publishes
  const ctx = await browser.newContext({ baseURL: info.project.use.baseURL });
  const admin = await ctx.newPage();
  const adminEmail = uniqueEmail();
  await signIn(admin, adminEmail);
  await onboard(admin, "Teacher");
  expect((await admin.goto("/admin/doubts"))?.status()).toBe(404);
  await sql("insert into admins(user_id) select id from auth.users where email=$1", [adminEmail]);
  await admin.goto("/admin/doubts");
  await expect(admin.getByRole("heading", { level: 1, name: "Doubts" })).toBeVisible();
  const card = admin.getByRole("listitem").filter({ hasText: title }).first();
  await expect(card).toBeVisible();
  await expect(card.getByRole("button", { name: "Publish to library" })).toHaveCount(0); // needs an answer first
  await card.getByLabel("Your answer").fill(answer);
  await card.getByRole("button", { name: "Send answer" }).click();
  await expect.poll(async () => Number((await sql("select count(*)::int as n from doubt_answers where doubt_id=$1", [row.id]))[0].n)).toBeGreaterThan(0);
  await admin.goto("/admin/doubts?status=answered");
  const card2 = admin.getByRole("listitem").filter({ hasText: title }).filter({ has: admin.getByRole("button", { name: "Publish to library" }) }).first();
  await card2.getByRole("button", { name: "Publish to library" }).click();
  await expect.poll(async () => (await sql("select published from doubts where id=$1", [row.id]))[0].published).toBe(true);

  // the student finds it in the library, with no trace of who asked
  await page.goto(`/doubts?q=${tag}`);
  const lib = page.getByRole("region", { name: "Shared library" }).or(page.locator("section[aria-labelledby='lib-h']"));
  await lib.getByText(title, { exact: true }).click();
  await expect(lib.getByText(answer)).toBeVisible();
  await expect(lib.getByText(`${title} PRIVATE`)).toHaveCount(0);
  const html = await page.content();
  expect(html).not.toContain(studentEmail);
  await lib.getByRole("button", { name: /This helped/ }).click();
  await expect(lib.getByRole("button", { name: /Marked helpful · 1/ })).toBeVisible();
  expect(Number((await sql("select helpful_count from doubt_answers where doubt_id=$1", [row.id]))[0].helpful_count)).toBe(1);

  // the student marks it resolved
  await page.goto(`/doubts/${row.id}`);
  await expect(page.getByText(answer)).toBeVisible();
  await page.getByRole("button", { name: "Mark as resolved" }).click();
  await expect.poll(async () => (await sql("select status from doubts where id=$1", [row.id]))[0].status).toBe("resolved");

  // admin can unpublish; the library empties again
  await admin.goto("/admin/doubts?status=resolved");
  await admin.getByRole("listitem").filter({ hasText: title }).first().getByRole("button", { name: "Unpublish" }).click();
  await expect.poll(async () => (await sql("select published from doubts where id=$1", [row.id]))[0].published).toBe(false);
  await ctx.close();
  expect(problems.filter((p) => !/http 404/.test(p))).toEqual([]);
});
