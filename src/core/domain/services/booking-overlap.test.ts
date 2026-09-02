import { describe, expect, it } from "vitest";
import { findConflict, overlaps, type TimeRange } from "./booking-overlap";

function range(start: string, end: string): TimeRange {
  return { startTime: new Date(start), endTime: new Date(end) };
}

describe("overlaps", () => {
  it("ถือว่าชนกันเมื่อเวลาคาบเกี่ยวกันบางส่วน", () => {
    expect(overlaps(range("2026-09-02T10:00", "2026-09-02T11:00"), range("2026-09-02T10:30", "2026-09-02T11:30"))).toBe(true);
  });

  it("ถือว่าชนกันเมื่อช่วงหนึ่งครอบอีกช่วงทั้งหมด", () => {
    expect(overlaps(range("2026-09-02T09:00", "2026-09-02T17:00"), range("2026-09-02T10:00", "2026-09-02T11:00"))).toBe(true);
  });

  /* กฎที่สำคัญที่สุดของทั้งระบบ: จองต่อกันพอดีต้องไม่นับว่าชน ไม่งั้นห้องจะว่างแต่จองไม่ได้ */
  it("จองต่อกันพอดี (10:00-11:00 กับ 11:00-12:00) ต้องไม่ชนกัน", () => {
    expect(overlaps(range("2026-09-02T10:00", "2026-09-02T11:00"), range("2026-09-02T11:00", "2026-09-02T12:00"))).toBe(false);
  });

  it("สลับลำดับ argument แล้วผลต้องเหมือนเดิม", () => {
    const a = range("2026-09-02T10:00", "2026-09-02T11:00");
    const b = range("2026-09-02T10:30", "2026-09-02T11:30");
    expect(overlaps(a, b)).toBe(overlaps(b, a));
  });

  it("คนละวันกันไม่ชน", () => {
    expect(overlaps(range("2026-09-02T10:00", "2026-09-02T11:00"), range("2026-09-03T10:00", "2026-09-03T11:00"))).toBe(false);
  });

  /*
   * ช่วงยาวศูนย์นาที = การถามว่า "ณ วินาทีนี้ทับกับอะไรอยู่ไหม"
   * list-rooms-with-status ใช้ท่านี้ตรงๆ (overlaps(booking, {now, now})) เพื่อดูว่าห้องไม่ว่าง
   * ถ้าเปลี่ยนให้คืน false ฟีเจอร์ "ว่าง/ไม่ว่างตอนนี้" จะพังทั้งหมดโดยไม่มี error
   */
  it("ช่วงยาวศูนย์นาทีที่อยู่กลางช่วงอื่น ถือว่าทับ (isBusyNow พึ่งพฤติกรรมนี้)", () => {
    expect(overlaps(range("2026-09-02T10:00", "2026-09-02T10:00"), range("2026-09-02T09:00", "2026-09-02T11:00"))).toBe(true);
  });

  it("วินาทีที่เริ่มประชุมพอดี ยังนับว่ายังไม่ทับ (ขอบเปิด)", () => {
    expect(overlaps(range("2026-09-02T10:00", "2026-09-02T11:00"), range("2026-09-02T10:00", "2026-09-02T10:00"))).toBe(false);
  });
});

describe("findConflict", () => {
  const existing = [
    range("2026-09-02T09:00", "2026-09-02T10:00"),
    range("2026-09-02T13:00", "2026-09-02T14:00"),
  ];

  it("คืนรายการแรกที่ชน", () => {
    expect(findConflict(existing, range("2026-09-02T13:30", "2026-09-02T15:00"))).toBe(existing[1]);
  });

  it("คืน undefined เมื่อไม่มีอะไรชน", () => {
    expect(findConflict(existing, range("2026-09-02T10:00", "2026-09-02T13:00"))).toBeUndefined();
  });

  it("รายการว่างไม่มีทางชน", () => {
    expect(findConflict([], range("2026-09-02T10:00", "2026-09-02T11:00"))).toBeUndefined();
  });
});
