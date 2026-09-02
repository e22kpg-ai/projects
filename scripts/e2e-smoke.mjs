/*
 * E2E smoke test — รันกับ dev server ที่เปิดค้างไว้เอง (สคริปต์นี้ไม่ได้สตาร์ทเซิร์ฟเวอร์ให้)
 *
 *   npm run dev          # เทอร์มินัลหนึ่ง
 *   npm run test:e2e     # อีกเทอร์มินัลหนึ่ง
 *
 * ต้องมีเบราว์เซอร์ของ Playwright ในเครื่องก่อน: npx playwright install chromium
 * สคริปต์นี้เขียนของจริงลง DB (สมัครผู้ใช้ใหม่ สร้าง/ลบห้อง จองจริง) — ใช้กับ dev DB เท่านั้น
 */
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const PROJECT = path.resolve(import.meta.dirname, "..");
const SHOTS = path.join(PROJECT, ".e2e-shots");

mkdirSync(SHOTS, { recursive: true });

const results = [];
const ok = (m) => results.push(`OK   ${m}`);
const fail = (m) => results.push(`FAIL ${m}`);

const shot = (page, name) =>
  page.screenshot({ path: path.join(SHOTS, `v-${name}.png`), fullPage: true });

async function main() {
  const browser = await chromium.launch();

  // ---------- unauthenticated / forged cookie ----------
  const anon = await browser.newContext();
  const anonPage = await anon.newPage();
  anonPage.setDefaultNavigationTimeout(90000);
  anonPage.setDefaultTimeout(20000);

  await anonPage.setExtraHTTPHeaders({ Cookie: "better-auth.session_token=totally-fake-value" });
  await anonPage.goto(`${BASE}/calendar?date=2026-09-01`);
  await anonPage.waitForURL(/\/login/, { timeout: 20000 }).catch(() => {});
  if (anonPage.url().includes("/login")) ok("forged cookie on /calendar lands on /login");
  else fail(`forged cookie on /calendar stayed at ${anonPage.url()}`);

  await anonPage.goto(`${BASE}/rooms`);
  await anonPage.waitForURL(/\/login/, { timeout: 20000 }).catch(() => {});
  if (anonPage.url().includes("/login")) ok("forged cookie on /rooms lands on /login");
  else fail(`forged cookie on /rooms stayed at ${anonPage.url()}`);
  await anon.close();

  // ---------- admin ----------
  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  admin.setDefaultNavigationTimeout(90000);
  admin.setDefaultTimeout(20000);
  admin.on("pageerror", (e) => fail(`page error (admin): ${e.message}`));
  admin.on("console", (m) => {
    if (m.type() === "error" && !m.text().includes("hydrated but some attributes")) {
      fail(`console error (admin): ${m.text().slice(0, 160)}`);
    }
  });

  await admin.goto(`${BASE}/signup`);
  await admin.click("text=สมัครบัญชีทดสอบใหม่ทันที (Dev)");
  await admin.waitForURL(`${BASE}/rooms`, { timeout: 90000 });
  ok("dev signup works (server action path, no bundled credentials)");

  execSync(`npx tsx src/adapters/driven/drizzle/scripts/_test-promote-latest.ts`, {
    cwd: PROJECT,
    stdio: "inherit",
  });

  await admin.goto(`${BASE}/admin/rooms`);
  await admin.waitForSelector("text=จัดการห้องประชุม", { timeout: 60000 });
  ok("/admin/rooms loads for admin");
  if ((await admin.locator('h1:has-text("จัดการห้องประชุม")').count()) === 1)
    ok("exactly one h1 on admin rooms page (no duplicate header)");
  else fail("admin rooms page header count wrong");

  // create room
  await admin.click('button:has-text("เพิ่มห้องประชุม")');
  await admin.waitForSelector('input[name="name"]');
  await admin.fill('input[name="name"]', "ห้องรีวิว QA");
  await admin.fill('input[name="capacity"]', "6");
  await admin.fill('input[name="equipment"]', "โปรเจกเตอร์, ไมโครโฟน");
  await admin.fill('input[name="ownerName"]', "คุณคิว");
  await admin.click('button[type="submit"]:has-text("เพิ่มห้อง")');
  await admin.waitForSelector("text=ห้องรีวิว QA", { timeout: 30000 });
  ok("create room works");

  /*
   * ใช้ชื่อห้องเป็นช่องว่างล้วน ไม่ใช่ capacity=0 — เพราะ min={1} ทำให้เบราว์เซอร์
   * บล็อกตั้งแต่ฝั่ง client ฟอร์มจะไม่ถูกส่งไป server เลย
   * เคสนี้ผ่าน required ของเบราว์เซอร์ แล้วไปโดนกฎ trim ใน use-case จริง
   */
  await admin.click('button:has-text("เพิ่มห้องประชุม")');
  await admin.waitForSelector('input[name="name"]');
  await admin.fill('input[name="name"]', "   ");
  await admin.fill('input[name="capacity"]', "7");
  await admin.fill('input[name="ownerName"]', "ผู้รับผิดชอบต้องอยู่");
  await admin.click('button[type="submit"]:has-text("เพิ่มห้อง")');
  await admin.waitForSelector("text=กรุณาระบุชื่อห้อง", { timeout: 30000 });
  ok("whitespace-only room name is rejected server-side");
  const keptCapacity = await admin.inputValue('input[name="capacity"]');
  const keptOwner = await admin.inputValue('input[name="ownerName"]');
  if (keptCapacity === "7" && keptOwner === "ผู้รับผิดชอบต้องอยู่")
    ok("rejected submit keeps what the admin typed");
  else fail(`rejected submit wiped fields: capacity="${keptCapacity}" owner="${keptOwner}"`);
  await shot(admin, "01-rejected-keeps-values");
  await admin.click('button:has-text("ยกเลิก")');

  // stale error must not leak into the next modal
  await admin.click('button:has-text("เพิ่มห้องประชุม")');
  await admin.waitForSelector('input[name="name"]');
  const staleErr = await admin.locator("text=กรุณาระบุชื่อห้อง").count();
  if (staleErr === 0) ok("reopened modal shows no stale error");
  else fail("stale error from previous attempt is still displayed");
  await admin.click('button:has-text("ยกเลิก")');

  // delete
  const row = admin.locator("li", { hasText: "ห้องรีวิว QA" });
  await row.locator('button[aria-label="ลบห้อง ห้องรีวิว QA"]').click();
  await admin.waitForSelector('button:has-text("ลบห้องนี้")');
  ok("delete buttons carry room-specific aria-labels");
  await admin.click('button[type="submit"]:has-text("ลบห้องนี้")');
  await admin.waitForSelector("text=ห้องรีวิว QA", { state: "detached", timeout: 30000 }).catch(() => {});
  if ((await admin.locator("text=ห้องรีวิว QA").count()) === 0) ok("delete room works");
  else fail("room still present after delete");

  // users page: role change now needs an explicit save
  await admin.goto(`${BASE}/admin/users`);
  await admin.waitForSelector("text=จัดการสิทธิ์ผู้ใช้");
  const otherRow = admin.locator("li").filter({ hasText: "@example.local" }).first();
  const saveBefore = await admin.locator('button:has-text("บันทึก")').count();
  if (saveBefore === 0) ok("no save button until a role is actually changed");
  else fail("save button visible before any change");

  await otherRow.locator('label:has-text("ผู้ดูแลระบบ")').click();
  await admin.waitForSelector('button:has-text("บันทึก")', { timeout: 10000 });
  ok("changing the segmented control reveals an explicit save button (arrow keys alone cannot promote)");
  await shot(admin, "02-role-needs-save");
  await admin.click('button:has-text("บันทึก")');
  await admin.waitForTimeout(3000);
  await shot(admin, "03-role-saved");

  // ---------- non-admin ----------
  const userCtx = await browser.newContext();
  const user = await userCtx.newPage();
  user.setDefaultNavigationTimeout(90000);
  user.setDefaultTimeout(20000);
  user.on("pageerror", (e) => fail(`page error (user): ${e.message}`));
  user.on("console", (m) => {
    if (m.type() === "error" && !m.text().includes("hydrated but some attributes")) {
      fail(`console error (user): ${m.text().slice(0, 160)}`);
    }
  });

  await user.goto(`${BASE}/signup`);
  await user.click("text=สมัครบัญชีทดสอบใหม่ทันที (Dev)");
  await user.waitForURL(`${BASE}/rooms`, { timeout: 90000 });
  ok("non-admin signup works");

  if ((await user.locator('nav a:has-text("ผู้ดูแลระบบ")').count()) === 0)
    ok("non-admin sees no admin nav link");
  else fail("non-admin sees admin nav link");

  await user.goto(`${BASE}/admin/rooms`);
  const nf = await user
    .waitForSelector("text=ไม่พบหน้าที่ต้องการ", { timeout: 15000 })
    .then(() => true)
    .catch(() => false);
  if (nf) ok("/admin/rooms 404s for non-admin");
  else fail("/admin/rooms did not 404 for non-admin");

  // booking with the new fields
  await user.goto(`${BASE}/rooms`);
  const bookLink = user.locator('a:has-text("จองห้องนี้")').first();
  if ((await bookLink.count()) === 0) {
    fail("no bookable room found");
  } else {
    await bookLink.click();
    await user.waitForSelector('input[name="title"]');
    await user.fill('input[name="title"]', "ประชุมตรวจงาน QA");
    await user.fill('input[name="department"]', "ฝ่ายตรวจสอบ");
    await user.fill('input[name="chairperson"]', "คุณหัวหน้า QA");

    async function pickTime(field, label) {
      const root = user.locator(`div.select-root:has(input[name="${field}"])`);
      await root.locator('button[role="combobox"]').click();
      await user.click(`li[role="option"]:has-text("${label}")`);
    }
    /* เลือกเวลาที่ยังมาไม่ถึงในวันนี้ ไม่งั้นจะโดนกฎห้ามจองย้อนหลัง */
    const hour = Math.max(new Date().getHours() + 1, 8);
    if (hour >= 18) {
      ok("skipped booking submit (outside business hours at test time)");
    } else {
      await pickTime("startTime", `${String(hour).padStart(2, "0")}:00`);
      await pickTime("endTime", `${String(hour).padStart(2, "0")}:30`);
      await user.click('button[type="submit"]:has-text("ยืนยันการจอง")');
      await user.waitForURL(/\/rooms/, { timeout: 30000 }).catch(() => {});
      ok("booking submitted with the new meeting-detail fields");

      await user.goto(`${BASE}/calendar`);
      const block = user.locator('button:has-text("ประชุมตรวจงาน QA")').first();
      if ((await block.count()) === 0) {
        fail("booking block not found on /calendar");
      } else {
        await block.hover();
        await user.waitForTimeout(700);
        if ((await user.locator('[role="tooltip"]:has-text("ฝ่ายตรวจสอบ")').count()) > 0)
          ok("hover tooltip still shows meeting details");
        else fail("hover tooltip missing");
        await shot(user, "04-tooltip");

        await user.keyboard.press("Escape");
        await user.waitForTimeout(300);
        if ((await user.locator('[role="tooltip"]').count()) === 0)
          ok("tooltip can now be dismissed with Escape (WCAG 1.4.13)");
        else fail("Escape did not dismiss the tooltip");
      }
    }
  }

  await browser.close();
  console.log("RESULTS_START");
  console.log(results.join("\n"));
  console.log("RESULTS_END");
  if (results.some((r) => r.startsWith("FAIL"))) process.exitCode = 1;
}

main().catch((err) => {
  console.error("FATAL", err);
  process.exit(1);
});
