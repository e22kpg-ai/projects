# Handoff — ระบบจองห้องประชุม

> เอกสารส่งต่อสำหรับ session ใหม่ เขียนเมื่อ 2 ก.ย. 2569
> อ่านคู่กับ [CLAUDE.md](CLAUDE.md) ซึ่งเป็นกติกาถาวรของโปรเจกต์ (ไฟล์นี้เป็นสถานะชั่วคราว ลบทิ้งได้เมื่อจบงาน)

---

## 1. โปรเจกต์นี้คืออะไร

ระบบจองห้องประชุมภายในองค์กร ภาษาไทยล้วน
**Next.js 16 (App Router) + React 19 · Turso/libSQL + Drizzle · Better Auth · Tailwind v4 ล้วน · zustand**
สถาปัตยกรรม **Hexagonal (Ports & Adapters)** เคร่งครัด — `src/core/` ห้าม import อะไรที่ผูก framework/infra

---

## 2. สถานะ ณ ตอนส่งมอบ (ตรวจสดแล้ว)

| คำสั่ง | ผล |
|---|---|
| `npm run typecheck` | ✅ ผ่าน |
| `npm run test` (vitest) | ✅ 4 ไฟล์ / 48 เทสต์ ผ่านหมด |
| `npm run lint` | ✅ ผ่าน 0 error (ตั้งแต่ commit `334d6f4`) |
| `npm run build` | ผ่าน (ตรวจครั้งล่าสุดก่อนงานรอบหลัง) |

### ✅ เรื่องที่เคลียร์ไปแล้ว (2 ก.ย. 2569 — เดิมเป็นหัวข้อ "ต้องจัดการก่อนอย่างอื่น")

1. **`_verify.tmp.js` ที่ root** → ย้ายเป็น `scripts/e2e-smoke.mjs` แปลง `require()` เป็น ESM
   (lint เขียวโดยไม่ต้องใส่ ignore) ผูก `npm run test:e2e` ให้แล้ว และลง `playwright` เป็น devDependency
   จริงๆ (ก่อนหน้านี้มีแต่ใน `node_modules` ไม่มีใน `package.json` — repo สะอาดๆ รันไม่ได้)
   สคริปต์ต้องรันคู่กับ `npm run dev` ที่เปิดค้างไว้ และ **เขียนของจริงลง DB** ใช้กับ dev DB เท่านั้น
   สกรีนช็อตลง `.e2e-shots/` (gitignore แล้ว) รายละเอียดอยู่ในหัวข้อ Tests ของ README
2. **working tree ที่ค้าง ~35 ไฟล์** → ถูก commit ไปหมดแล้วใน `1de68a8` รวมทั้ง
   `.github/workflows/ci.yml`, `.env.example` และ migration `0002_nice_manta.sql`
   ตอนนี้ working tree สะอาด

---

## 3. สิ่งที่ทำใน session ที่แล้ว (งาน redesign UI)

