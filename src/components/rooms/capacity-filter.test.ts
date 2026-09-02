import { describe, expect, it } from "vitest";
import { CAPACITY_OPTIONS, DEFAULT_CAPACITY, matchesCapacity } from "./capacity-filter";

/*
 * ตัวกรองความจุพังแบบไม่ส่งเสียง — ถ้าขอบช่วงคลาดไปหนึ่ง ห้องจะแค่ "ไม่โผล่"
 * ไม่มี error ไม่มี log และบน seed data ที่ห้องใหญ่สุดจุ 12 คนก็จะดูปกติดีทุกอย่าง
 * เทสต์ชุดนี้จึงยิงที่ตัวเลขขอบโดยตรง แทนที่จะเชื่อว่าอ่านตารางแล้วเห็นเอง
 */

/** ช่องที่มีช่วงจริง ไม่นับ "ทุกขนาด" ที่ตั้งใจให้ครอบคลุมทุกค่า */
const SIZED_BUCKETS = CAPACITY_OPTIONS.filter((option) => option.value !== "");

describe("matchesCapacity", () => {
  it.each([
    [1, "20"],
    [20, "20"],
    [21, "40"],
    [40, "40"],
    [41, "100"],
    [100, "100"],
    [101, "100+"],
    [500, "100+"],
  ])("ความจุ %i ต้องตกอยู่ในช่อง %s", (capacity, bucket) => {
    expect(matchesCapacity(capacity, bucket)).toBe(true);
  });

  it("ทุกความจุต้องเข้าได้ช่องเดียวเป๊ะๆ ไม่ตกร่องและไม่ทับกัน", () => {
    for (let capacity = 1; capacity <= 300; capacity += 1) {
      const hits = SIZED_BUCKETS.filter((option) => matchesCapacity(capacity, option.value));
      expect(hits.map((option) => option.value), `ความจุ ${capacity}`).toHaveLength(1);
    }
  });

  it('"ทุกขนาด" ต้องปล่อยผ่านทุกความจุ', () => {
    for (const capacity of [1, 20, 21, 100, 101, 9999]) {
      expect(matchesCapacity(capacity, "")).toBe(true);
    }
  });

  it("bucket ที่ไม่รู้จักต้องไม่กรองอะไรทิ้ง ดีกว่าโชว์หน้าเปล่า", () => {
    expect(matchesCapacity(8, "ค่าที่ไม่มีในตาราง")).toBe(true);
  });
});

describe("CAPACITY_OPTIONS", () => {
  /*
   * ถ้ามีคนสลับลำดับจนช่องแรกกลายเป็นช่วงใดช่วงหนึ่ง ผู้ใช้ที่เพิ่งเปิดหน้ามา
   * จะเจอห้องนอกช่วงนั้นถูกซ่อนทันทีทั้งที่ยังไม่ได้กดกรองอะไรเลย
   */
  it("ค่าตั้งต้นต้องเป็น \"ทุกขนาด\" เสมอ", () => {
    expect(DEFAULT_CAPACITY).toBe("");
  });

  it("ทุกช่องต้องมี value ไม่ซ้ำกัน", () => {
    const values = CAPACITY_OPTIONS.map((option) => option.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it("ทุกช่องต้องมีช่วงที่ min ไม่เกิน max", () => {
    for (const option of CAPACITY_OPTIONS) {
      expect(option.min, option.label).toBeLessThanOrEqual(option.max);
    }
  });
});
