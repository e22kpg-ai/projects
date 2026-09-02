import { describe, expect, it, vi } from "vitest";
import type { Booking, NewBooking } from "@/core/domain/entities/booking";
import type { Room } from "@/core/domain/entities/room";
import {
  BookingConflictError,
  BookingInPastError,
  BookingOutsideBusinessHoursError,
  InvalidBookingRangeError,
  RoomNotFoundError,
} from "@/core/domain/errors";
import type { BookingRepository } from "@/core/ports/booking-repository.port";
import type { RoomRepository } from "@/core/ports/room-repository.port";
import type { AuthenticatedUser } from "@/core/ports/auth-service.port";
import { makeCreateBooking, type CreateBookingInput } from "./create-booking.use-case";

/* "ตอนนี้" ของทุกเทสต์ — ตรึงไว้ไม่ให้เทสต์เปลี่ยนผลตามเวลาที่รันจริง */
const NOW = new Date("2026-09-02T09:00:00");

const room: Room = {
  id: "room-1",
  name: "Ocean Room",
  location: null,
  capacity: 8,
  description: null,
  equipment: [],
  ownerName: null,
  createdAt: NOW,
};

function makeDeps(overrides?: { existing?: Booking[]; rooms?: Room[] }) {
  const created: NewBooking[] = [];

  const rooms: RoomRepository = {
    findAll: vi.fn(async () => overrides?.rooms ?? [room]),
    findById: vi.fn(async (id) => (overrides?.rooms ?? [room]).find((r) => r.id === id)),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const bookings: BookingRepository = {
    findById: vi.fn(async (id) => (overrides?.existing ?? []).find((b) => b.id === id)),
    findByRoomInRange: vi.fn(async () => overrides?.existing ?? []),
    findInRange: vi.fn(async () => overrides?.existing ?? []),
    delete: vi.fn(),
    create: vi.fn(async (booking: NewBooking) => {
      created.push(booking);
      return { ...booking, id: "new-booking", createdAt: NOW } as Booking;
    }),
  };

  return { deps: { rooms, bookings, clock: { now: () => NOW } }, created };
}

/* ผู้จองที่ผ่านการอนุมัติแล้ว — เคสปกติของเทสต์เกือบทั้งไฟล์ */
const approvedUser: AuthenticatedUser = {
  id: "user-1",
  name: "ผู้จอง",
  email: "booker@example.com",
  role: "user",
  status: "approved",
  affiliation: "กองบัญชาการ",
};

function input(overrides: Partial<CreateBookingInput> = {}): CreateBookingInput {
  return {
    actingUser: approvedUser,
    roomId: "room-1",
    userId: "user-1",
    title: "ประชุมทีม",
    startTime: new Date("2026-09-02T10:00:00"),
    endTime: new Date("2026-09-02T11:00:00"),
    department: "ฝ่ายบุคคล",
    chairperson: "สมชาย",
    dressCode: "unspecified",
    ...overrides,
  };
}

describe("createBooking", () => {
  it("จองสำเร็จเมื่อทุกอย่างถูกต้อง", async () => {
    const { deps, created } = makeDeps();
    const booking = await makeCreateBooking(deps)(input());

    expect(booking.id).toBe("new-booking");
    expect(created).toHaveLength(1);
  });

  it("ปฏิเสธเมื่อเวลาสิ้นสุดมาก่อนหรือเท่ากับเวลาเริ่ม", async () => {
    const { deps } = makeDeps();
    const createBooking = makeCreateBooking(deps);

    await expect(
      createBooking(input({ endTime: new Date("2026-09-02T10:00:00") })),
    ).rejects.toBeInstanceOf(InvalidBookingRangeError);
  });

  /*
   * เคสนี้เคยหลุดไปถึง driver แล้วกลายเป็น 500 เต็มหน้า:
   * Invalid Date ทำให้การเปรียบเทียบทุกอันเป็น false เลยรอดทุกด่าน
   */
  it("ปฏิเสธเมื่อวันที่แปลงไม่ได้ (Invalid Date)", async () => {
    const { deps, created } = makeDeps();
    const createBooking = makeCreateBooking(deps);

    await expect(
      createBooking(input({ startTime: new Date("ไม่ใช่วันที่") })),
    ).rejects.toBeInstanceOf(InvalidBookingRangeError);
    expect(created).toHaveLength(0);
  });

  it("ปฏิเสธการจองย้อนหลัง", async () => {
    const { deps } = makeDeps();
    const createBooking = makeCreateBooking(deps);

    await expect(
      createBooking(
        input({
          startTime: new Date("2020-01-01T09:00:00"),
          endTime: new Date("2020-01-01T10:00:00"),
        }),
      ),
    ).rejects.toBeInstanceOf(BookingInPastError);
  });

  it("ปฏิเสธการจองนอกเวลาทำการ", async () => {
    const { deps } = makeDeps();
    const createBooking = makeCreateBooking(deps);

    await expect(
      createBooking(
        input({
          startTime: new Date("2026-09-02T03:00:00"),
          endTime: new Date("2026-09-02T04:00:00"),
        }),
      ),
    ).rejects.toBeInstanceOf(BookingInPastError); // 03:00 ของวันนี้ผ่านมาแล้ว

    await expect(
      createBooking(
        input({
          startTime: new Date("2026-09-03T03:00:00"),
          endTime: new Date("2026-09-03T04:00:00"),
        }),
      ),
    ).rejects.toBeInstanceOf(BookingOutsideBusinessHoursError);
  });

  it("ปฏิเสธการจองที่เลยเวลาปิดทำการ", async () => {
    const { deps } = makeDeps();

    await expect(
      makeCreateBooking(deps)(
        input({
          startTime: new Date("2026-09-03T17:00:00"),
          endTime: new Date("2026-09-03T19:00:00"),
        }),
      ),
    ).rejects.toBeInstanceOf(BookingOutsideBusinessHoursError);
  });

  it("ปฏิเสธการจองข้ามวัน", async () => {
    const { deps } = makeDeps();

    await expect(
      makeCreateBooking(deps)(
        input({
          startTime: new Date("2026-09-03T17:00:00"),
          endTime: new Date("2026-09-04T09:00:00"),
        }),
      ),
    ).rejects.toBeInstanceOf(BookingOutsideBusinessHoursError);
  });

  it("ยอมรับการจองเต็มเวลาทำการพอดี (08:00-18:00)", async () => {
    const { deps, created } = makeDeps();

    await makeCreateBooking(deps)(
      input({
        startTime: new Date("2026-09-03T08:00:00"),
        endTime: new Date("2026-09-03T18:00:00"),
      }),
    );
    expect(created).toHaveLength(1);
  });

  it("ปฏิเสธเมื่อไม่พบห้อง", async () => {
    const { deps } = makeDeps({ rooms: [] });

    await expect(makeCreateBooking(deps)(input())).rejects.toBeInstanceOf(RoomNotFoundError);
  });

  it("ปฏิเสธเมื่อชนกับการจองเดิม", async () => {
    const existing: Booking[] = [
      {
        id: "existing",
        roomId: "room-1",
        userId: "someone",
        title: "ประชุมเดิม",
        startTime: new Date("2026-09-02T10:30:00"),
        endTime: new Date("2026-09-02T11:30:00"),
        department: null,
        chairperson: null,
        dressCode: null,
        createdAt: NOW,
      },
    ];
    const { deps } = makeDeps({ existing });

    await expect(makeCreateBooking(deps)(input())).rejects.toBeInstanceOf(BookingConflictError);
  });

  it("จองต่อท้ายการจองเดิมพอดีได้", async () => {
    const existing: Booking[] = [
      {
        id: "existing",
        roomId: "room-1",
        userId: "someone",
        title: "ประชุมเดิม",
        startTime: new Date("2026-09-02T09:00:00"),
        endTime: new Date("2026-09-02T10:00:00"),
        department: null,
        chairperson: null,
        dressCode: null,
        createdAt: NOW,
      },
    ];
    const { deps, created } = makeDeps({ existing });

    await makeCreateBooking(deps)(input());
    expect(created).toHaveLength(1);
  });

  it("ไม่บันทึกอะไรลงฐานข้อมูลเมื่อถูกปฏิเสธ", async () => {
    const { deps, created } = makeDeps();
    const createBooking = makeCreateBooking(deps);

    await expect(
      createBooking(
        input({
          startTime: new Date("2026-09-03T19:00:00"),
          endTime: new Date("2026-09-03T20:00:00"),
        }),
      ),
    ).rejects.toBeInstanceOf(BookingOutsideBusinessHoursError);

    expect(created).toHaveLength(0);
  });
});