ผู้ใช้เลือกทิศทาง **A — Modern SaaS clean** จากหน้าเปรียบเทียบ 3 แบบ
(หน้าเปรียบเทียบยังอยู่: https://claude.ai/code/artifact/0e1ccb32-7be8-4159-b093-77116052e810 — เผื่ออยากย้อนดูแนว B/C)

### 3.1 ขยาย design system

เพิ่ม token ใหม่ 8 ตัว แต่แตะ `skins.css` แค่ **2 ตัว** เพราะ derive จากของเดิมไม่ได้จริง:

| Token | ทำไมต้องมี |
|---|---|
| `overlay` | backdrop ของ Modal ใช้ `bg-foreground/50` ไม่ได้ เพราะ `foreground` สลับขาว-ดำตามโหมด → dark mode จะได้ scrim สีขาวจ้าทั้งจอ |
| `card-raised` | พื้นของ popover/listbox/modal ที่ลอยเหนือ `.card` — ถ้าใช้ `bg-card` จะกลืนกันเหลือแค่เส้น border |

ที่เหลือเป็น token รูปทรง/ชั้น/จังหวะใน `theme.css` (`radius-tight`, `shadow-overlay`, `--ds-z-*`, `--ds-duration-fast`)

**ฟอนต์:** เปลี่ยน Geist → **IBM Plex Sans Thai** (`subsets: ["thai","latin"]`, 4 น้ำหนัก) + `line-height: 1.7`
เก็บ Geist Mono ไว้สำหรับตัวเลข/เวลา ก่อนหน้านี้โหลดแต่ latin subset ตัวไทยเลยตกไป fallback ของ OS

### 3.2 `src/components/ui/` — component library 30 ไฟล์

**เส้นแบ่งสำคัญ (เขียนไว้ใน CLAUDE.md แล้ว):**
- `Select` / `DatePicker` / `TimePicker` = **custom เต็ม** เพราะ native สไตล์ไม่ได้จริง
  → ทุกตัวซ่อน `<input type="hidden" name=...>` ไว้ข้างใน เพื่อให้ `FormData` ทำงานเหมือนเดิม
- `Checkbox` / `Radio` / `Switch` / `SegmentedControl` = **ห่อ native** ที่ซ่อนด้วย `sr-only` + `peer`
  → ได้ a11y + arrow-key roving + `form.reset()` + autofill มาฟรี ไม่ต้องเขียน JS คีย์บอร์ดเลย

**การตัดสินใจที่ไม่ชัดในตัวโค้ด — อย่าเปลี่ยนโดยไม่อ่านเหตุผลก่อน:**

| ไฟล์ | ตัดสินใจอะไร | เพราะอะไร |
|---|---|---|
| `use-anchored-position.ts` | portal ไป body + `position:fixed` และ **เขียนลง `element.style` ตรงๆ ไม่ผ่าน state** | `CalendarGrid` มี `overflow-x-auto` → absolute จะโดน clip / ถ้าเก็บใน state แล้ว React re-render ด้วยเหตุอื่นจะทับตำแหน่งที่คำนวณไว้ทิ้ง |
| `Modal.tsx` | **ไม่ใช้ `<dialog showModal()>`** ทั้งที่แถม focus trap มาฟรี | top-layer อยู่เหนือ z-index ทุกค่า → Toast ที่ควรลอยบน Modal จะโดนบังแก้ไม่ได้ |
| `Modal.tsx` | backdrop เป็น element แยก ไม่ใช่ `onClick` บน layer | ลากเลือกข้อความจากใน panel ออกไปปล่อยข้างนอก → `click` ยิงที่บรรพบุรุษร่วม → modal ปิดทิ้งกลางคัน |
| `use-dismiss.ts` | มี **stack ระดับ module** ให้ตัวบนสุดตอบ Esc คนเดียว | กด Esc ตอนเปิด Select ใน Modal ต้องปิดแค่ Select |
| `Select.tsx` | โฟกัสค้างที่ trigger ใช้ `aria-activedescendant` | ต้องมี `onPointerDown preventDefault` ที่ option ทุกตัว และ `onBlur` ต้องเช็ค `floatingRef` ไม่ใช่ `rootRef` (popover portal ออกไปแล้ว `relatedTarget` ไม่มีวันอยู่ใน root) |
| `DatePicker.tsx` | ใช้ **roving tabindex** ย้ายโฟกัสจริงเข้าตาราง (ต่างจาก Select) | grid pattern ต้องให้ SR อ่าน `aria-selected`/`aria-current` ของช่องที่โฟกัสจริง |
| `Tooltip.tsx` | ห่อด้วย `<span class="inline-flex">` แทนการส่ง `ref` ผ่าน `cloneElement` | eslint `react-hooks/refs` ห้ามยื่น ref ให้ฟังก์ชันตอน render — `aria-describedby` ยังส่งลงไปที่ตัวลูกที่โฟกัสได้จริง |
| `Button.tsx` | discriminated union บน `href` (ไม่ใช่ generic `as` / `asChild`) | โปรเจกต์เปิด typed routes — generic polymorphism ทำ inference ของ `href` พัง |

### 3.3 บั๊กที่แก้ไปแล้ว

- **`toISOString()` คำนวณวันที่ผิดไปหนึ่งวัน** (2 จุด) — แปลงเป็น UTC ก่อน ที่ไทย +07:00 ตอนตี 3 จะได้วันเมื่อวาน
  → ตอนนี้ใช้ `toISODate()` / `todayISO()` / `addDays()` จาก `ui/date-utils.ts` เท่านั้น
- `.select` ใส่ `appearance-none` แต่ไม่วาดลูกศรมาแทน (เหลือช่องว่าง `pr-8` เปล่า)
- `SignOutButton` ไม่มี `type` → default เป็น submit

---

## 4. งานที่มีในโค้ดเบสตอนนี้ นอกเหนือจากงาน UI

โค้ดเบสเดินหน้าไปไกลกว่างาน redesign แล้ว ส่วนพวกนี้ **ยังไม่ได้รีวิวในรอบที่แล้ว**:

- **Admin RBAC** — `src/app/admin/rooms`, `src/app/admin/users`, `admin-guards`, `room-admin.actions.ts`, `set-admin.ts`
- **Meeting detail fields** — `department`, `chairperson`, `dressCode` บน booking + `dress-code-options.ts`
  โผล่ทั้งใน Tooltip (hover) และ Modal (คลิก) ของ `BookingBlock`
- **`session.queries.ts`** — `requireUser()` / `getSessionUser()` (ห่อ `cache()`) ถูกเรียกในทุกหน้าที่ต้องล็อกอิน
  ปิดช่องเดิมที่ proxy เช็คแค่ *การมีอยู่* ของ cookie ไม่ได้ validate session
- **เทสต์ vitest** — 48 ตัวใน 4 ไฟล์ (`booking-overlap`, `create-booking.use-case`, `admin-guards`, `date-utils`)
  ตรึง `TZ=Asia/Bangkok` ใน config เพื่อให้ผลไม่เปลี่ยนตามเครื่อง
- **`.github/workflows/ci.yml`** — ยังไม่ commit
- `booking-rules.ts` ใน core, migration `0002_nice_manta.sql`

---

## 5. กติกาที่ห้ามพลาด (สรุปจาก CLAUDE.md)

1. **ห้ามแตะ `src/core/`** ด้วยเหตุผลเรื่องหน้าตา — เป็น pure TS ทิศทางพึ่งพาชี้เข้าหา core เสมอ
2. **ชื่อ field ใน `FormData`** (`roomId`, `title`, `date`, `startTime`, `endTime`, + field รายละเอียดใหม่)
   เป็นสัญญากับ `booking.actions.ts` — component ต้องปรับตัวเข้าหา
3. **`@theme` ต้อง `inline` และ top-level** ห้ามซ้อนใน `@media` (Tailwind v4 จะ hoist ออกมาแล้วค่า dark ทับ light เงียบๆ)
4. **token สีใหม่ต้องประกาศครบ 2 skin × light/dark แล้ว map ครบ 4 จุด** (`:root`, `@media`, `[data-theme="dark"]`, `@theme inline`)
5. **z-index / duration ใช้ Tailwind utility ไม่ได้** — v4 ไม่มี namespace ต้องเขียน `z-index: var(--ds-z-popover)` ดิบใน `index.css`
6. **คลาสที่จะถูก `@apply` ต่อ ต้องเป็น `@utility`** ไม่ใช่ `@layer components`
7. **ห้าม barrel export ใน `ui/`** (ยกเว้น `types.ts`) — barrel ที่ปน `"use client"` จะลาก client bundle ติดไปทั้งกอง
8. **helper module ห้ามใส่ `"use client"`** (`cx`, `types`, `date-utils`, `time-utils`, `Icons`, `Spinner`, `Button`)
   เพราะ Server Component อย่าง `CalendarGrid` ต้อง import ได้
9. **ห้าม `Intl.DateTimeFormat` ในข้อความที่ถูก SSR** — ICU ของ Node กับ browser คนละเวอร์ชันได้ → hydration mismatch
10. **`TZ` ตั้งบน Vercel ไม่ได้ (ชื่อสงวน) — `timezone-guard.ts` เป็นด่านจริง** เรียกจาก
    `instrumentation.ts` และ `seed.ts` entry point ใหม่ที่อ่านนาฬิกาต้องเรียก `ensureAppTimezone()` เอง
    ไม่งั้นทุกอย่างที่อิง "ตอนนี้" คลาด 7 ชม. แบบหลอกตา

---

## 6. งานที่ยังเปิดอยู่ / ข้อเสนอลำดับถัดไป

| ลำดับ | งาน |
|---|---|
| ~~1~~ | ✅ **เสร็จแล้ว** (`334d6f4`) — `_verify.tmp.js` ย้ายเป็น `scripts/e2e-smoke.mjs` lint เขียว working tree สะอาด ดูหัวข้อ 2 |
| 2 | **ตรวจ UI ด้วยตาจริง** — ยังไม่เคยทำ: เปิด `/styleguide` ไล่ 6 combination (skin corporate/forest × สว่าง/มืด/ตามระบบ) ดู contrast, focus ring, focus trap ของ Modal, DatePicker กดลูกศรข้ามเดือน |
| 3 | หน้า admin (`/admin/rooms`, `/admin/users`) ยังไม่ได้ผ่านรอบ redesign — ยังใช้ component เดิมอยู่บ้างหรือเปล่าต้องเช็ค |
| 4 | ยังไม่มีเทสต์ฝั่ง component (vitest ตั้งเป็น `environment: "node"` ไม่มี jsdom) — ถ้าจะเทสต์ Select/DatePicker ต้องเพิ่ม jsdom + testing-library ก่อน |
| 5 | ยังไม่มีหน้า "การจองของฉัน" และปุ่มยกเลิกการจอง (ตัดออกจาก scope รอบที่แล้วโดยตั้งใจ) |

---

## 7. วิธีตรวจงาน

```bash
npm run typecheck && npm run lint && npm run test    # เร็ว รันได้ทุกครั้ง
npm run build                                         # ช้ากว่า รันก่อน commit ใหญ่
npm run dev                                           # แล้วเปิด /styleguide
```

**เดินให้ครบ flow:** `/login` → `/rooms` → `/rooms/[id]/book` → จองสำเร็จ → เด้งกลับ `/rooms` พร้อม toast → `/calendar` เห็นการจองนั้น

**sweep หา design-system violation:**
```bash
rg -n "#[0-9a-fA-F]{3,8}\b|\b(text|bg|border|ring)-(red|green|blue|gray|slate|zinc|amber|yellow)-[0-9]{2,3}|\[[0-9]+(px|rem)\]" src/
```
ครั้งล่าสุดที่รัน: ไม่พบเลยสักจุด — ถ้าเจอแปลว่ามีของใหม่หลุดเข้ามา

**บัญชีทดสอบ (dev เท่านั้น):** `dev@example.com` / `devpassword123` — ถ้าล็อกอินไม่ได้ให้รัน `npm run db:seed` ก่อน
