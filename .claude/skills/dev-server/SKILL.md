---
name: dev-server
description: เปิด ขับ และปิด dev server ของระบบจองห้องประชุมบน Windows รวมถึงวิธีเขียนสคริปต์ Playwright ขับหน้าจอเพื่อดูของจริง/เก็บภาพ ใช้เมื่อถูกขอให้รันแอป เปิดเบราว์เซอร์ดู ถ่ายภาพหน้าจอ ตรวจ skin/โหมด หรือรัน e2e
---

# รัน/ขับแอปในเครื่อง (Windows)

`npm run test:e2e` **ไม่สตาร์ท dev server ให้** ต้องเปิดเองค้างไว้ก่อนเสมอ
สคริปต์ขับหน้าจอที่เขียนเองก็เช่นกัน

## ⛔ ปิด server ให้ตายจริง — จุดที่พลาดกันบ่อยที่สุด

**`TaskStop` ฆ่าแค่ `npm` ที่ห่ออยู่ ตัว `next dev` รอดเป็น orphan เสมอ**
(ยืนยันแล้ว 3 ครั้งติดใน session เดียว: PID 6840 → 7164 → 6300)

อาการที่จะเจอถ้าไม่เก็บ: รอบถัดไป Next จะเด้ง exit 1 พร้อมข้อความ

```
⚠ Port 3000 is in use by process <pid>, using available port 3001 instead.
⨯ Another next dev server is already running.
```

แล้วสคริปต์ที่ยิงไป `localhost:3000` จะไปคุยกับ server **ตัวเก่า** ที่รันโค้ดเวอร์ชันก่อนหน้า
โดยไม่มีอะไรฟ้อง — ผลตรวจที่ได้จะดูปกติทั้งที่ไม่ได้ตรวจโค้ดใหม่เลย

ขั้นตอนปิดที่ถูก (เรียก `TaskStop` แล้วต้องตามด้วยอันนี้เสมอ):

```powershell
$c = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($null -ne $c) { $c.OwningProcess | Select-Object -Unique | ForEach-Object { Stop-Process -Id $_ -Force } }
Start-Sleep -Milliseconds 800
$d = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($null -eq $d) { "port 3000 free" } else { "STILL BUSY" }
```

**ต้องอ่านผลบรรทัดสุดท้ายให้เห็น `port 3000 free` ก่อนจะรายงานว่าปิดแล้ว**
ห้ามรายงานว่าปิดเสร็จเพียงเพราะสั่งปิดไปแล้ว

> หมายเหตุ: `Get-NetTCPConnection` ที่ไม่เจออะไรจะทำให้ tool คืน exit 1
> ให้รับผลใส่ตัวแปรแล้วเช็ค `$null` อย่างข้างบน อย่าปล่อยให้ error ลอย

## เปิด server แล้วรอให้พร้อมจริง

เปิดแบบ background แล้ว**รอ `Ready in` ในไฟล์ output** อย่าเดาเวลาด้วย sleep

```bash
# Bash tool, run_in_background: true (cwd เป็น root ของโปรเจกต์อยู่แล้ว ไม่ต้อง cd)
npm run dev 2>&1
```

```bash
# แล้วรอสัญญาณพร้อม (ชี้ไปที่ output file ของ task ข้างบน)
until grep -qE "Ready in" "<task-output-file>"; do sleep 1; done; echo ready
```

ยืนยันในบรรทัด `- Environments:` ว่าโหลด `.env.local` (ไม่ใช่ `.env.production.local`)

## ก่อนรันอะไรที่เขียนข้อมูล

`npm run test:e2e` และสคริปต์ที่กดปุ่มจริง **เขียนของจริงลง DB** (สมัครผู้ใช้ สร้าง/ลบห้อง จอง/ยกเลิก)

```bash
grep -i "TURSO_DATABASE_URL" .env.local   # ต้องขึ้นต้นด้วย file:
```

ถ้าไม่ใช่ `file:` ให้หยุด อย่ารัน
บัญชีทดสอบจะสะสมในหน้า `/admin/users` เรื่อยๆ ล้างด้วย `npm run db:seed -- --reset`

## เขียนสคริปต์ Playwright ขับหน้าจอ

### ⛔ วางสคริปต์ไว้ใน `scripts/` ของโปรเจกต์เสมอ

