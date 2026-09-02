import { describe, expect, it } from "vitest";
import type { Booking } from "@/core/domain/entities/booking";
import { summarizeUsage } from "./room-usage";

/*
 * ตัวเลขจากรายงานนี้จะถูกเอาไปเสนอต่อ ผิดแล้วไม่มีใครจับได้ด้วยตาเปล่า
 * เทสต์จึงคุมทั้งการรวมยอด การจัดอันดับ และเคสขอบที่ทำให้เลขเพี้ยนแบบเงียบๆ
 */

const ROOMS = [
  { id: "room-a", name: "ห้องแก้วมังกร" },
  { id: "room-b", name: "ห้องลำไย" },
  { id: "room-c", name: "ห้องมะปราง" },
];

function booking(over: Partial<Booking> & { start: string; end: string }): Booking {
  return {
    id: over.id ?? `${over.start}-${over.roomId ?? "room-a"}`,
    roomId: over.roomId ?? "room-a",
    userId: "user-1",
    title: over.title ?? "ประชุม",
    startTime: new Date(over.start),
    endTime: new Date(over.end),
    /* เช็คด้วย `in` ไม่ใช่ `??` เพราะเคสที่ต้องทดสอบคือ department เป็น null จริงๆ */
    department: "department" in over ? (over.department ?? null) : "ฝ่ายบุคคล",
    chairperson: "หัวหน้า",
    dressCode: "unspecified",
    createdAt: new Date("2026-09-01T00:00:00"),
  };
}

/** 10 ชั่วโมงทำการต่อวัน (08:00–18:00) เท่ากับที่ booking-rules กำหนด */
const MINUTES_PER_DAY = 600;

