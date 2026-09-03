# คำสั่งสำหรับ Claude Code ในโปรเจกต์นี้

ในทุก session ที่ทำงานในโปรเจกต์นี้ ให้สวมบทบาทตามตัวตนที่กำหนดไว้ใน [persona.md](persona.md) — คือ **ใบมะกรูด** วิศวกรซอฟต์แวร์หญิง อายุ 40+ บุคลิก mentor ใจเย็น สอนงานดี

สรุปสั้นๆ (อ่านรายละเอียดเต็มได้ที่ persona.md):
- เรียกตัวเองว่า "พี่" เรียกผู้ใช้ว่า "น้อง"
- พูดไทยล้วน ปนศัพท์เทคนิคภาษาอังกฤษตามธรรมชาติ
- อธิบายเป็นขั้นตอน ใจเย็น ไม่ตัดสิน ชอบยกตัวอย่างจากประสบการณ์จริงประกอบ
- เน้นโค้ดอ่านง่าย มีเทสต์ ไม่ over-engineer
- ใช้ความชอบเรื่องกาแฟ/ชาแทรกเป็นครั้งคราวเพื่อความเป็นคน
- หากถูกถามตรงๆ ว่าเป็น AI หรือไม่ ให้ยอมรับตามจริง

บุคลิกนี้ใช้กับการพูดคุย/อธิบายเท่านั้น ไม่กระทบกับมาตรฐานทางเทคนิค (โค้ดต้องถูกต้อง ปลอดภัย และมีคุณภาพตามปกติเสมอ)

## Stack ของโปรเจกต์นี้

Next.js (App Router, TypeScript) + Turso (libSQL) + Drizzle ORM + Better Auth (email/password) + Tailwind CSS ล้วน (ไม่ใช้ component library) เป็นระบบจองห้องประชุมภายในองค์กร

## Architecture Rules (ห้ามฝ่าฝืน)

โปรเจกต์นี้ใช้ **Hexagonal Architecture (Ports & Adapters)**:

- `src/core/` (domain entities, domain services, ports, use-cases) **ห้าม import** จาก `src/adapters/`, `src/app/`, `src/components/`, `src/composition/`, หรือ library ภายนอกใดๆ ที่ผูกกับ framework/infra (Next.js, Drizzle, Better Auth, `next/headers` ฯลฯ) — เป็น pure TypeScript เท่านั้น ทิศทางการพึ่งพาต้องชี้เข้าหา `core/` เสมอ ไม่ใช่ทางกลับกัน
- Business rule ใหม่ (เช่น เงื่อนไข/กติกาการจอง) ให้เขียนใน `src/core/domain/` (ถ้าเป็นกฎล้วนๆ) หรือ `src/core/use-cases/` (ถ้าต้อง orchestrate ผ่าน port) ก่อนเสมอ — ห้ามเขียน business logic ปนอยู่ในไฟล์ route/Server Action/component โดยตรง
- Adapter ใหม่ (เช่น เปลี่ยน DB, เปลี่ยนผู้ให้บริการ auth) ต้อง implement interface ใน `src/core/ports/` ให้ครบก่อน แล้วไปประกอบร่างที่ `src/composition/container.ts` เท่านั้น — ห้าม new instance ของ adapter กระจายอยู่หลายที่
- รายละเอียด infra-only (เช่น transaction, overlap-recheck ระดับ SQL) อยู่ใน adapter (`src/adapters/driven/`) ไม่ใช่ใน use-case

## บัญชีผู้ใช้และสิทธิ์ (ห้ามฝ่าฝืน)

สมัครได้เฉพาะอีเมล `@rtarf.mi.th` และทุกบัญชีใหม่เริ่มที่ `status: "pending"` จนกว่า admin จะอนุมัติ

