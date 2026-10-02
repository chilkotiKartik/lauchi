import { test, expect } from "@playwright/test";
import { onboard, onboardAs, signIn, sql, uniqueEmail, watch } from "./helpers";

test("notes & files: students see shared items by subject, hidden ones stay hidden, BCA does not see B.Tech files", async ({ page, browser }) => {
  test.setTimeout(120_000);
  const tag = Date.now().toString(36); // the database outlives a run (mobile, then desktop), so titles must be unique
  const shown = `E2E Waves notes ${tag}`;
  const hidden = `E2E Secret draft ${tag}`;
  const bcaOnly = `E2E C pointers handout ${tag}`;
  const email = uniqueEmail();

  await signIn(page, email);
  await onboard(page, "Kalu");
  await sql("insert into admins(user_id) select id from auth.users where email=$1", [email]);

  // an admin adds rows (a link kind needs no file, so no Storage API is involved)
  await sql("insert into resources(course,unit,kind,title,description,external_url) values ('AHT-001',1,'notes',$1,'Handwritten, 12 pages','https://example.com/waves')", [shown]);
  await sql("insert into resources(course,unit,kind,title,description,external_url) values ('AHT-001',2,'link',$1,'','https://example.com/draft')", [hidden]);
  await sql("insert into resources(course,unit,kind,title,description,external_url) values ('BCA-001',1,'slides',$1,'','https://example.com/c')", [bcaOnly]);

  // the admin list shows them, and Hide works
  const problems = watch(page);
  await page.goto("/admin/resources");
  await expect(page.getByRole("heading", { level: 1, name: "Notes & files" })).toBeVisible();
  await expect(page.getByText(hidden)).toBeVisible();
  await page.getByRole("button", { name: `Hide ${hidden}` }).click();
  await expect(page.getByRole("button", { name: `Show ${hidden}` })).toBeVisible();
  await expect.poll(async () => (await sql("select hidden from resources where title=$1", [hidden]))[0]?.hidden).toBe(true);

  // a B.Tech (CSE) student sees the shared item under its subject, with a New badge
  await page.goto("/resources");
  await expect(page.getByRole("heading", { level: 1, name: "Notes & files" })).toBeVisible();
  const physics = page.getByRole("region", { name: /Engineering Physics/ });
  await expect(physics.getByText(shown)).toBeVisible();
  await expect(physics.getByText("Handwritten, 12 pages").first()).toBeVisible();
  await expect(physics.getByText("New").first()).toBeVisible();
  await expect(page.getByRole("link", { name: `Open link: ${shown}` })).toHaveAttribute("href", /\/api\/resources\/[0-9a-f-]{36}$/);
  await expect(page.getByText(hidden)).toHaveCount(0);
  await expect(page.getByText(bcaOnly)).toHaveCount(0);

  // search and kind filter
  await page.locator("#res-q").fill(`nothing-like-this-${tag}`);
  await expect(page.getByText("Nothing matches")).toBeVisible();
  await page.locator("#res-q").fill("");
  await page.getByRole("group", { name: "Filter by kind" }).getByRole("button", { name: "Slides", exact: true }).click();
  await expect(page.getByText(shown)).toHaveCount(0);
  await page.getByRole("group", { name: "Filter by kind" }).getByRole("button", { name: "All", exact: true }).click();
  await expect(page.getByText(shown)).toBeVisible();

  // mark as done is remembered
  await page.getByRole("button", { name: `Mark ${shown} as done` }).click();
  await expect(page.getByRole("button", { name: `Unmark ${shown} as done` })).toBeVisible();
  await expect.poll(async () => (await sql("select count(*)::int as n from resource_seen rs join resources r on r.id=rs.resource_id where r.title=$1", [shown]))[0]?.n).toBe(1);
  await page.reload();
  await expect(page.getByRole("button", { name: `Unmark ${shown} as done` })).toBeVisible();

  // the same item is listed on its unit page
  await page.goto("/learn/AHT-001/1");
  await expect(page.getByRole("heading", { level: 2, name: "Notes & files" })).toBeVisible();
  await expect(page.getByText(shown)).toBeVisible();
  expect(problems.filter((p) => !p.includes("/_next/"))).toEqual([]);

  // a BCA student sees the BCA item and none of the B.Tech ones
  const ctx = await browser.newContext();
  const bca = await ctx.newPage();
  await signIn(bca, uniqueEmail());
  await onboardAs(bca, "Bachelor of Computer Applications");
  await bca.goto("/resources");
  await expect(bca.getByRole("heading", { level: 1, name: "Notes & files" })).toBeVisible();
  await expect(bca.getByText(bcaOnly)).toBeVisible();
  await expect(bca.getByText(shown)).toHaveCount(0);
  await expect(bca.getByText(/Engineering Physics/)).toHaveCount(0);
  await ctx.close();
});
