import { describe, expect, it } from "vitest";
import { MAX_ROOM_CAPACITY, capacityProblem } from "./room-rules";

/*
 * เพดานความจุถูกเขียนไว้สามที่ — core, zod ฝั่ง action และ max ของ input ในฟอร์ม
 * ทั้งสามอ้าง MAX_ROOM_CAPACITY ตัวเดียวกัน เทสต์นี้เฝ้าค่านั้นและขอบของมัน
 */
describe("capacityProblem", () => {
  it.each([1, 8, 250, MAX_ROOM_CAPACITY])("ความจุ %i ใช้ได้", (capacity) => {
    expect(capacityProblem(capacity)).toBeNull();
  });

  it.each([0, -1, -500])("ความจุ %i ต้องถูกปฏิเสธ", (capacity) => {
    expect(capacityProblem(capacity)).toBe("ความจุต้องมากกว่า 0");
  });

  /* ขอบบนพอดีเป๊ะต้องผ่าน เกินไปหนึ่งต้องไม่ผ่าน */
  it("เกินเพดานไปหนึ่งคนก็ไม่ผ่าน", () => {
    expect(capacityProblem(MAX_ROOM_CAPACITY)).toBeNull();
    expect(capacityProblem(MAX_ROOM_CAPACITY + 1)).toContain(String(MAX_ROOM_CAPACITY));
  });

  it.each([4.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "ค่าที่ไม่ใช่จำนวนเต็ม (%s) ต้องถูกปฏิเสธ",
    (capacity) => {
      expect(capacityProblem(capacity)).toBe("ความจุต้องเป็นจำนวนเต็ม");
    },
  );
});
