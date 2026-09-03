import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/*
 * กันไม่ให้ client component อ่านนาฬิกาของเครื่องผู้ใช้มาตัดสินใจ
 *
 * ★ ทำไมต้องมีเทสต์ ทั้งที่เขียนกฎไว้ในคอมเมนต์แล้ว:
 *   ตอนนี้กฎนี้อยู่ในคอมเมนต์ของ BookingForm กับ CalendarToolbar เท่านั้น
 *   ซึ่งกันคนลืมไม่ได้ ถ้าวันหลังมีคนเติม todayISO() เข้าไปในไฟล์ที่เป็น "use client"
 *   จะได้ hydration mismatch แบบเงียบๆ ตอนข้ามเที่ยงคืน — server เรนเดอร์วันหนึ่ง
 *   เครื่องผู้ใช้ hydrate อีกวันหนึ่ง ไม่มี error ให้เห็น มีแต่ตัวเลขที่ผิด
 *
 *   และเครื่องผู้ใช้ที่นาฬิกาเพี้ยนก็ให้ผลแบบเดียวกัน ซึ่งเราแก้ที่ต้นเหตุไม่ได้
 *   ทางที่คุมได้คือไม่เอานาฬิกาเครื่องเขามาใช้ตัดสินอะไรตั้งแต่แรก
 *   เวลาทุกอย่างต้องคำนวณที่ server แล้วส่งลงมาเป็น prop
 *
 * ★ ทำไมเป็นเทสต์ ไม่ใช่ ESLint rule:
 *   กฎนี้ใช้กับ "ไฟล์ที่มี directive use client" ซึ่งดูจากเนื้อไฟล์ ไม่ใช่จาก path
 *   ESLint เลือกไฟล์ด้วย glob จึงเขียนเงื่อนไขแบบนี้ตรงๆ ไม่ได้
 */

const SRC = path.resolve(import.meta.dirname, "..");

/*
 * ข้อยกเว้นต้องเขียนเหตุผลกำกับเสมอ การเติมชื่อไฟล์ลงตารางนี้จึงเป็นการตัดสินใจ
 * ที่มีคนอ่านเห็น ไม่ใช่การปิดเทสต์ให้ผ่านไปเงียบๆ
 */
const ALLOWED: Record<string, string> = {
  "components/ui/DatePicker.tsx":
    "ใช้ไฮไลต์ว่าช่องไหนคือวันนี้ในปฏิทิน popover และเลือกเดือนตั้งต้นตอนเปิด " +
    "เป็นเรื่องหน้าตาล้วน ค่าที่ส่งออกจากฟอร์มยังมาจาก value/min/max ที่ server กำหนด",
  "components/styleguide/StyleguideContent.tsx":
    "หน้า /styleguide เป็นเครื่องมือของทีมพัฒนา ปิดใน production อยู่แล้ว ไม่มีผู้ใช้จริงเห็น",
};

/** อ่านนาฬิกาเครื่องผู้ใช้ — ทั้งสามแบบให้ผลเหมือนกันหมด */
const CLOCK_CALLS = [/\bnew Date\(\s*\)/, /\bDate\.now\(\s*\)/, /\btodayISO\(\s*\)/];

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return listSourceFiles(full);
    return /\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry) ? [full] : [];
  });
}

/*
 * ตัดคอมเมนต์ทิ้งก่อนค้นหา ไม่งั้นคอมเมนต์ที่เขียนเตือนว่า "ห้ามเรียก todayISO() ที่นี่"
 * จะถูกนับเป็นการละเมิดกฎเสียเอง
 *
 * เช็ค `:` หน้า // เพื่อไม่ให้ตัด https:// ที่อยู่กลาง string ทิ้งไปทั้งบรรทัด
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function isClientComponent(source: string): boolean {
  return /^\s*["']use client["']/.test(source);
}

describe("client component ห้ามอ่านนาฬิกาของเครื่องผู้ใช้", () => {
  const offenders = listSourceFiles(SRC)
    .map((file) => ({ file, source: readFileSync(file, "utf8") }))
    .filter(({ source }) => isClientComponent(source))
    .map(({ file, source }) => ({
      relative: path.relative(SRC, file).split(path.sep).join("/"),
      code: stripComments(source),
    }))
    .filter(({ relative, code }) => !(relative in ALLOWED) && CLOCK_CALLS.some((re) => re.test(code)))
    .map(({ relative }) => relative);

  it("ไม่มีไฟล์ไหนเรียก new Date() / Date.now() / todayISO() นอกรายการยกเว้น", () => {
    expect(offenders).toEqual([]);
  });

  /* ถ้าไฟล์ในรายการยกเว้นเลิกใช้นาฬิกาไปแล้ว ต้องเอาชื่อออก ไม่ปล่อยให้ข้อยกเว้นค้างไว้ลอยๆ */
  it("ทุกไฟล์ในรายการยกเว้นยังมีอยู่จริงและยังใช้นาฬิกาอยู่จริง", () => {
    for (const relative of Object.keys(ALLOWED)) {
      const source = readFileSync(path.join(SRC, relative), "utf8");
      expect(isClientComponent(source), `${relative} ไม่ใช่ client component แล้ว`).toBe(true);
      expect(
        CLOCK_CALLS.some((re) => re.test(stripComments(source))),
        `${relative} ไม่ได้ใช้นาฬิกาแล้ว เอาออกจากรายการยกเว้นได้`,
      ).toBe(true);
    }
  });
});
