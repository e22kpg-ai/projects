import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  clampISODate,
  formatThaiLong,
  formatThaiShort,
  formatThaiMonthYear,
  isBefore,
  isOutOfRange,
  parseISODate,
  toISODate,
} from "./date-utils";

/*
 * CLAUDE.md บันทึกกับดักไว้สามข้อที่ "เคยกัดมาแล้ว" และมีแต่คอมเมนต์คุ้มกันอยู่:
 *   1. toISOString() ทำให้วันเลื่อนตอนดึก
 *   2. ปี พ.ศ. หลุดออกนอก formatThai*
 *   3. Intl.DateTimeFormat ทำให้ hydration ไม่ตรง
 * เทสต์ชุดนี้ตรึงข้อ 1 กับ 2 ไว้ (ข้อ 3 เป็นเรื่องโครงสร้าง ไม่ใช่ค่าที่เทียบได้)
 */

describe("toISODate", () => {
  it("ใช้เวลาท้องถิ่น ไม่ใช่ UTC — ตีสามยังต้องเป็นวันเดิม", () => {
    /* ถ้าเผลอไปใช้ toISOString() บรรทัดนี้จะได้ 2026-09-01 */
    expect(toISODate(new Date("2026-09-02T03:00:00"))).toBe("2026-09-02");
  });

  it("ห้าทุ่มก็ยังเป็นวันเดิม", () => {
    expect(toISODate(new Date("2026-09-02T23:30:00"))).toBe("2026-09-02");
  });

  it("เติมศูนย์ให้ครบสองหลัก", () => {
    expect(toISODate(new Date("2026-01-05T12:00:00"))).toBe("2026-01-05");
  });
});

describe("parseISODate / toISODate ไป-กลับ", () => {
  it("แปลงกลับไปกลับมาแล้วได้ค่าเดิม", () => {
    for (const iso of ["2026-01-01", "2026-02-28", "2026-12-31", "2028-02-29"]) {
      expect(toISODate(parseISODate(iso))).toBe(iso);
    }
  });
});

describe("addDays", () => {
  it("ข้ามเดือนได้ถูกต้อง", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
  });

  it("ข้ามปีได้ถูกต้อง", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("ถอยหลังได้", () => {
    expect(addDays("2026-09-01", -1)).toBe("2026-08-31");
  });

  it("ปีอธิกสุรทิน", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });
});

describe("addMonths", () => {
  it("สิ้นเดือนที่วันไม่มีในเดือนถัดไปต้องไม่ทะลุไปเดือนถัดๆ ไป", () => {
    /* 31 ม.ค. + 1 เดือน — ก.พ. ไม่มีวันที่ 31 ต้องได้วันสุดท้ายของ ก.พ. ไม่ใช่ 3 มี.ค. */
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
  });
});

describe("isBefore / clampISODate / isOutOfRange", () => {
  it("เทียบวันได้ถูกทาง", () => {
    expect(isBefore("2026-09-01", "2026-09-02")).toBe(true);
    expect(isBefore("2026-09-02", "2026-09-01")).toBe(false);
    expect(isBefore("2026-09-02", "2026-09-02")).toBe(false);
  });

  it("clamp เข้าขอบล่างและขอบบน", () => {
    expect(clampISODate("2026-08-01", "2026-09-01", "2026-09-30")).toBe("2026-09-01");
    expect(clampISODate("2026-10-01", "2026-09-01", "2026-09-30")).toBe("2026-09-30");
    expect(clampISODate("2026-09-15", "2026-09-01", "2026-09-30")).toBe("2026-09-15");
  });

  it("นอกช่วงคือนอกช่วงจริง ขอบถือว่าอยู่ในช่วง", () => {
    expect(isOutOfRange("2026-09-01", "2026-09-01", "2026-09-30")).toBe(false);
    expect(isOutOfRange("2026-09-30", "2026-09-01", "2026-09-30")).toBe(false);
    expect(isOutOfRange("2026-08-31", "2026-09-01", "2026-09-30")).toBe(true);
  });
});

describe("การแสดงผลปี พ.ศ.", () => {
  /* ค.ศ. 2026 = พ.ศ. 2569 — เลข พ.ศ. ต้องโผล่เฉพาะในข้อความที่ format แล้วเท่านั้น */
  it("formatThaiLong แสดงเป็น พ.ศ.", () => {
    expect(formatThaiLong("2026-09-02")).toContain("2569");
    expect(formatThaiLong("2026-09-02")).toContain("กันยายน");
  });

  it("formatThaiShort แสดงเป็น พ.ศ.", () => {
    expect(formatThaiShort("2026-09-02")).toContain("2569");
  });

  it("formatThaiMonthYear แสดงเป็น พ.ศ.", () => {
    expect(formatThaiMonthYear("2026-09-02")).toContain("2569");
  });

  it("ค่าที่ส่งต่อในระบบยังเป็น ค.ศ. เสมอ — พ.ศ. ต้องไม่รั่วออกมา", () => {
    expect(addDays("2026-09-02", 1)).toBe("2026-09-03");
    expect(toISODate(parseISODate("2026-09-02"))).toBe("2026-09-02");
  });
});
