/*
 * E2E smoke test — รันกับ dev server ที่เปิดค้างไว้เอง (สคริปต์นี้ไม่ได้สตาร์ทเซิร์ฟเวอร์ให้)
 *
 *   npm run dev          # เทอร์มินัลหนึ่ง
 *   npm run test:e2e     # อีกเทอร์มินัลหนึ่ง
 *
 * ต้องมีเบราว์เซอร์ของ Playwright ในเครื่องก่อน: npx playwright install chromium
 * และต้อง migrate + seed ฐานข้อมูลก่อน (npm run db:migrate && npm run db:seed)
 * เพราะส่วน admin ล็อกอินด้วยบัญชีที่ seed สร้างไว้ และ seed เป็นตัวตั้งสถานะให้เป็น approved
 * ถ้ารันซ้ำหลายรอบจนการจองใน seed หมด ให้ล้างแล้ว seed ใหม่: npm run db:seed -- --reset
 * สคริปต์นี้เขียนของจริงลง DB (สมัครผู้ใช้ใหม่ สร้าง/ลบห้อง จองจริง) — ใช้กับ dev DB เท่านั้น
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const PROJECT = path.resolve(import.meta.dirname, "..");
const SHOTS = path.join(PROJECT, ".e2e-shots");

mkdirSync(SHOTS, { recursive: true });

/*
 * ★ พิมพ์ทันทีที่รู้ผล ไม่ใช่เก็บไว้พิมพ์ตอนจบ
 *
 *   ของเดิมพิมพ์ทีเดียวท้ายไฟล์ พอมีอะไร throw กลางทาง (timeout, selector เปลี่ยน)
 *   ผลที่ผ่านมาแล้วหายหมด เหลือแต่ stack trace ทำให้ไล่ไม่ออกว่าพังตรงไหนของ flow
 */
const results = [];
const ok = (m) => {
  const line = `OK   ${m}`;
  results.push(line);
  console.log(line);
};
const fail = (m) => {
  const line = `FAIL ${m}`;
  results.push(line);
  console.log(line);
};

function printSummary() {
  const failed = results.filter((r) => r.startsWith("FAIL"));
  console.log(``);
  console.log(`SUMMARY: ${results.length - failed.length} OK, ${failed.length} FAIL`);
  for (const line of failed) console.log(line);
}