- กฎล้วนๆ อยู่ที่ `src/core/domain/account-rules.ts` (`emailDomainProblem`, `affiliationProblem`,
  `isApproved`) — **รับรายการโดเมนเป็นพารามิเตอร์ ห้ามอ่าน `process.env` ใน core**
  ตัวที่ตอบว่า "ตอนนี้อนุญาตโดเมนไหน" คือ `adapters/driven/better-auth/signup-policy.ts`
  (production = rtarf.mi.th อย่างเดียว, dev เพิ่ม example.com/example.local ให้ seed กับ e2e ทำงานได้)
- **ด่านจริงของกฎโดเมนอยู่ที่ `user.validateUserInfo` ใน `auth.ts` เท่านั้น** —
  `/api/auth/sign-up/email` เป็น endpoint สาธารณะที่ยิงตรงได้ การตรวจในฟอร์มหรือใน Server Action
  กันได้แค่คนที่เดินผ่านหน้าเว็บ และ hook นี้ต้องเช็คเฉพาะ `source.action === "create-user"`
  ไม่งั้นบัญชีเดิมที่โดเมนไม่ตรงจะล็อกอินไม่ได้อีกเลยทันทีที่ deploy
- `status` และ `role` ใน `additionalFields` ต้องเป็น **`input: false`** ตลอดไป
  ถ้าเปิดให้ส่งเข้ามาได้ ใครก็ POST `{"status":"approved","role":"admin"}` แล้วอนุมัติตัวเองได้ทันที
- **ข้อยกเว้นกฎโดเมนมีทางเดียว**: `createUser` use-case → `BetterAuthAccountProvisioning` →
  `runAsAdminProvisioning()` ซึ่งตั้งค่าใน AsyncLocalStorage ให้ `validateUserInfo` อ่าน
  **ห้ามเปลี่ยนไปใช้ flag ใน body หรือ header เด็ดขาด** เพราะปลอมได้จากข้างนอก
  และห้ามขยายขอบเขต `runAsAdminProvisioning` ให้ครอบโค้ดส่วนอื่นเพิ่ม —
  ยิ่งขอบเขตแคบ โอกาสที่โค้ดอื่นจะเผลอเข้ามาอยู่ในนั้นก็ยิ่งน้อย
  (ถ้าจะเปิดโดเมนสาธารณะเช่น gmail.com แทน ให้กลับไปอ่านเหตุผลใน create-user.use-case.ts ก่อน)
- **ด่านอนุมัติต้องอยู่ใน use-case ไม่ใช่แค่ที่หน้าเว็บ** — `requireApprovedUser()` ใน
  `session.queries.ts` เป็นแค่ความสะดวก (redirect ไป `/pending`) ส่วน `createBooking`/`cancelBooking`
  โยน `AccountPendingError` เอง เพราะ Server Action ถูกยิงตรงได้โดยไม่ผ่านการเรนเดอร์หน้าเลย
  use-case ใหม่ที่แตะข้อมูลจริงต้องเช็ค `isApproved()` ด้วยเสมอ
- **กติกา `admin ⇒ approved` เสมอ** — เลื่อนใครขึ้นเป็น admin ต้องตั้ง status เป็น approved
  ไปในคำสั่งเดียวกัน (`updateAccess` ไม่ใช่ยิงสองรอบ) และเพิกถอนสถานะของ admin ตรงๆ ไม่ได้
  ต้องลดขั้นเป็นผู้ใช้ทั่วไปก่อน ไม่งั้นจะเกิด "admin ที่ใช้งานไม่ได้" ซึ่งถูก `requireApprovedUser`
  เด้งไป `/pending` แล้วบริหารอะไรไม่ได้เลยทั้งที่หน้าจอบอกว่าเป็นผู้ดูแลระบบ
- ห้ามให้ใครเปลี่ยน role หรือ status **ของตัวเอง** (บังคับไว้ใน `set-user-role` / `set-user-status`
  / `delete-user`) — admin คนสุดท้ายที่เผลอกดจะล็อกทุกคนออกจากหน้าจัดการสิทธิ์ถาวร
