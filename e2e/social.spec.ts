import { test, expect, type Browser, type Page } from "@playwright/test";
import { addXp, onboard, signIn, uniqueEmail, watch } from "./helpers";

/** A second signed-in student in their own browser context (own cookies). */
async function student(browser: Browser, name: string): Promise<{ page: Page; email: string; close: () => Promise<void> }> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const email = uniqueEmail();
  await signIn(page, email);
  await onboard(page, name);
  return { page, email, close: () => ctx.close() };
}

test("friends and study groups: invite links, requests, checklist, nudge and group streak", async ({ browser }) => {
  test.setTimeout(120_000);
  const a = await student(browser, "Asha Rawat");
  const b = await student(browser, "Bikram Negi");
  const problems = [...watch(a.page), ...watch(b.page)];
  try {
    // ---- the signed-out invite link still requires sign-in
    const anon = await browser.newContext();
    const anonPage = await anon.newPage();
    await anonPage.goto("/join/ABCD2345");
    await expect(anonPage).toHaveURL(/\/login/);
    await anon.close();

    // ---- A: empty states, then creates a group
    await a.page.goto("/friends");
    await expect(a.page.getByRole("heading", { level: 1, name: /Friends & Groups/ })).toBeVisible();
    await expect(a.page.getByText("No friends here yet")).toBeVisible();
    await expect(a.page.getByText("Start a group streak")).toBeVisible();
    const friendCodeA = (await a.page.getByTestId("friend-code").getAttribute("data-code"))!;
    expect(friendCodeA).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);

    await a.page.getByText("Create a group", { exact: true }).click();
    await a.page.getByLabel("Group name").fill("Night owls");
    await a.page.getByRole("radio", { name: "Emoji 🔥" }).click();
    await a.page.getByRole("radio", { name: "Colour blue" }).click();
    await a.page.getByRole("button", { name: "Create group" }).click();
    await expect(a.page).toHaveURL(/\/friends\/groups\/[0-9a-f-]{36}$/);
    await expect(a.page.getByRole("heading", { level: 1, name: "Night owls" })).toBeVisible();
    const groupUrl = a.page.url();
    const groupCode = (await a.page.getByTestId("group-code").getAttribute("data-code"))!;
    expect(groupCode).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
    await expect(a.page.getByTestId("check-row")).toHaveCount(1);

    // ---- B joins through the invite link
    await b.page.goto(`/join/${groupCode}`);
    await expect(b.page).toHaveURL(new RegExp(`/friends\\?add=${groupCode}`));
    await expect(b.page.getByRole("heading", { name: "Join Night owls?" })).toBeVisible();
    await b.page.getByRole("button", { name: "Join group" }).click();
    await expect(b.page).toHaveURL(/\/friends\/groups\/[0-9a-f-]{36}$/);
    await expect(b.page.getByRole("heading", { level: 1, name: "Night owls" })).toBeVisible();

    // both appear, by first name only
    for (const p of [a.page, b.page]) {
      await p.goto(groupUrl);
      const rows = p.getByTestId("check-row");
      await expect(rows).toHaveCount(2);
      await expect(rows.filter({ hasText: "Asha" })).toHaveCount(1);
      await expect(rows.filter({ hasText: "Bikram" })).toHaveCount(1);
      await expect(p.getByText(/Rawat|Negi/)).toHaveCount(0);
      await expect(p.getByTestId("checklist-count")).toHaveText("0 of 2 studied today");
    }

    // a stranger who is not in the group sees nothing
    const c = await student(browser, "Chetna");
    await c.page.goto(groupUrl);
    await expect(c.page.getByRole("heading", { name: "You're not in this group" })).toBeVisible();
    await expect(c.page.getByText("Night owls")).toHaveCount(0);
    await c.close();

    // ---- friend request and accept
    await b.page.goto(`/friends?add=${friendCodeA}`);
    await expect(b.page.getByRole("heading", { name: "Add Asha as a friend?" })).toBeVisible();
    await b.page.getByRole("button", { name: "Send friend request" }).click();
    await expect(b.page.getByText("Request sent to Asha")).toBeVisible();
    await b.page.reload();
    await expect(b.page.getByText("Waiting for them to accept")).toBeVisible();

    await a.page.goto("/friends");
    await expect(a.page.getByText("Bikram wants to be your friend")).toBeVisible();
    await a.page.getByRole("button", { name: "Accept Bikram" }).click();
    const friends = a.page.getByRole("list", { name: "Friends" });
    await expect(friends.getByText("Bikram")).toBeVisible();
    await expect(friends.getByText("Not yet today")).toBeVisible();

    await b.page.goto("/friends");
    await expect(b.page.getByRole("list", { name: "Friends" }).getByText("Asha")).toBeVisible();

    // ---- group checklist: A studies, B is nudged
    await addXp(a.email, 25, 0);
    await a.page.goto(groupUrl);
    await expect(a.page.getByTestId("checklist-count")).toHaveText("1 of 2 studied today");
    await expect(a.page.getByTestId("check-row").filter({ hasText: "Asha" })).toContainText("Studied");
    await expect(a.page.getByTestId("check-row").filter({ hasText: "Bikram" })).toContainText("Not yet");
    await expect(a.page.getByRole("img", { name: "Group streak: 0 days" })).toBeVisible();
    await a.page.getByRole("button", { name: "Nudge Bikram" }).click();
    await expect(a.page.getByText("Nudged 🔔")).toBeVisible(); // the button turns into a "Nudged" chip once the page refreshes
    await expect(a.page.getByRole("button", { name: "Nudge Bikram" })).toHaveCount(0);
    await a.page.reload();
    await expect(a.page.getByText("Nudged 🔔")).toBeVisible(); // one nudge per pair per day

    await b.page.goto("/friends");
    await expect(b.page.getByRole("region", { name: "Nudges" }).getByText("Asha nudged you")).toBeVisible();
    // A's friend row shows the tick and B can nudge A back? A already studied, so no nudge button.
    await expect(b.page.getByRole("list", { name: "Friends" }).getByText("Studied today")).toBeVisible();
    await expect(b.page.getByRole("button", { name: "Nudge Asha" })).toHaveCount(0);

    // ---- B studies: the group completes and the streak starts
    await addXp(b.email, 40, 0);
    await b.page.goto(groupUrl);
    await expect(b.page.getByTestId("checklist-count")).toHaveText("2 of 2 studied today");
    await expect(b.page.getByText(/Everyone studied today!/)).toBeVisible();
    await expect(b.page.getByRole("img", { name: "Group streak: 1 day" })).toBeVisible();
    await expect(b.page.getByRole("list", { name: "Last 7 days" }).getByRole("img", { name: /everyone studied/ })).toHaveCount(1);
    // this week's board inside the group
    const board = b.page.getByRole("list", { name: "This week's XP in the group" });
    await expect(board.getByRole("listitem").first()).toContainText("Bikram");
    await expect(board.getByRole("listitem").first()).toContainText("40 XP");

    // ---- owner tools: rename, then B leaves
    await a.page.goto(groupUrl);
    await a.page.getByText("Group settings").click();
    await a.page.getByLabel("Group name").fill("Early birds");
    await a.page.getByRole("button", { name: "Save changes" }).click();
    await expect(a.page.getByText("Saved.")).toBeVisible();
    await a.page.reload();
    await expect(a.page.getByRole("heading", { level: 1, name: "Early birds" })).toBeVisible();

    await b.page.goto(groupUrl);
    await b.page.getByRole("button", { name: "Leave group" }).click();
    await b.page.getByRole("button", { name: "Yes" }).click();
    await expect(b.page).toHaveURL(/\/friends$/);
    await a.page.reload();
    await expect(a.page.getByTestId("check-row")).toHaveCount(1);

    expect(problems).toEqual([]);
  } finally {
    await a.close();
    await b.close();
  }
});