สคริปต์ที่วางไว้นอกโปรเจกต์ (เช่นใน scratchpad) จะ resolve `"playwright"` ไม่ได้
เพราะ Node ไล่หา `node_modules` ขึ้นไปตามลำดับชั้นของ**ไฟล์สคริปต์** ไม่ใช่ของ cwd:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'playwright' imported from ...\scratchpad\shots.mjs
```

**อย่าแก้ด้วยการ import ผ่าน path เต็มไปที่ `node_modules`** — มันผูกกับเครื่องคนเขียน
พอ commit ขึ้นไปแล้วเครื่องคนอื่นจะพังทันที ให้วางไฟล์ไว้ใน `scripts/` แล้ว import ปกติ:

```js
import { chromium } from "playwright";
```

`scripts/e2e-smoke.mjs` ทำแบบนี้อยู่แล้ว ใช้เป็นแม่แบบได้เลย
สคริปต์ที่เขียนขึ้นชั่วคราวก็วางที่นี่แล้วลบทิ้งตอนจบ (อย่าลืมเช็ค `git status` ก่อนรายงานว่าเสร็จ)

ถ้าต้องเขียนไฟล์ผลลัพธ์ (ภาพ/log) ให้อ้างจากตัวสคริปต์เองแทนการฝัง path เต็ม:

```js
const PROJECT = path.resolve(import.meta.dirname, "..");
```

เบราว์เซอร์ของ Playwright ติดตั้งไว้แล้ว ไม่ต้อง `npx playwright install` ซ้ำ

### ⛔ คลิก `<Link>` แล้วต้อง `waitForURL` เสมอ

Next.js นำทางฝั่ง client — `waitForLoadState("networkidle")` จะ resolve **ทันที**
เพราะ network ว่างอยู่แล้ว ภาพที่ถ่ายได้จึงเป็นหน้า**เดิม** แบบเหมือนกันทุกไบต์
และดูไม่ออกเลยว่าผิด

```js
await page.locator('a:has-text("จองห้องนี้")').first().click();
await page.waitForURL(/\/rooms\/[^/]+\/book/, { timeout: 120000 });  // ← ขาดไม่ได้
await page.waitForLoadState("networkidle").catch(() => {});
```

เช็คซ้ำได้ด้วยการดูขนาดไฟล์ภาพ — ภาพคนละหน้าที่ขนาดเท่ากันเป๊ะแปลว่าไม่ได้นำทางจริง

### ⛔ เก็บข้อความ console error ให้เต็ม ห้ามตัด

```js
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
page.on("pageerror", (e) => errs.push(`pageerror: ${e.message}`));
```

hydration mismatch ของ React บอกว่า attribute ไหนไม่ตรงใน**ท้ายข้อความ**
ถ้า `.slice(0, 200)` ทิ้งไปแล้ว หลักฐานหายถาวร และบั๊กแบบนี้มักไม่ซ้ำให้จับอีก

### ล็อกอินลัดในโหมด dev

```js
await page.goto(`${BASE}/login`);
await page.click('button:has-text("เข้าสู่ระบบ (ผู้ดูแลระบบ)")');
await page.waitForURL(`${BASE}/admin/users`, { timeout: 120000 });
```

ใช้บัญชีที่ `db:seed` ตั้ง `role=admin` ไว้แล้ว ไม่ต้องแก้ role ของใคร

### ตั้ง skin/โหมดก่อนโหลดหน้า

ยิงค่าเข้า localStorage ด้วย `addInitScript` ให้ `ThemeScript` อ่านเจอตั้งแต่ก่อน paint
รูปร่างข้อมูลเป็นของ zustand `persist` (key มาจาก `theme-config.ts`)

```js
await ctx.addInitScript(
  ([key, skin, mode]) =>
    localStorage.setItem(key, JSON.stringify({ state: { skin, mode }, version: 0 })),
  ["meeting-room-theme", "forest", "dark"],   // skin: corporate|forest, mode: light|dark|system
);
```

ยืนยันว่าติดจริงด้วยค่าที่คำนวณแล้ว ไม่ใช่แค่ดูภาพ:

```js
await page.evaluate(() => ({
  skin: document.documentElement.dataset.skin ?? null,
  theme: document.documentElement.dataset.theme ?? null,
  bg: getComputedStyle(document.body).backgroundColor,
}));
```

ทั้ง 4 คอมบิเนชันต้องได้ `bg` ต่างกันหมด ถ้าซ้ำกันแปลว่า token ตกไปชั้นใดชั้นหนึ่ง
หน้า `/styleguide` (dev เท่านั้น) รวม component ทุกตัวไว้หน้าเดียว เหมาะกับการตรวจ skin/โหมดที่สุด

## เกร็ดที่เสียเวลาไปแล้ว ไม่ต้องเสียซ้ำ

- `.next` เป็น build cache ที่ gitignore อยู่ ลบได้ปลอดภัย (`rm -rf .next`) เพื่อบังคับ compile เย็น
  — compile เย็นของ `/styleguide` ใช้เวลาราว 9 วินาที และ**ไม่**ทำให้เกิด hydration mismatch
  (เคยตั้งสมมติฐานนี้แล้วพิสูจน์ว่าผิด ไม่ต้องไล่ทางนี้อีก)
- `<html>` มี `suppressHydrationWarning` ครอบ `data-skin`/`data-theme` ไว้แล้วใน `layout.tsx`
  hydration warning ที่เจอจึงไม่ใช่เรื่องธีม
- `StyleguideContent` เรียก `todayISO()` ฝั่ง client โดย**ตั้งใจ** มีเหตุผลบันทึกไว้ใน
  `ALLOWED` ของ `src/components/no-client-clock.test.ts` ไม่ใช่ของหลุด อย่าเพิ่ง "แก้"
- เส้นเวลาปัจจุบันในปฏิทินขึ้นเฉพาะเมื่อ **กำลังดูวันนี้ และอยู่ในเวลาทำการ** เท่านั้น
  (`showNowLine` ใน `CalendarGrid.tsx` — `isToday && nowMinutes >= 0 && nowMinutes <= (CLOSE_HOUR - OPEN_HOUR) * 60`)
  ตรวจตอนเช้ามืดหรือดึกแล้วไม่เห็นเส้นจึงไม่ใช่บั๊ก ถ้าจะตรวจเส้นนี้จริงต้องตรวจในช่วง 08:00–18:00
- `/` เรนเดอร์หน้าเดียวกับ `/rooms` ภาพสองหน้านี้เหมือนกันเป็นเรื่องปกติ