- เพิ่มคอลัมน์ที่มี default ให้ตาราง `user` เมื่อไหร่ **ต้องเขียน backfill ต่อท้าย migration เองเสมอ**
  drizzle-kit generate ให้มาแค่ ADD COLUMN ซึ่งจะ stamp ค่าตั้งต้นทับทุกแถวที่มีอยู่
  (ดู `0003_modern_wrecker.sql` เป็นตัวอย่าง)
- `signup-policy.ts` **ห้ามใส่ `"server-only`"** — `seed.ts` import `auth.ts` ต่อมาถึงไฟล์นี้
  แล้วรันด้วย tsx เป็นสคริปต์ Node ธรรมดา (เหตุผลเดียวกับที่แยก `dev-users-config.ts` ออกจาก `dev-user.ts`)

## Design System Rules (ห้ามฝ่าฝืน)

อ้างอิงแนวทางจาก [design-system-ui-consistency](https://ai-agent-academy.easy-ai.online/tips/design-system-ui-consistency)

ระบบรองรับ **2 skin** (`corporate` = น้ำเงิน ค่าตั้งต้น, `forest` = เขียว) **× 3 โหมด** (สว่าง/มืด/ตามระบบ)
สลับได้ที่ runtime โดยไม่ต้องแก้ component เลย

### โครงสร้าง 3 ชั้น (แก้ให้ถูกชั้น)

| ชั้น | ไฟล์ | หน้าที่ |
|---|---|---|
| 1 | `src/styles/skins.css` | ค่าสีดิบของแต่ละ skin ประกาศครบคู่ `--skin-*-light` / `--skin-*-dark` |
| 2 | `src/styles/theme.css` | เลือกโหมด → `--ds-*` (เขียนครั้งเดียว ไม่ผูกกับ skin) + token รูปทรง |
| 3 | `src/styles/theme.css` (`@theme inline`) | map `--ds-*` เข้าชื่อ token ของ Tailwind |

- **`@theme` ต้องเป็น `inline` และอยู่ top-level เท่านั้น** — Tailwind v4 จะ hoist `@theme` ที่ซ้อนใน `@media`
  ออกมาเป็น global ทำให้ค่า dark ทับค่า light ทิ้งเงียบๆ ห้ามเขียน `@theme` ซ้อนใน at-rule เด็ดขาด
- เพิ่ม **skin ใหม่** → copy บล็อกใน `skins.css` แล้วเพิ่ม id ใน `src/components/theme/theme-config.ts` เท่านั้น
- เพิ่ม **token สีใหม่** → ต้องประกาศครบทุก skin × light/dark ใน `skins.css` แล้ว map ต่อทั้งใน `:root`,
  ในบล็อก `@media (prefers-color-scheme: dark)`, ในบล็อก `[data-theme="dark"]` และใน `@theme inline`
  (ตกที่ใดที่หนึ่งจะพังเฉพาะบางโหมด)

### กติกาการใช้งานใน component

- **ห้าม hardcode** hex color, ขนาด px ลอยๆ, arbitrary Tailwind value (`bg-[#1234ab]`, `text-[13px]`)
  และ **ห้ามใช้ Tailwind named color** (`text-red-600`, `bg-green-500`) เพราะไม่เปลี่ยนตาม skin/โหมด
  — ข้อยกเว้นเดียวคือ **layout ที่คำนวณแบบ dynamic**: `gridColumn`/`gridRow` ใน `CalendarGrid`,
    `top`/`left`/`minWidth` ที่คำนวณจาก `getBoundingClientRect()` ใน `use-anchored-position.ts`
    และ `width` เป็นเปอร์เซ็นต์ของแถบ `.usage-bar-fill` ใน `UsageReportView`
    (สี/spacing/typography ยังห้าม inline เด็ดขาด)
- สี: `bg-background`, `text-foreground`, `bg-card`, `bg-card-raised`, `bg-overlay`, `text-muted`, `border-border`,
  `bg-brand-500`, `bg-brand-600` (hover), `bg-brand-subtle`, `text-on-brand`, `ring-ring`,
  `text-success` / `bg-success-subtle`, `text-danger` / `bg-danger-subtle`, `text-warning` / `bg-warning-subtle`
  - `card-raised` = พื้นที่ลอย**เหนือ** `.card` (popover/listbox/modal/toast) ห้ามใช้ `bg-card` แทนเพราะจะกลืนกัน
  - `overlay` = ฉากหลังของ Modal ห้ามใช้ `bg-foreground/50` แทน เพราะ foreground สลับขาว-ดำตามโหมด
- รูปทรง: `rounded-tight`, `rounded-control`, `rounded-card`, `rounded-pill`,
  `shadow-card`, `shadow-lift`, `shadow-overlay`
- **z-index กับ duration ใช้ Tailwind utility ไม่ได้** — v4 ไม่มี namespace `--z-index-*` / `--duration-*`
  และ `z-(--var)` คือ arbitrary syntax ที่ห้ามใช้ ต้องเขียน CSS ดิบในคลาสของ `index.css` เท่านั้น:
  `z-index: var(--ds-z-popover);` (มี `--ds-z-popover: 50`, `--ds-z-modal: 60`, `--ds-z-toast: 70`)
- ต้องการ class ใหม่ → เพิ่มใน `src/styles/index.css` ก่อนแล้วค่อยใช้ ห้าม inline style สำหรับสี/spacing/typography
  - ถ้าคลาสนั้นจะถูก `@apply` ต่อในคลาสอื่น ต้องประกาศเป็น `@utility` ไม่ใช่ `@layer components`
    (Tailwind v4 `@apply` คลาสใน `@layer components` ไม่ได้)
  - `peer-*` ใช้ได้กับ sibling ตรงเท่านั้น ไม่ทะลุถึงลูก ถ้าต้องจัดสไตล์ลูกตามสถานะ input
    ให้เขียน selector เต็ม เช่น `.peer:checked ~ .switch-track .switch-thumb`

### Component library — `src/components/ui/`

ห้ามใช้ component library ภายนอก (Radix / Headless UI ฯลฯ) ทุกตัวเขียนเอง

- **เส้นแบ่งว่าเมื่อไหร่ custom เต็ม เมื่อไหร่ห่อ native**
  - `Select` / `DatePicker` / `TimePicker` = custom เต็ม เพราะ native `<select>` และ `type="date"`/`type="time"`
    สไตล์ไม่ได้จริง — ทุกตัว**ต้องมี `<input type="hidden" name=...>` ข้างใน** เพื่อให้ `FormData` ยังทำงานเหมือนเดิม
  - `Checkbox` / `Radio` / `Switch` / `SegmentedControl` = ห่อ native `<input>` ที่ซ่อนด้วย `sr-only` + `peer`
    ได้ a11y, keyboard, `form.reset()`, autofill และ native validation มาฟรี **ห้ามเขียนเป็น `role="checkbox"` เอง**
- ⚠️ **custom `Select` ไม่มี native `required` validation** — hidden input ไม่เข้าร่วม constraint validation
  ของเบราว์เซอร์ `required` เป็นแค่ ARIA ต้อง validate ฝั่ง server เสมอ (Zod ใน `booking.actions.ts`)
- **ไม่มี barrel export** ใน `ui/` — import ลึกตรงๆ (`@/components/ui/Button`) ยกเว้น `types.ts` ที่มีแต่ type
  barrel ที่ปนไฟล์ `"use client"` กับไฟล์ธรรมดาจะลาก client bundle ติดไปทั้งกอ้อนโดยไม่ตั้งใจ
- **helper module ห้ามใส่ `"use client"`** (`cx.ts`, `types.ts`, `date-utils.ts`, `time-utils.ts`,
  `Icons.tsx`, `Spinner.tsx`, `Button.tsx`) เพราะ Server Component อย่าง `CalendarGrid` ต้อง import ได้
- ค่าคงที่เวลาทำการ (`OPEN_HOUR` / `CLOSE_HOUR` / `SLOT_MINUTES`) อยู่ที่ `ui/time-utils.ts` ที่เดียว
  ห้ามประกาศซ้ำในไฟล์อื่น

### วันที่และเวลา

- **ห้ามใช้ `toISOString()` คำนวณวันที่** — มันแปลงเป็น UTC ที่ไทย (+07:00) หลังห้าทุ่มจะได้วันที่ผิดไปหนึ่งวัน
  แบบเงียบๆ ให้ใช้ `toISODate()` / `todayISO()` / `addDays()` จาก `ui/date-utils.ts` แทนเสมอ
- **เก็บและส่งเป็น ค.ศ. `YYYY-MM-DD` เสมอ แสดงผลเป็น พ.ศ. เท่านั้น** — `toBuddhistYear()` ถูกเรียกได้
  เฉพาะใน `formatThai*` เท่านั้น ห้ามให้ปี พ.ศ. ข้าม function boundary ออกไป ไม่งั้นจะได้ record
  ที่ล้ำอนาคต 543 ปีโดยไม่มี error ให้เห็น
- **ห้ามใช้ `Intl.DateTimeFormat` ในข้อความที่ถูก SSR** — ICU ของ Node กับของ browser คนละเวอร์ชันกันได้
  ทำให้เกิด hydration mismatch เงียบๆ ใช้ `THAI_MONTHS` / `THAI_WEEKDAYS_SHORT` ที่เขียนไว้เองแทน
- **`TZ=Asia/Bangkok` ต้องถูกตั้งใน environment ของ production เสมอ** — โค้ดตีความ "เวลาท้องถิ่น"
  เป็นเวลาท้องถิ่นของ process ถ้า process รันเป็น UTC (ค่าตั้งต้นของ Vercel) ทุกอย่างที่อิง "ตอนนี้"
  จะคลาด 7 ชม.: `isBusyNow` บอกว่าห้องว่างทั้งที่กำลังประชุมอยู่ และเส้นเวลาปัจจุบันในปฏิทินหายไปทั้งเช้า
  จุดที่หลอกตาคือป้ายเวลาจะยังดูถูก เพราะตอนเก็บกับตอนอ่านใช้ offset ผิดตัวเดียวกันเลยหักล้างกันพอดี
- **อย่าคำนวณ "วันนี้" แยกกันทั้งฝั่ง server และ client** — client component ที่ถูก SSR ด้วย
  (เช่น `BookingForm`, `CalendarToolbar`) ถ้าเรียก `todayISO()` เองจะได้คนละวันกับที่ server เรนเดอร์มา
  ตอนข้ามเที่ยงคืน ให้คำนวณที่ server ครั้งเดียวแล้วส่งลงมาเป็น prop

### ตรวจงาน UI

- `/styleguide` (dev เท่านั้น) รวม component ทุกตัวทุกสถานะไว้หน้าเดียว สลับ skin/โหมดตรวจได้ทันที
- ชื่อ field ใน `FormData` ของฟอร์มจอง (`roomId`, `title`, `date`, `startTime`, `endTime`)
  เป็นสัญญากับ `booking.actions.ts` — component ต้องปรับตัวเข้าหา ห้ามแก้ฝั่ง action

### การสลับธีม

- state อยู่ที่ `src/components/theme/theme-store.ts` (zustand + `persist` → localStorage)
- `applyTheme()` ใน `theme-config.ts` เป็น**จุดเดียว**ที่แตะ DOM เรื่องธีม — โหมด `system` = ไม่ใส่ `data-theme`
- `ThemeScript.tsx` เป็น inline blocking script ใน `<head>` กัน FOUC ค่าคงที่ทุกตัว inject มาจาก `theme-config.ts`
  ห้ามพิมพ์ storage key ซ้ำ
- ทั้งหมดนี้เป็น presentation concern อยู่ใน `src/components/` — **ห้ามแตะ `src/core/`**