/** custom Select ของโปรเจกต์: เปิด combobox แล้วเลือก option ตามป้าย */
async function pickFromSelect(page, root, label) {
  await root.locator('button[role="combobox"]').click();
  await page.locator(`li[role="option"]:has-text("${label}")`).first().click();
}

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

  // ---------- dev signup ----------
  /*
   * สมัครบัญชีทดสอบใหม่ก่อนเข้าส่วน admin ด้วยเหตุผลสองข้อ
   *   1. ยืนยันว่าทางลัดสมัครฝั่ง dev ยังทำงาน (ผ่าน server action ไม่มี credential ติดไปกับ bundle)
   *   2. การันตีว่ามีผู้ใช้ธรรมดา @example.local อยู่ในระบบ ให้เทสต์เปลี่ยน role ข้างล่างมีเป้าให้กด
   *      และเป็นคนละคนกับ admin ที่กำลังกดอยู่ ซึ่งตรงกับสถานการณ์จริงมากกว่าเดิม
   */
  const signupCtx = await browser.newContext();
  const signupPage = await signupCtx.newPage();
  signupPage.setDefaultNavigationTimeout(90000);
  signupPage.setDefaultTimeout(20000);

  await signupPage.goto(`${BASE}/signup`);
  await signupPage.click("text=สมัครบัญชีทดสอบใหม่ทันที (Dev)");
  await signupPage.waitForURL((url) => url.pathname === "/pending", { timeout: 90000 });
  ok("dev signup works and lands on /pending (new accounts start unapproved)");

  /*
   * ★ toast ยืนยันว่า "สมัครสำเร็จแล้วนะ" — จังหวะที่เคยเงียบสนิท
   *   ผู้ใช้เคยกดสมัครแล้วโผล่มาหน้ารออนุมัติเฉยๆ โดยไม่มีอะไรบอกว่าสมัครติดหรือเปล่า
   */
  const signupToast = await signupPage
    .waitForSelector("text=สมัครสมาชิกเรียบร้อยแล้ว", { timeout: 15000 })
    .then(() => true)
    .catch(() => false);
  if (signupToast) ok("a toast confirms the signup landed");
  else fail("no toast after signup");

  /*
   * ★ query ต้องถูกลบทิ้งหลังยิง toast
   *   ถ้าค้างไว้ กด refresh ทีก็เด้ง toast ซ้ำที และปุ่ม back พาย้อนกลับมาที่สถานะเดิม
   */
  await signupPage.waitForTimeout(1200);
  if (!signupPage.url().includes("notice=")) ok("the notice query is cleared from the URL");
  else fail(`notice query stayed in the URL: ${signupPage.url()}`);

  /*
   * ★ ด่านสำคัญที่สุดของฟีเจอร์อนุมัติ: คนที่ยังไม่ถูกอนุมัติต้องเข้าหน้าที่มีข้อมูลจริงไม่ได้
   *   ถ้าข้อนี้พัง แปลว่าใครก็ตามที่สมัครเข้ามาเห็นตารางประชุมทั้งองค์กรได้ทันที
   */
  await signupPage.goto(`${BASE}/rooms`);
  await signupPage.waitForURL(/\/pending/, { timeout: 30000 }).catch(() => {});
  if (signupPage.url().includes("/pending")) ok("unapproved account is bounced off /rooms");
  else fail(`unapproved account reached ${signupPage.url()}`);

  /* ถูกเด้งกลับมาทุกครั้งต้องมีคำอธิบาย ไม่งั้นผู้ใช้จะคิดว่าลิงก์เสียหรือระบบพัง */
  const blockedToast = await signupPage
    .waitForSelector("text=ยังรอการอนุมัติ", { timeout: 15000 })
    .then(() => true)
    .catch(() => false);
  if (blockedToast) ok("a toast explains why the unapproved account was bounced back");
  else fail("no toast explaining the bounce");

  await signupPage.goto(`${BASE}/calendar`);
  await signupPage.waitForURL(/\/pending/, { timeout: 30000 }).catch(() => {});
  if (signupPage.url().includes("/pending")) ok("unapproved account is bounced off /calendar");
  else fail(`unapproved account reached ${signupPage.url()}`);

  await shot(signupPage, "08-pending-approval");

  /*
   * ★ ยิงตรงที่ endpoint ไม่ผ่านฟอร์ม
   *
   *   /api/auth/sign-up/email เปิดสาธารณะ การตรวจโดเมนในฟอร์มกันได้แค่คนที่เดินผ่านหน้าเว็บ
   *   ข้อนี้พิสูจน์ว่า validateUserInfo ใน auth.ts กันถึงระดับ endpoint จริง
   *
   * ★ ต้องใช้ context ใหม่ที่ไม่มี cookie และต้องใส่ header Origin ด้วย
   *   ถ้ายิงจาก context ที่ล็อกอินอยู่โดยไม่มี Origin better-auth จะตอบ 403
   *   MISSING_OR_NULL_ORIGIN (ด่าน CSRF) ซึ่ง "หน้าตาเหมือนผ่าน" ทั้งที่กฎโดเมน
   *   ไม่เคยถูกเรียกเลย — เคยพลาดมาแล้วตอนเขียนเทสต์นี้ครั้งแรก
   *
   * ★ และต้องเช็ค code ในเนื้อคำตอบ ไม่ใช่แค่ status 403 ด้วยเหตุผลเดียวกัน:
   *   403 มาได้จากหลายสาเหตุ เทสต์ที่ดูแค่ตัวเลขจะผ่านแม้กฎที่ต้องการทดสอบจะถูกลบทิ้งไปแล้ว
   */
  const apiCtx = await browser.newContext();
  const apiHeaders = { "Content-Type": "application/json", Origin: BASE };

  const outsider = await apiCtx.request.post(`${BASE}/api/auth/sign-up/email`, {
    headers: apiHeaders,
    data: {
      email: `outsider+${Date.now()}@gmail.com`,
      password: "outsider-password-123",
      name: "คนนอกองค์กร",
      affiliation: "ไม่มีสังกัด",
    },
    failOnStatusCode: false,
  });
  const outsiderBody = await outsider.json().catch(() => ({}));
  if (outsider.status() === 403 && outsiderBody.code === "email_domain_not_allowed") {
    ok("signup endpoint rejects an outside email domain by the domain rule itself");
  } else {
    fail(
      `outside domain not rejected by the domain rule: HTTP ${outsider.status()} code=${outsiderBody.code}`,
    );
  }

  /* โดเมนขององค์กรต้องยังผ่านได้ ไม่ใช่ปิดตายทุกอย่าง */
  const insider = await apiCtx.request.post(`${BASE}/api/auth/sign-up/email`, {
    headers: apiHeaders,
    data: {
      email: `e2e+${Date.now()}@rtarf.mi.th`,
      password: "insider-password-123",
      name: "คนในองค์กร",
      affiliation: "กรมยุทธการทหาร",
    },
    failOnStatusCode: false,
  });
  const insiderBody = await insider.json().catch(() => ({}));
  if (insider.status() >= 200 && insider.status() < 300) {
    /* ★ บัญชีที่สมัครผ่าน endpoint ตรงๆ ก็ต้องเป็น pending ห้ามอนุมัติตัวเองได้ */
    if (insiderBody.user?.status === "pending") {
      ok("organisation domain is accepted and the new account starts as pending");
    } else {
      fail(`new account did not start pending: status=${insiderBody.user?.status}`);
    }
  } else {
    fail(`organisation domain was rejected: HTTP ${insider.status()} code=${insiderBody.code}`);
  }

  /* ★ ส่ง status มาเองต้องไม่มีผล — additionalFields ตั้ง input:false ไว้ */
  const selfApprove = await apiCtx.request.post(`${BASE}/api/auth/sign-up/email`, {
    headers: apiHeaders,
    data: {
      email: `sneaky+${Date.now()}@rtarf.mi.th`,
      password: "sneaky-password-123",
      name: "คนที่พยายามอนุมัติตัวเอง",
      affiliation: "กรมยุทธการทหาร",
      status: "approved",
      role: "admin",
    },
    failOnStatusCode: false,
  });
  const sneakyBody = await selfApprove.json().catch(() => ({}));
  if (sneakyBody.user?.status === "pending" && sneakyBody.user?.role === "user") {
    ok("status and role sent in the signup body are ignored (no self-approval, no self-promotion)");
  } else {
    fail(
      `signup body overrode privileged fields: status=${sneakyBody.user?.status} role=${sneakyBody.user?.role}`,
    );
  }
  await apiCtx.close();

  await signupCtx.close();

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

  /*
   * ล็อกอินด้วยบัญชี admin ที่ db:seed สร้างไว้ แทนการสมัครใหม่แล้วเลื่อนขั้น
   *
   * ของเดิมเรียก _test-promote-latest.ts ซึ่งถูกลบไปแล้ว (commit 197d8e4) เพราะมันเลื่อน
   * "คนที่สมัครล่าสุด" ขึ้นเป็น admin โดยไม่ตรวจว่ากำลังชี้ไปที่ฐานข้อมูลไหน
   * ทางนี้ไม่ต้องแก้ role ของใครเลย ใช้บัญชีที่ seed ตั้ง role=admin ไว้ให้อยู่แล้ว
   */
  await admin.goto(`${BASE}/login`);
  await admin.click('button:has-text("เข้าสู่ระบบ (ผู้ดูแลระบบ)")');
  await admin.waitForURL(`${BASE}/admin/users`, { timeout: 90000 });
  ok("dev admin login works (seeded admin, no role-mutating script needed)");

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
  /*
   * ★ ต้องเจาะจงเลือกคนที่ role ยังเป็น "ผู้ใช้ทั่วไป" อยู่ ไม่ใช่ .first() เฉยๆ
   *
   *   ปุ่ม "บันทึก" ขึ้นเฉพาะตอน dirty (ดู UserRoleTable.tsx) กดเลือก "ผู้ดูแลระบบ"
   *   ใส่คนที่เป็น admin อยู่แล้วจึงไม่มีอะไรเปลี่ยน ปุ่มไม่โผล่ แล้วเทสต์ค้างรอจนหมดเวลา
   *   ซึ่งเกิดแน่นอนตั้งแต่รอบที่สองเป็นต้นไป เพราะรอบก่อนเลื่อนขั้นคนไปแล้วหนึ่งคน
   *   — อาการจะออกมาเป็น "เทสต์พัง" ทั้งที่โค้ดแอปถูกต้องทุกอย่าง
   */
  const otherRow = admin
    .locator('li:has(input[name="role"][value="user"]:checked)')
    .filter({ hasText: "@example.local" })
    .first();
  if ((await otherRow.count()) === 0) {
    fail("no non-admin @example.local user to promote (ลองรัน: npm run db:seed -- --reset)");
  }
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

  // ---------- admin สร้างบัญชีให้คนที่ไม่มีอีเมลหน่วยงาน ----------
  /*
   * ★ ช่องทางนี้คือทางเลือกแทนการเปิด gmail.com ใน allowlist
   *   จึงต้องพิสูจน์สองอย่างคู่กันเสมอ: สร้างได้จริง และช่องยกเว้น "ไม่รั่ว"
   *   ออกไปให้คนข้างนอกสมัครเองด้วยอีเมลแบบเดียวกัน
   */
  const provisionedEmail = `contractor+${Date.now()}@gmail.com`;

  await admin.goto(`${BASE}/admin/users`);
  await admin.waitForSelector("text=จัดการสิทธิ์ผู้ใช้", { timeout: 30000 });
  await admin.click('button:has-text("เพิ่มบัญชีผู้ใช้")');
  await admin.waitForSelector('input[name="email"]', { timeout: 20000 });
  await admin.fill('input[name="name"]', "คุณคู่สัญญา");
  await admin.fill('input[name="email"]', provisionedEmail);
  await admin.fill('input[name="affiliation"]', "บริษัทคู่สัญญาภายนอก");
  await admin.click('button[type="submit"]:has-text("สร้างบัญชี")');

  const provisioned = await admin
    .waitForSelector("text=รหัสผ่านนี้แสดงเพียงครั้งเดียว", { timeout: 30000 })
    .then(() => true)
    .catch(() => false);
  if (provisioned) {
    ok("admin can create an account for an address outside the organisation domain");
  } else {
    fail("admin could not create an out-of-domain account");
  }
  await shot(admin, "10-provisioned-account");
  await admin.click('button:has-text("เสร็จสิ้น")');

  /* บัญชีที่ admin สร้างต้องใช้งานได้ทันที ไม่ไปกองรวมกับคนที่รออนุมัติ */
  await admin.goto(`${BASE}/admin/users`);
  await admin.waitForSelector("text=จัดการสิทธิ์ผู้ใช้", { timeout: 30000 });
  const provisionedRow = admin.locator("li").filter({ hasText: provisionedEmail }).first();
  if ((await provisionedRow.count()) === 0) {
    fail("the provisioned account is missing from the user list");
  } else if ((await provisionedRow.locator("text=ใช้งานได้").count()) > 0) {
    ok("a provisioned account is usable immediately, with no second approval step");
  } else {
    fail("the provisioned account was left waiting for approval");
  }

  /*
   * ★ ข้อที่สำคัญที่สุดของบล็อกนี้
   *
   *   การยกเว้นกฎโดเมนต้องมีผลเฉพาะตอน admin เป็นคนสร้างเท่านั้น
   *   ถ้าคนข้างนอกยิง endpoint ด้วยอีเมล gmail แล้วสมัครผ่าน แปลว่าเครื่องหมาย
   *   provisioning รั่วออกนอกขอบเขต และด่านโดเมนก็ไม่เหลือความหมายอีกต่อไป
   */
  const leakCtx = await browser.newContext();
  const leakProbe = await leakCtx.request.post(`${BASE}/api/auth/sign-up/email`, {
    headers: { "Content-Type": "application/json", Origin: BASE },
    data: {
      email: `leak+${Date.now()}@gmail.com`,
      password: "leak-password-123",
      name: "คนนอกที่พยายามสมัครเอง",
      affiliation: "ไม่มีสังกัด",
    },
    failOnStatusCode: false,
  });
  const leakBody = await leakProbe.json().catch(() => ({}));
  if (leakProbe.status() === 403 && leakBody.code === "email_domain_not_allowed") {
    ok("the admin-provisioning exemption does not leak to public signup");
  } else {
    fail(
      `provisioning exemption leaked: public signup with gmail returned HTTP ${leakProbe.status()} code=${leakBody.code}`,
    );
  }
  await leakCtx.close();

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
  await user.waitForURL(`${BASE}/pending`, { timeout: 90000 });
  ok("non-admin signup works and starts unapproved");

  /*
   * ★ วงจรอนุมัติแบบครบรอบ: สมัคร -> ถูกกั้น -> admin อนุมัติ -> ใช้งานได้
   *
   *   ต้องอนุมัติที่นี่ ไม่งั้นเทสต์จองห้องข้างล่างจะพังทั้งหมด ซึ่งก็ถูกต้องแล้ว
   *   เพราะบัญชีใหม่จองไม่ได้จริงๆ จนกว่าจะมีคนอนุมัติ
   *
   *   อนุมัติทุกบัญชี @example.local ที่ค้างอยู่ ไม่เจาะจงคนใดคนหนึ่ง เพราะอีเมลของ
   *   ปุ่ม dev สุ่มมาทุกครั้ง และรอบก่อนๆ อาจทิ้งบัญชีค้างไว้ด้วย
   *   ต้อง goto ใหม่ทุกรอบเพราะ revalidatePath ทำให้ทั้งรายการถูกเรนเดอร์ใหม่
   */
  let approvedCount = 0;
  for (let i = 0; i < 12; i++) {
    await admin.goto(`${BASE}/admin/users`);
    await admin.waitForSelector("text=จัดการสิทธิ์ผู้ใช้", { timeout: 30000 });
    const approveBtn = admin
      .locator('li:has-text("@example.local") button:has-text("อนุมัติ")')
      .first();
    if ((await approveBtn.count()) === 0) break;
    await approveBtn.click();
    await admin.waitForTimeout(1500);
    approvedCount++;
  }
  if (approvedCount > 0) ok(`admin approved ${approvedCount} pending account(s)`);
  else fail("no pending account was available for the admin to approve");

  await shot(admin, "09-approve-users");

  /* หลังอนุมัติแล้วต้องเข้า /rooms ได้ทันทีโดยไม่ต้องล็อกอินใหม่ */
  await user.goto(`${BASE}/rooms`);
  await user.waitForSelector("text=ห้องประชุม", { timeout: 30000 }).catch(() => {});
  if (user.url().includes("/rooms")) ok("approved account can reach /rooms without re-login");
  else fail(`approved account was still bounced to ${user.url()}`);

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
  /* จำไว้ว่ารอบนี้จองอะไรสำเร็จบ้าง เพื่อให้เทสต์ยกเลิกข้างล่างเก็บกวาดของตัวเองได้ */
  let createdBookingTitle = null;
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
      createdBookingTitle = "ประชุมตรวจงาน QA";

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

  // ---------- ยกเลิกการจอง ----------
  /*
   * ★ ถ้ารอบนี้จองสำเร็จ ให้ยกเลิก "ของที่ตัวเองเพิ่งจอง" — เทสต์จะครบวงจรและรันซ้ำได้ไม่รู้จบ
   *
   *   ถ้ารันนอกเวลาทำการจนจองไม่ได้ ค่อยถอยไปใช้การจองที่ db:seed สร้างไว้ ซึ่งเป็นของ
   *   dev@example.com จึงต้องล็อกอินเป็นคนนั้น (canCancel ให้เฉพาะเจ้าของกับ admin)
   *   ทางถอยนี้กินข้อมูล seed ไปครั้งละหนึ่งรายการ รันซ้ำหลายรอบแล้วต้อง db:seed ใหม่
   */
  {
    let canceller = user;
    let cancelCtx = null;
    let targetTitle = createdBookingTitle;

    if (!targetTitle) {
      cancelCtx = await browser.newContext();
      canceller = await cancelCtx.newPage();
      canceller.setDefaultNavigationTimeout(90000);
      canceller.setDefaultTimeout(20000);
      await canceller.goto(BASE + "/login");
      await canceller.click('button:has-text("เข้าสู่ระบบ (ผู้ใช้ทั่วไป)")');
      await canceller.waitForURL(BASE + "/rooms", { timeout: 90000 });
    }

    const blockSelector = "div.grid button:has(span.font-medium)";
    let foundOn = null;

    /* การจองที่ยังไม่จบอาจอยู่วันไหนก็ได้ ไล่หาไปข้างหน้าสูงสุด 8 วัน */
    for (let i = 0; i < 8 && !foundOn; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso =
        d.getFullYear() +
        "-" +
        String(d.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(d.getDate()).padStart(2, "0");
      await canceller.goto(BASE + "/calendar?date=" + iso);
      await canceller.waitForTimeout(600);
      const candidates = targetTitle
        ? canceller.locator('button:has-text("' + targetTitle + '")')
        : canceller.locator(blockSelector);
      if ((await candidates.count()) > 0) foundOn = iso;
    }

    if (!foundOn) {
      fail("ไม่เจอการจองที่ยังไม่จบบนปฏิทินภายใน 8 วัน — ทดสอบยกเลิกไม่ได้");
    } else {
      const before = await canceller.locator(blockSelector).count();
      const block = targetTitle
        ? canceller.locator('button:has-text("' + targetTitle + '")').first()
        : canceller.locator(blockSelector).first();
      const label = (await block.innerText()).replace(/\s+/g, " ").trim();
      await block.click();

      const cancelBtn = canceller.locator('button:has-text("ยกเลิกการจองนี้")');
      if ((await cancelBtn.count()) === 0) {
        fail('modal ของการจอง "' + label + '" ไม่มีปุ่มยกเลิกให้เจ้าของกด');
      } else {
        ok("modal ของการจองมีปุ่มยกเลิกสำหรับเจ้าของ (" + foundOn + ": " + label + ")");

        /* ต้องยืนยันสองจังหวะ — กดปุ่มแรกแล้วยังต้องไม่ลบ */
        await cancelBtn.click();
        await canceller.waitForSelector('button:has-text("ยืนยันยกเลิกการจอง")', { timeout: 10000 });
        ok("ยกเลิกต้องยืนยันสองจังหวะ ไม่ลบทันทีที่กดปุ่มแรก");
        await shot(canceller, "05-cancel-confirm");

        await canceller.click('button:has-text("ไม่ยกเลิกแล้ว")');
        await canceller.waitForSelector('button:has-text("ยกเลิกการจองนี้")', { timeout: 10000 });
        ok("กด 'ไม่ยกเลิกแล้ว' ถอยกลับสู่สถานะเดิมได้");

        await canceller.click('button:has-text("ยกเลิกการจองนี้")');
        await canceller.click('button:has-text("ยืนยันยกเลิกการจอง")');
        await canceller.waitForTimeout(3000);
        await canceller.goto(BASE + "/calendar?date=" + foundOn);
        await canceller.waitForTimeout(1000);
        const after = await canceller.locator(blockSelector).count();
        if (after === before - 1) ok("ยกเลิกแล้วบล็อกหายจากปฏิทินจริง (" + before + " -> " + after + ")");
        else fail("ยกเลิกแล้วจำนวนบล็อกไม่ลด (" + before + " -> " + after + ")");
      }
    }

    if (cancelCtx) await cancelCtx.close();
  }

  // ---------- ตัวกรองความจุ: ช่วงต้องไม่ทับกันและครอบคลุมครบ ----------
  /*
   * ★ ตรวจด้วย "ผลรวมทุกช่วง = ทุกขนาด" ไม่ใช่เช็คทีละช่วงด้วยตัวเลขตายตัว
   *   เพราะสิ่งที่ commit นี้สัญญาไว้คือ ช่วงไม่ทับกัน และไม่มีความจุไหนตกร่อง
   *   สมการนี้พังทันทีถ้าผิดข้อใดข้อหนึ่ง และไม่ต้องแก้เทสต์เวลาข้อมูล seed เปลี่ยน
   */
  {
    await user.goto(BASE + "/rooms");
    const cards = user.locator("article.card");
    const capacityRoot = user.locator("div.select-root").first();

    await pickFromSelect(user, capacityRoot, "ความจุ: ทุกขนาด");
    await user.waitForTimeout(400);
    const total = await cards.count();

    const buckets = ["ไม่เกิน 20 คน", "21–40 คน", "41–100 คน", "มากกว่า 100 คน"];
    const perBucket = [];
    let sum = 0;
    for (const label of buckets) {
      await pickFromSelect(user, capacityRoot, label);
      await user.waitForTimeout(400);
      const n = await cards.count();
      perBucket.push(label + "=" + n);
      sum += n;
    }

    if (sum === total) {
      ok("ช่วงความจุไม่ทับกันและครบถ้วน: รวม " + sum + " = ทุกขนาด " + total + " (" + perBucket.join(", ") + ")");
    } else {
      fail("ช่วงความจุเพี้ยน: ผลรวมแต่ละช่วง " + sum + " != ทุกขนาด " + total + " (" + perBucket.join(", ") + ")");
    }
    /*
     * ★ ขอบ 20/21 คือจุดที่ off-by-one ชอบมาเกิด และเป็นบั๊กที่มองด้วยตาไม่เห็น
     *   เพราะห้องที่ตกร่องจะแค่ "ไม่โผล่" ไม่มี error อะไรให้จับ
     */
    await pickFromSelect(user, capacityRoot, "ไม่เกิน 20 คน");
    await user.waitForTimeout(400);
    const at20 = await user.locator("article.card:has-text('รองรับ 20 คน')").count();
    if (at20 === 1) ok("ห้องความจุ 20 พอดีอยู่ในช่วง 'ไม่เกิน 20 คน' (ขอบไม่หลุด)");
    else fail("ห้องความจุ 20 หายจากช่วง 'ไม่เกิน 20 คน' (เจอ " + at20 + ")");

    await shot(user, "06-capacity-filter");
  }

  // ---------- รายงานการใช้ห้อง (admin) ----------
  {
    await admin.goto(BASE + "/admin/reports");
    await admin.waitForSelector("h1:has-text('รายงานการใช้ห้องประชุม')", { timeout: 60000 });
    ok("/admin/reports เปิดได้สำหรับ admin");

    for (const heading of ["ภาพรวม", "แยกตามห้อง", "แยกตามหน่วยงาน"]) {
      if ((await admin.locator('h2:has-text("' + heading + '")').count()) > 0)
        ok('รายงานมีส่วน "' + heading + '"');
      else fail('รายงานไม่มีส่วน "' + heading + '"');
    }

    /*
     * ★ ห้องที่ไม่มีใครใช้ต้องยังอยู่ในตาราง (นับเป็น 0) ตามที่ room-usage.ts ตั้งใจไว้
     *   เทียบจำนวนแถวกับตัวหารของไทล์ "ห้องที่ถูกใช้จริง" (รูปแบบ ใช้จริง/ทั้งหมด)
     *   ถ้าวันหลังมีคนกรองแถวศูนย์ทิ้ง สองค่านี้จะไม่ตรงกันทันที
     */
    const roomRows = await admin.locator("table").first().locator("tbody tr").count();
    const tile = await admin.locator(".stat-tile:has-text('ห้องที่ถูกใช้จริง')").innerText();
    const denominator = Number((tile.match(/\/\s*(\d+)/) || [])[1]);
    if (roomRows > 0 && roomRows === denominator)
      ok("ตารางแยกตามห้องมี " + roomRows + " แถว ครบทุกห้องรวมห้องที่ไม่มีใครใช้");
    else
      fail("ตารางแยกตามห้องมี " + roomRows + " แถว แต่ไทล์บอกว่ามีทั้งหมด " + denominator + " ห้อง");

    await shot(admin, "07-usage-report");

    await admin.click('button:has-text("7 วันล่าสุด")');
    await admin.waitForTimeout(2500);
    if (admin.url().includes("from=")) ok("ปุ่มลัด '7 วันล่าสุด' เปลี่ยนช่วงผ่าน URL");
    else fail("ปุ่มลัดไม่เปลี่ยน URL (" + admin.url() + ")");

    /* ช่วงยาวเกินหนึ่งปีต้องขึ้นข้อความให้ผู้ใช้แก้เอง ไม่ใช่ทั้งหน้าล่ม */
    await admin.goto(BASE + "/admin/reports?from=2020-01-01&to=2026-12-31");
    await admin.waitForSelector("h1:has-text('รายงานการใช้ห้องประชุม')", { timeout: 60000 });
    if ((await admin.locator("text=ขอรายงานได้ครั้งละไม่เกิน").count()) > 0)
      ok("ช่วงเกิน 366 วันขึ้นข้อความเตือน และแถบเลือกวันยังอยู่");
    else fail("ช่วงเกิน 366 วันไม่ขึ้นข้อความเตือน");

    /* พารามิเตอร์วันที่มั่วต้องตกกลับค่าตั้งต้น ไม่ใช่ 500 (ดู safeISODateParam) */
    for (const bad of ["abc", "2026-02-30", "2026-13-45"]) {
      await admin.goto(BASE + "/admin/reports?from=" + bad + "&to=" + bad);
      const alive = await admin
        .waitForSelector("h1:has-text('รายงานการใช้ห้องประชุม')", { timeout: 60000 })
        .then(() => true)
        .catch(() => false);
      if (alive) ok('from/to = "' + bad + '" ตกกลับค่าตั้งต้น ไม่ทำให้หน้าล่ม');
      else fail('from/to = "' + bad + '" ทำให้หน้ารายงานล่ม');
    }
  }

  // ---------- หน้าแรก (ยังไม่ล็อกอิน): แถบสรุปห้อง ----------
  {
    const landingCtx = await browser.newContext();
    const landing = await landingCtx.newPage();
    landing.setDefaultNavigationTimeout(90000);
    landing.setDefaultTimeout(20000);
    await landing.goto(BASE + "/");
    const badge = landing.locator("text=จากห้องประชุมทั้งหมด");
    if ((await badge.count()) > 0) {
      const text = (await badge.first().innerText()).replace(/\s+/g, " ").trim();
      ok('หน้าแรกแสดงสรุปห้อง: "' + text + '"');
    } else {
      fail("หน้าแรกไม่มีแถบสรุปห้อง");
    }
    await landingCtx.close();
  }

  await browser.close();
  printSummary();
  if (results.some((r) => r.startsWith("FAIL"))) process.exitCode = 1;
}

main().catch((err) => {
  console.error("FATAL", err);
  printSummary();
  process.exit(1);
});
