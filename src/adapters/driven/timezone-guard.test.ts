import { describe, expect, it } from "vitest";
import { APP_TIMEZONE, timezoneProblem } from "./timezone-guard";

/*
 * ด่านนี้มีไว้กันความผิดพลาดที่ "ไม่มีอาการ" — ถ้ามันเองพังเงียบๆ ก็ไม่เหลืออะไรกันแล้ว
 * เทสต์จึงยืนยันว่ามันไม่ปล่อยผ่าน timezone ที่ผิด และไม่ตีความค่าที่ถูกว่าผิด
 */
describe("timezoneProblem", () => {
  it("timezone ที่ถูกต้องต้องไม่มีปัญหา", () => {
    expect(timezoneProblem(APP_TIMEZONE)).toBeNull();
  });

  it.each(["UTC", "Etc/UTC", "America/New_York", "Asia/Tokyo", "Asia/Jakarta"])(
    "timezone อื่น (%s) ต้องถูกจับได้",
    (tz) => {
      expect(timezoneProblem(tz)).toContain(tz);
    },
  );

  /*
   * Asia/Bangkok กับ Asia/Jakarta เป็น +07:00 เท่ากันทั้งคู่ในทางปฏิบัติ
   * แต่เราตรวจชื่อ ไม่ใช่ offset เพราะ offset ที่บังเอิญตรงกันวันนี้
   * ไม่ได้รับประกันว่าจะตรงกันตลอดไป
   */
  it("อ่านค่าไม่ได้ก็ถือว่าเป็นปัญหา ไม่ใช่ปล่อยผ่าน", () => {
    expect(timezoneProblem(undefined)).not.toBeNull();
    expect(timezoneProblem("")).not.toBeNull();
  });
});
