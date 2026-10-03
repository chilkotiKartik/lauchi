import { test, expect } from "@playwright/test";
import { onboard, signIn, sql, uniqueEmail, watch } from "./helpers";

/** A small but valid one-page PDF with real text, built with correct xref offsets. */
function makePdf(text: string): Buffer {
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    "", // content stream, filled below
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  const stream = `BT /F1 28 Tf 72 760 Td (${text}) Tj ET`;
  objs[3] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((o, i) => { offsets.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((n) => `${String(n).padStart(10, "0")} 00000 n \n`).join("")}`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}

test("PDF notes: admin uploads read-only, students read them in the app and cannot download", async ({ page }) => {
  test.setTimeout(150_000);
  const problems = watch(page);
  const title = `E2E Unit 1 waves notes ${Date.now().toString(36)}`;
  const email = uniqueEmail();
  await signIn(page, email); await onboard(page);
  await sql("insert into admins(user_id) select id from auth.users where email=$1", [email]);

  // admin uploads a real PDF, leaving "Students may download" off
  await page.goto("/admin/resources");
  await page.locator("#res-file").setInputFiles({ name: "waves.pdf", mimeType: "application/pdf", buffer: makePdf("Unit 1: Waves and oscillations") });
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Subject").selectOption("AHT-001");
  await page.getByLabel("Unit", { exact: true }).selectOption("1");
  await page.getByRole("button", { name: "Add to notes & files" }).click();
  await expect(page.getByText(/Added as read-only/)).toBeVisible();
  await expect(page.getByText("Read-only for students").first()).toBeVisible();
  const [row] = await sql("select id, allow_download from resources where title=$1", [title]) as { id: string; allow_download: boolean }[];
  expect(row.allow_download).toBe(false);

  // the student reads it inside the app: pages drawn by pdf.js, no download button
  await page.goto("/resources");
  await page.getByRole("button", { name: `Read ${title}` }).click();
  const reader = page.getByRole("dialog");
  await expect(reader.getByText(/1 page · Read-only/)).toBeVisible();
  await expect(reader.getByLabel("Page 1")).toBeVisible();
  await expect(reader.getByRole("link", { name: "Download" })).toHaveCount(0);
  // the page really was drawn (not a blank canvas)
  await expect.poll(() => reader.getByLabel("Page 1").evaluate((c: HTMLCanvasElement) => {
    const d = c.getContext("2d")!.getImageData(0, 0, c.width, Math.min(c.height, 200)).data;
    let dark = 0; for (let i = 0; i < d.length; i += 4) if (d[i] < 128) dark++;
    return dark;
  })).toBeGreaterThan(50);
  await reader.getByRole("button", { name: "Close" }).click();

  // the server refuses every way of getting the file out, but streams it to the reader
  expect((await page.request.get(`/api/resources/${row.id}?download=1`, { maxRedirects: 0 })).status()).toBe(403);
  expect((await page.request.get(`/api/resources/${row.id}?json=1`)).status()).toBe(403);
  const view = await page.request.get(`/api/resources/${row.id}?view=1`);
  expect(view.status()).toBe(200);
  expect(view.headers()["content-type"]).toContain("application/pdf");
  expect(view.headers()["content-disposition"]).toBe("inline");

  // the admin allows downloads for this file; now Download appears and the link works
  await page.goto("/admin/resources");
  await page.getByRole("button", { name: `Allow download of ${title}` }).click();
  await expect(page.getByRole("button", { name: `Make read-only ${title}` })).toBeVisible();
  await page.goto("/resources");
  await expect(page.getByRole("link", { name: `Download ${title}` })).toBeVisible();
  expect((await page.request.get(`/api/resources/${row.id}?download=1`, { maxRedirects: 0 })).status()).toBe(302);
  expect(problems.filter((p) => !p.includes("/api/resources/"))).toEqual([]);
});
