import { test, expect, type Browser, type Page } from "@playwright/test";
import { onboard, signIn, sql, uniqueEmail, watch } from "./helpers";

async function user(browser: Browser, name: string): Promise<{ page: Page; email: string; close: () => Promise<void> }> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const email = uniqueEmail();
  await signIn(page, email);
  await onboard(page, name);
  return { page, email, close: () => ctx.close() };
}

async function join(page: Page, code: string) {
  await page.goto("/classes");
  await page.getByLabel("Class code").fill(code);
  await page.getByRole("button", { name: "Join class" }).click();
}

test("classes: teacher RBAC, join by code, private teacher dashboard, 404 for students", async ({ browser }) => {
  test.setTimeout(150_000);
  const t = await user(browser, "Teacher Tara");
  const a = await user(browser, "Asha Rawat");
  const b = await user(browser, "Bikram Negi");
  const problems = [...watch(t.page), ...watch(a.page)];
  try {
    // ---- a normal user is not a teacher: no create form,
    await t.page.goto("/classes");
    await expect(t.page.getByRole("heading", { level: 1, name: "Classes" })).toBeVisible();
    await expect(t.page.getByRole("heading", { name: "Create a class" })).toHaveCount(0);
    await expect(t.page.getByText("You are not in a class yet")).toBeVisible();

    // ---- an admin makes them a teacher (done with SQL, as the site owner would)
    await sql("insert into teachers(user_id) select id from auth.users where email=$1", [t.email]);
    await t.page.goto("/classes");
    await expect(t.page.getByRole("heading", { name: "Create a class" })).toBeVisible();
    await t.page.getByLabel("Class name").fill("CSE-A Maths");
    await t.page.getByRole("button", { name: "Create class" }).click();
    await expect(t.page).toHaveURL(/\/classes\/[0-9a-f-]{36}$/);
    await expect(t.page.getByRole("heading", { level: 1, name: "CSE-A Maths" })).toBeVisible();
    const classUrl = t.page.url();
    const classId = classUrl.split("/").pop()!;
    const code = (await t.page.getByTestId("class-code").getAttribute("data-code"))!;
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
    await t.page.getByRole("button", { name: "Copy code" }).click();
    await expect(t.page.getByRole("status").filter({ hasText: /Code copied|Copy failed/ })).toBeVisible();
    await expect(t.page.getByText("Nobody has joined yet")).toBeVisible();

    // ---- a wrong code is rejected
    await join(a.page, "ZZZZ-ZZZZ");
    await expect(a.page.getByText(/couldn't find a class with that code/)).toBeVisible();

    // ---- A joins with the code typed in lower case with a dash
    await join(a.page, `${code.slice(0, 4)}-${code.slice(4)}`.toLowerCase());
    await expect(a.page.getByText("You joined CSE-A Maths.")).toBeVisible();
    await expect(a.page.getByTestId("my-class")).toHaveCount(1);
    await expect(a.page.getByTestId("my-class").getByText("Class average XP")).toBeVisible();
    // the teacher's own code cannot be used by the teacher to join
    await join(t.page, code);
    await expect(t.page.getByText("That is your own class")).toBeVisible();

    // ---- RBAC: a student in the class gets a 404 on every teacher URL; so does a student outside it
    // (the app shell streams, so the HTTP status can be 200; what matters is that Next renders its 404 page and no class data)
    const denied = async (who: typeof a, path: string) => {
      await who.page.goto(path);
      await expect(who.page.getByText(/could not be found/i)).toBeVisible();
      await expect(who.page.getByText(code)).toHaveCount(0);
      await expect(who.page.getByRole("heading", { name: "Class roster" })).toHaveCount(0);
    };
    for (const path of [`/classes/${classId}`, `/classes/${classId}/teacher`]) { await denied(a, path); await denied(b, path); }
    await denied(b, "/classes/not-a-uuid");
    // the student never sees the invite code on their own page
    await a.page.goto("/classes");
    await expect(a.page.getByText(code)).toHaveCount(0);
    await expect(a.page.getByText(`${code.slice(0, 4)}-${code.slice(4)}`)).toHaveCount(0);

    // ---- teacher view: A's real numbers
    await sql("insert into quiz_sessions(user_id,course,unit,seed,kind,total,correct,submitted_at) select id,'PH-101',2,1,'practice',10,4,now() from auth.users where email=$1", [a.email]);
    await sql("insert into xp_events(user_id,kind,ref,xp) select id,'quiz_completed',gen_random_uuid()::text,40 from auth.users where email=$1", [a.email]);
    await t.page.goto(classUrl);
    const row = t.page.getByTestId("roster-row").filter({ hasText: "Asha" });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText("40%");
    await expect(row).toContainText("40");
    await expect(t.page.getByTestId("weak-areas")).toContainText("40%");
    await expect(t.page.getByTestId("summary")).toContainText("Class accuracy");
    await t.page.getByRole("button", { name: /^Student/ }).click();
    await expect(t.page.getByRole("columnheader", { name: /Student/ })).toHaveAttribute("aria-sort", "ascending");

    // the teacher sees no row for B, who is not a member
    await expect(t.page.getByTestId("roster-row").filter({ hasText: "Bikram" })).toHaveCount(0);

    // ---- regenerate: the old code stops working
    await t.page.getByRole("button", { name: "Regenerate code" }).click();
    await expect(t.page.getByText(/New code made/)).toBeVisible();
    const code2 = (await t.page.getByTestId("class-code").getAttribute("data-code"))!;
    expect(code2).not.toBe(code);
    await join(b.page, code);
    await expect(b.page.getByText(/couldn't find a class with that code/)).toBeVisible();
    await join(b.page, code2);
    await expect(b.page.getByText("You joined CSE-A Maths.")).toBeVisible();

    // ---- remove a student
    await t.page.goto(classUrl);
    await expect(t.page.getByTestId("roster-row")).toHaveCount(2);
    t.page.once("dialog", (d) => d.accept());
    await t.page.getByRole("button", { name: "Remove Bikram Negi" }).click();
    await expect(t.page.getByTestId("roster-row")).toHaveCount(1);

    // ---- A leaves
    await a.page.goto("/classes");
    await a.page.getByRole("button", { name: "Leave CSE-A Maths" }).click();
    await a.page.getByRole("button", { name: "Yes, leave" }).click();
    await expect(a.page.getByText("You are not in a class yet")).toBeVisible();

    // ---- archive: the code stops working
    await t.page.goto(classUrl);
    t.page.once("dialog", (d) => d.accept());
    await t.page.getByRole("button", { name: "Archive class" }).click();
    await expect(t.page.getByRole("button", { name: "Restore class" })).toBeVisible();
    await join(a.page, code2);
    await expect(a.page.getByText(/couldn't find a class with that code/)).toBeVisible();

    // ---- admin: grants by email; non-admins get a 404
    expect((await t.page.goto("/admin/teachers"))?.status()).toBe(404);
    await sql("insert into admins(user_id) select id from auth.users where email=$1", [t.email]);
    expect((await t.page.goto("/admin/teachers"))?.status()).toBe(200);
    await expect(t.page.getByRole("heading", { level: 1, name: "Teachers" })).toBeVisible();
    await t.page.getByLabel("Teacher's email").fill(b.email);
    await t.page.getByRole("button", { name: "Make teacher" }).click();
    await expect(t.page.getByText(`${b.email.toLowerCase()} can now create classes.`)).toBeVisible();
    await expect(t.page.getByTestId("teachers-table")).toContainText(b.email);
    await b.page.goto("/classes");
    await expect(b.page.getByRole("heading", { name: "Create a class" })).toBeVisible();
    await t.page.getByLabel("Teacher's email").fill("nobody-here@example.com");
    await t.page.getByRole("button", { name: "Make teacher" }).click();
    await expect(t.page.getByText(/No account with that email/)).toBeVisible();
  } finally {
    await Promise.all([t.close(), a.close(), b.close()]);
  }
  expect(problems.filter((p) => !/http 404/.test(p) && !/Failed to load resource/.test(p))).toEqual([]);
});
