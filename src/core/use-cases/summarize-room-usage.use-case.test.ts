import { describe, expect, it, vi } from "vitest";
import type { Booking } from "@/core/domain/entities/booking";
import type { Room } from "@/core/domain/entities/room";
import { ForbiddenError, InvalidDateRangeError } from "@/core/domain/errors";
import type { AuthenticatedUser } from "@/core/ports/auth-service.port";
import type { BookingRepository } from "@/core/ports/booking-repository.port";
import type { RoomRepository } from "@/core/ports/room-repository.port";
import { makeSummarizeRoomUsage } from "./summarize-room-usage.use-case";

/* "ตอนนี้" ตรึงไว้ที่บ่ายสองของวันที่ 2 ก.ย. */
const NOW = new Date("2026-09-02T14:00:00");

const admin: AuthenticatedUser = {
  id: "admin-1",
  name: "ผู้ดูแล",
  email: "a@x.com",
  role: "admin",
  status: "approved",
  affiliation: "กองบัญชาการ",
};
const normalUser: AuthenticatedUser = {
  id: "user-1",
  name: "ผู้ใช้",
  email: "u@x.com",
  role: "user",
  status: "approved",
  affiliation: "กองบัญชาการ",
};

const room: Room = {
  id: "room-1",
  name: "ห้องแก้วมังกร",
  location: null,
  capacity: 8,
  description: null,
  equipment: [],
  ownerName: null,
  createdAt: NOW,
};

function makeBooking(id: string, start: string, end: string): Booking {
  return {
    id,
    roomId: room.id,
    userId: "user-1",
    title: `ประชุม ${id}`,
    startTime: new Date(start),
    endTime: new Date(end),
    department: "ฝ่ายบุคคล",
    chairperson: "หัวหน้า",
    dressCode: "unspecified",
    createdAt: NOW,
  };
}

function makeDeps(bookings: Booking[]) {
  const rooms: RoomRepository = {
    findAll: vi.fn(async () => [room]),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const bookingRepo: BookingRepository = {
    findById: vi.fn(),
    findByRoomInRange: vi.fn(async () => []),
    findInRange: vi.fn(async () => bookings),
    create: vi.fn(),
    delete: vi.fn(),
  };

  return { rooms, bookings: bookingRepo, clock: { now: () => NOW } };
}

const SEPT = { from: new Date("2026-09-01T00:00:00"), to: new Date("2026-10-01T00:00:00") };

describe("summarizeRoomUsage", () => {
  it("คนที่ไม่ใช่ admin เรียกไม่ได้", async () => {
    const deps = makeDeps([]);

    await expect(
      makeSummarizeRoomUsage(deps)({ actingUser: normalUser, ...SEPT }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(deps.bookings.findInRange).not.toHaveBeenCalled();
  });

  /*
   * หัวใจของรายงาน: นับเฉพาะการประชุมที่จบไปแล้ว
   * ถ้านับการจองล่วงหน้าด้วย ตัวเลขจะพองกว่าความจริงและเปลี่ยนทุกครั้งที่กดดูซ้ำ
   * ซึ่งแย่ที่สุดสำหรับตัวเลขที่เอาไปรายงานต่อ
   */
  it("นับเฉพาะการประชุมที่จบไปแล้ว ไม่นับที่ยังมาไม่ถึงหรือกำลังประชุมอยู่", async () => {
    const deps = makeDeps([
      makeBooking("จบแล้ว", "2026-09-02T09:00:00", "2026-09-02T10:00:00"),
      makeBooking("กำลังประชุม", "2026-09-02T13:30:00", "2026-09-02T15:00:00"),
      makeBooking("ยังมาไม่ถึง", "2026-09-03T09:00:00", "2026-09-03T10:00:00"),
    ]);

    const report = await makeSummarizeRoomUsage(deps)({ actingUser: admin, ...SEPT });

    expect(report.totalBookings).toBe(1);
    expect(report.entries.map((e) => e.id)).toEqual(["จบแล้ว"]);
  });

  /* ขอบพอดีเป๊ะ: จบ ณ วินาทีนี้พอดี ถือว่าจบแล้ว — เกณฑ์เดียวกับตอนยกเลิกการจอง */
  it("การประชุมที่จบลงพอดีวินาทีนี้ นับเข้ารายงานแล้ว", async () => {
    const deps = makeDeps([makeBooking("พอดี", "2026-09-02T13:00:00", NOW.toString())]);

    const report = await makeSummarizeRoomUsage(deps)({ actingUser: admin, ...SEPT });

    expect(report.totalBookings).toBe(1);
  });

  it("เรียงรายการตามเวลาเริ่มจากเก่าไปใหม่", async () => {
    const deps = makeDeps([
      makeBooking("ที่สาม", "2026-09-02T11:00:00", "2026-09-02T12:00:00"),
      makeBooking("ที่หนึ่ง", "2026-09-01T09:00:00", "2026-09-01T10:00:00"),
      makeBooking("ที่สอง", "2026-09-02T09:00:00", "2026-09-02T10:00:00"),
    ]);

    const report = await makeSummarizeRoomUsage(deps)({ actingUser: admin, ...SEPT });

    expect(report.entries.map((e) => e.id)).toEqual(["ที่หนึ่ง", "ที่สอง", "ที่สาม"]);
  });

  it("ช่วงวันที่กลับหัวกลับหางต้องถูกปฏิเสธ", async () => {
    const deps = makeDeps([]);

    await expect(
      makeSummarizeRoomUsage(deps)({
        actingUser: admin,
        from: new Date("2026-09-30T00:00:00"),
        to: new Date("2026-09-01T00:00:00"),
      }),
    ).rejects.toBeInstanceOf(InvalidDateRangeError);
  });

  /* กันคนพิมพ์ปีผิดแล้วลากข้อมูลทั้งฐานออกมาโดยไม่ตั้งใจ */
  it("ช่วงที่ยาวเกินหนึ่งปีต้องถูกปฏิเสธ", async () => {
    const deps = makeDeps([]);

    await expect(
      makeSummarizeRoomUsage(deps)({
        actingUser: admin,
        from: new Date("2020-01-01T00:00:00"),
        to: new Date("2026-01-01T00:00:00"),
      }),
    ).rejects.toBeInstanceOf(InvalidDateRangeError);
  });

  it("นับจำนวนวันในช่วงได้ถูกต้อง", async () => {
    const deps = makeDeps([]);

    const report = await makeSummarizeRoomUsage(deps)({ actingUser: admin, ...SEPT });

    expect(report.daysInRange).toBe(30);
  });
});
