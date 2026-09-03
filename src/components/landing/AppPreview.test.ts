import { describe, expect, it } from "vitest";
import { previewColumnCount } from "./AppPreview";

/*
 * บั๊กเดิมคือตาราง preview ตายตัวที่ 3 คอลัมน์ ส่วนแถบสรุปข้างๆ ดึงเลขจริงมาแสดง
 * หน่วยงานที่มี 2 ห้องจึงเห็นเลขสองตัวที่ขัดกันเองบนหน้าจอเดียว
 * เทสต์ชุดนี้ผูกไว้กับ "จำนวนห้องจริง" ไม่ใช่กับตัวเลขที่เขียนตายไว้
 */
describe("previewColumnCount", () => {
  it("มีห้องน้อยกว่าเพดาน ต้องได้คอลัมน์เท่าจำนวนห้องจริง", () => {
    expect(previewColumnCount(1)).toBe(1);
    expect(previewColumnCount(2)).toBe(2);
    expect(previewColumnCount(3)).toBe(3);
    expect(previewColumnCount(4)).toBe(4);
  });

  /*
   * เกินเพดานแล้วคอลัมน์จะแคบจนอ่านชื่อห้องไม่ออก ยอมตัดดีกว่า
   * แต่ยอมได้เพราะป้าย "ตัวอย่างหน้าจอ" บอกไว้แล้วว่านี่ไม่ใช่ข้อมูลจริง
   */
  it("มีห้องมากกว่าเพดาน ต้องตัดที่เพดาน ไม่ใช่วาดจนล้นกรอบ", () => {
    expect(previewColumnCount(5)).toBe(4);
    expect(previewColumnCount(40)).toBe(4);
  });

  /*
   * ★ null คือเคสที่เกิดจริงและเงียบที่สุด — หน้าแรกกลืน error ตอนดึงข้อมูลไว้
   *   เพื่อไม่ให้ DB ล่มแล้วทั้งหน้ากลายเป็น 500 ตอนนั้น preview ต้องยังวาดได้
   *   (และแถบสรุปตัวเลขจริงก็ถูกซ่อนไปด้วย จึงไม่มีเลขอะไรให้ขัดกัน)
   */
  it("ยังไม่รู้จำนวนห้อง ต้องมีค่าตั้งต้นให้วาดได้ ไม่ใช่ตารางเปล่า", () => {
    expect(previewColumnCount(null)).toBe(3);
  });

  it("ยังไม่มีห้องในระบบ ต้องไม่ได้ตารางที่ไม่มีคอลัมน์เลย", () => {
    expect(previewColumnCount(0)).toBe(3);
    expect(previewColumnCount(-1)).toBe(3);
  });

  /* ตัวเลขประหลาดไม่ควรทำให้ layout พัง เพราะนี่คือหน้าสาธารณะหน้าเดียวของระบบ */
  it("ค่าที่ไม่ใช่จำนวนเต็มบวกปกติ ต้องไม่ทำให้ตารางพัง", () => {
    expect(previewColumnCount(2.7)).toBe(2);
    expect(previewColumnCount(Number.NaN)).toBe(3);
    expect(previewColumnCount(Number.POSITIVE_INFINITY)).toBe(3);
  });
});