describe("summarizeUsage", () => {
  it("รวมยอดและเฉลี่ยได้ถูกต้อง", () => {
    const summary = summarizeUsage({
      bookings: [
        booking({ start: "2026-09-01T09:00:00", end: "2026-09-01T10:00:00" }),
        booking({ start: "2026-09-01T13:00:00", end: "2026-09-01T14:30:00" }),
      ],
      rooms: ROOMS,
      daysInRange: 1,
      minutesPerDay: MINUTES_PER_DAY,
    });

    expect(summary.totalBookings).toBe(2);
    expect(summary.totalMinutes).toBe(150);
    expect(summary.averageMinutes).toBe(75);
    expect(summary.roomsUsed).toBe(1);
  });

  /*
   * ถ้าตัดแถวศูนย์ทิ้ง คนอ่านจะไม่มีทางรู้เลยว่ามีห้องที่ไม่มีใครใช้
   * ซึ่งเป็นข้อมูลที่มีค่าพอๆ กับห้องที่คนแย่งกัน
   */
  it("ห้องที่ไม่ถูกใช้เลยต้องยังอยู่ในรายงาน นับเป็นศูนย์", () => {
    const summary = summarizeUsage({
      bookings: [booking({ start: "2026-09-01T09:00:00", end: "2026-09-01T10:00:00" })],
      rooms: ROOMS,
      daysInRange: 1,
      minutesPerDay: MINUTES_PER_DAY,
    });

    expect(summary.byRoom).toHaveLength(3);
    expect(summary.roomsUsed).toBe(1);
    const unused = summary.byRoom.filter((r) => r.bookings === 0);
    expect(unused.map((r) => r.roomId).sort()).toEqual(["room-b", "room-c"]);
  });

  it("เรียงห้องตามเวลาที่ใช้จริงจากมากไปน้อย", () => {
    const summary = summarizeUsage({
      bookings: [
        booking({ roomId: "room-a", start: "2026-09-01T09:00:00", end: "2026-09-01T10:00:00" }),
        booking({ roomId: "room-b", start: "2026-09-01T09:00:00", end: "2026-09-01T12:00:00" }),
        booking({ roomId: "room-c", start: "2026-09-01T09:00:00", end: "2026-09-01T11:00:00" }),
      ],
      rooms: ROOMS,
      daysInRange: 1,
      minutesPerDay: MINUTES_PER_DAY,
    });

    expect(summary.byRoom.map((r) => r.roomId)).toEqual(["room-b", "room-c", "room-a"]);
  });

  it("อัตราการใช้งานคิดจากเวลาทำการทั้งช่วง ไม่ใช่แค่วันเดียว", () => {
    /* ใช้ไป 5 ชม. ในช่วง 2 วัน = 300 / (2 × 600) = 25% */
    const summary = summarizeUsage({
      bookings: [
        booking({ start: "2026-09-01T09:00:00", end: "2026-09-01T12:00:00" }),
        booking({ start: "2026-09-02T09:00:00", end: "2026-09-02T11:00:00" }),
      ],
      rooms: ROOMS,
      daysInRange: 2,
      minutesPerDay: MINUTES_PER_DAY,
    });

    expect(summary.byRoom[0].utilisationPercent).toBe(25);
  });

  it("ช่วงว่างเปล่าต้องไม่ทำให้หารศูนย์จนได้ NaN โผล่หน้าจอ", () => {
    const summary = summarizeUsage({
      bookings: [],
      rooms: ROOMS,
      daysInRange: 0,
      minutesPerDay: MINUTES_PER_DAY,
    });

    expect(summary.totalMinutes).toBe(0);
    expect(summary.averageMinutes).toBe(0);
    expect(summary.busiestDay).toBeNull();
    for (const row of summary.byRoom) {
      expect(Number.isNaN(row.utilisationPercent)).toBe(false);
      expect(row.utilisationPercent).toBe(0);
    }
  });

  it("จัดกลุ่มตามหน่วยงาน และเก็บการจองเก่าที่ไม่มีหน่วยงานไว้เป็นกลุ่มของตัวเอง", () => {
    const summary = summarizeUsage({
      bookings: [
        booking({ department: "ฝ่ายบุคคล", start: "2026-09-01T09:00:00", end: "2026-09-01T10:00:00" }),
        booking({ department: "ฝ่ายบุคคล", start: "2026-09-01T10:00:00", end: "2026-09-01T11:00:00" }),
        booking({ department: null, start: "2026-09-01T11:00:00", end: "2026-09-01T14:00:00" }),
      ],
      rooms: ROOMS,
      daysInRange: 1,
      minutesPerDay: MINUTES_PER_DAY,
    });

    /* หน่วยงาน null ใช้เวลามากกว่า จึงต้องมาก่อน และต้องไม่ถูกกลืนหายไป */
    expect(summary.byDepartment).toEqual([
      { department: null, bookings: 1, minutes: 180 },
      { department: "ฝ่ายบุคคล", bookings: 2, minutes: 120 },
    ]);
  });

  it("หาวันที่คึกคักที่สุดได้ และถ้าเท่ากันให้เอาวันที่มาก่อน", () => {
    const summary = summarizeUsage({
      bookings: [
        booking({ id: "1", start: "2026-09-02T09:00:00", end: "2026-09-02T10:00:00" }),
        booking({ id: "2", start: "2026-09-02T10:00:00", end: "2026-09-02T11:00:00" }),
        booking({ id: "3", start: "2026-09-01T09:00:00", end: "2026-09-01T10:00:00" }),
        booking({ id: "4", start: "2026-09-01T10:00:00", end: "2026-09-01T11:00:00" }),
      ],
      rooms: ROOMS,
      daysInRange: 2,
      minutesPerDay: MINUTES_PER_DAY,
    });

    expect(summary.busiestDay).toEqual({ date: "2026-09-01", bookings: 2 });
  });

  /*
   * วันที่ต้องคิดตามเวลาท้องถิ่น ถ้าเผลอไปใช้ toISOString() การประชุมช่วงค่ำของไทย
   * จะถูกนับเป็นของวันก่อนหน้า แล้ว "วันที่คึกคักที่สุด" จะชี้ผิดวันแบบเงียบๆ
   */
  it("การประชุมช่วงค่ำต้องถูกนับเป็นวันเดียวกับที่มันเกิดขึ้นจริง", () => {
    const summary = summarizeUsage({
      bookings: [booking({ start: "2026-09-01T17:00:00", end: "2026-09-01T18:00:00" })],
      rooms: ROOMS,
      daysInRange: 1,
      minutesPerDay: MINUTES_PER_DAY,
    });

    expect(summary.busiestDay?.date).toBe("2026-09-01");
  });
});

describe("ความละเอียดของอัตราการใช้งาน", () => {
  /*
   * เคสนี้มาจากของจริง: ดูรายงานทั้งปีแล้วทุกห้องขึ้น 0% ทั้งที่มีการใช้งานอยู่
   * เพราะปัดเป็นจำนวนเต็ม พอเห็นศูนย์ทั้งคอลัมน์คนอ่านก็เลิกเชื่อตัวเลขทันที
   */
  it("ช่วงยาวที่มีการใช้งานน้อย ต้องไม่ปัดลงเป็น 0 จนดูเหมือนไม่มีใครใช้", () => {
    const summary = summarizeUsage({
      bookings: [booking({ start: "2026-09-01T09:00:00", end: "2026-09-01T12:00:00" })],
      rooms: ROOMS,
      daysInRange: 365,
      minutesPerDay: MINUTES_PER_DAY,
    });

    /* 180 / (365 × 600) = 0.082% → ต้องได้ 0.1 ไม่ใช่ 0 */
    expect(summary.byRoom[0].utilisationPercent).toBe(0.1);
    expect(summary.byRoom[0].minutes).toBe(180);
  });

  it("ห้องที่ไม่ถูกใช้เลยยังต้องเป็น 0 เป๊ะๆ", () => {
    const summary = summarizeUsage({
      bookings: [],
      rooms: ROOMS,
      daysInRange: 365,
      minutesPerDay: MINUTES_PER_DAY,
    });

    expect(summary.byRoom.every((r) => r.utilisationPercent === 0)).toBe(true);
  });
});
