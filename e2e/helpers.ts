import { expect, type Page } from "@playwright/test";

export const MOCK = "http://localhost:54321";
let n = 0;
export const uniqueEmail = () => `student${Date.now()}${n++}@example.com`;

export async function sql(text: string, params: unknown[] = []) {
  const r = await fetch(`${MOCK}/__sql`, { method: "POST", body: JSON.stringify({ sql: text, params }) });
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()).rows as Record<string, unknown>[];
}
export async function addXp(email: string, xp: number, daysAgo: number) {
  await sql("insert into xp_events(user_id,kind,ref,xp,created_at) select id,'quiz_completed',gen_random_uuid()::text,$2, now() - ($3 || ' days')::interval from auth.users where email=$1", [email, xp, String(daysAgo)]);
}

export function watch(page: Page) {
  const problems: string[] = [];
  page.on("pageerror", (e) => problems.push("pageerror: " + e.message));
  page.on("response", (r) => { if (r.status() >= 400 && r.status() !== 401) problems.push(`http ${r.status()}: ${r.url()}`); });
  page.on("console", (m) => {
    const t = m.text();
    if (m.type() === "error" || /Content Security Policy|violates the following/i.test(t)) problems.push(`console: ${t.slice(0, 200)}`);
  });
  return problems;
}

export async function signIn(page: Page, email: string) {
  await page.goto("/login?tab=magic");
  await page.getByLabel("Email Address").fill(email);
  await page.getByRole("button", { name: /email me a 1-click link/i }).click();
  await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
  const { link } = await (await fetch(`${MOCK}/__mail?email=${encodeURIComponent(email)}`)).json();
  expect(link).toContain("/auth/callback?next=%2Fhome&code=");
  await page.goto(link);
}

export async function onboard(page: Page, name = "Kalu") {
  await expect(page).toHaveURL(/\/welcome$/);
  await page.getByLabel("Your name").fill(name);
  await expect(page.getByRole("button", { name: "Continue" })).toBeDisabled();
  await page.getByLabel(/I am 18 or older/).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Computer Science & Engineering/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Semester I ·/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Regular/ }).click();
  await page.getByRole("button", { name: "Finish" }).click();
  await expect(page.getByText(`Welcome, ${name}!`)).toBeVisible();
  await page.getByRole("button", { name: "Let's go" }).click();
  await expect(page).toHaveURL(/\/home$/);
}


const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
/** The browser tests run offline: answer YouTube thumbnail and player requests locally. */
export async function fakeYoutube(page: Page) {
  await page.route("https://i.ytimg.com/**", (r) => r.fulfill({ status: 200, contentType: "image/png", body: PNG }));
  await page.route("https://www.youtube-nocookie.com/**", (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>player</title><p>player</p>" }));
}

/** Same as onboard() but picks the given branch (button text is matched as a regex source, e.g. "Bachelor of Computer Applications"). */
export async function onboardAs(page: Page, branchPattern: string, name = "Kalu") {
  await expect(page).toHaveURL(/\/welcome$/);
  await page.getByLabel("Your name").fill(name);
  await page.getByLabel(/I am 18 or older/).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: new RegExp(branchPattern) }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Semester I ·/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Regular/ }).click();
  await page.getByRole("button", { name: "Finish" }).click();
  await expect(page.getByText(`Welcome, ${name}!`)).toBeVisible();
  await page.getByRole("button", { name: "Let's go" }).click();
  await expect(page).toHaveURL(/\/home$/);
}
