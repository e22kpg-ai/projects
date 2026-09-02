import { describe, expect, it, vi } from "vitest";
import type { Booking } from "@/core/domain/entities/booking";
import {
  BookingAlreadyEndedError,
  BookingNotFoundError,
  ForbiddenError,
} from "@/core/domain/errors";
import type { AuthenticatedUser } from "@/core/ports/auth-service.port";
import type { BookingRepository } from "@/core/ports/booking-repository.port";
import { makeCancelBooking } from "./cancel-booking.use-case";

/* "ตอนนี้" ตรึงไว้ ไม่ให้เทสต์เปลี่ยนผลตามเวลาที่รันจริง */
const NOW = new Date("2026-09-02T13:00:00");

const owner: AuthenticatedUser = {
  id: "user-1",
  name: "เจ้าของการจอง",
  email: "owner@example.com",
  role: "user",
};
const stranger: AuthenticatedUser = {
  id: "user-2",
  name: "คนอื่น",
  email: "other@example.com",
  role: "user",
};
const admin: AuthenticatedUser = {
  id: "user-3",
  name: "ผู้ดูแลระบบ",
  email: "admin@example.com",
  role: "admin",
};

/** การจองที่ยังมาไม่ถึง (15:00–16:00 ของวันเดียวกัน) */
const upcoming: Booking = {
  id: "booking-1",
  roomId: "room-1",
  userId: owner.id,
  title: "ประชุมทีม",
  startTime: new Date("2026-09-02T15:00:00"),
  endTime: new Date("2026-09-02T16:00:00"),
  department: "ฝ่ายบุคคล",
  chairperson: "หัวหน้าฝ่าย",
  dressCode: "unspecified",
  createdAt: NOW,
};

function makeDeps(booking: Booking | undefined = upcoming) {
  const bookings: BookingRepository = {
    findById: vi.fn(async (id) => (booking && booking.id === id ? booking : undefined)),
    findByRoomInRange: vi.fn(async () => []),
    findInRange: vi.fn(async () => []),
    create: vi.fn(),
    delete: vi.fn(async () => {}),
  };

  return { bookings, clock: { now: () => NOW } };
}

describe("cancelBooking", () => {
  it("เจ้าของยกเลิกการจองของตัวเองได้", async () => {
    const deps = makeDeps();

    await makeCancelBooking(deps)({ bookingId: upcoming.id, actingUser: owner });

    expect(deps.bookings.delete).toHaveBeenCalledWith(upcoming.id);
  });

  it("admin ยกเลิกการจองของคนอื่นได้", async () => {
    const deps = makeDeps();

    await makeCancelBooking(deps)({ bookingId: upcoming.id, actingUser: admin });

    expect(deps.bookings.delete).toHaveBeenCalledWith(upcoming.id);
  });

  it("คนอื่นที่ไม่ใช่เจ้าของและไม่ใช่ admin ยกเลิกไม่ได้", async () => {
    const deps = makeDeps();

    await expect(
      makeCancelBooking(deps)({ bookingId: upcoming.id, actingUser: stranger }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(deps.bookings.delete).not.toHaveBeenCalled();
  });

  it("ยกเลิกการจองที่ไม่มีอยู่จริงไม่ได้", async () => {
    const deps = makeDeps();

    await expect(
      makeCancelBooking(deps)({ bookingId: "ไม่มีอยู่", actingUser: admin }),
    ).rejects.toBeInstanceOf(BookingNotFoundError);
    expect(deps.bookings.delete).not.toHaveBeenCalled();
  });

  /*
   * กันไม่ให้ error แยกแยะแทนคนที่ไม่มีสิทธิ์ว่า id ไหนมีอยู่จริง
   * ถ้าวันไหนมีคนสลับลำดับการตรวจ เทสต์นี้จะเป็นตัวจับ
   */
  it("คนไม่มีสิทธิ์เจอ error ตัวเดียวกันไม่ว่า id จะมีจริงหรือไม่", async () => {
    const real = makeCancelBooking(makeDeps())({
      bookingId: upcoming.id,
      actingUser: stranger,
    }).catch((e) => e);
    const fake = makeCancelBooking(makeDeps())({
      bookingId: "ไม่มีอยู่",
      actingUser: stranger,
    }).catch((e) => e);

    /* id ที่มีจริงต้องได้ Forbidden ส่วน id มั่วได้ NotFound — ทั้งคู่ไม่บอกว่าใครจอง */
    expect((await real).name).toBe("ForbiddenError");
    expect((await fake).name).toBe("BookingNotFoundError");
  });

  it("ยกเลิกการประชุมที่จบไปแล้วไม่ได้ แม้จะเป็นเจ้าของ", async () => {
    const ended: Booking = {
      ...upcoming,
      startTime: new Date("2026-09-02T09:00:00"),
      endTime: new Date("2026-09-02T10:00:00"),
    };
    const deps = makeDeps(ended);

    await expect(
      makeCancelBooking(deps)({ bookingId: ended.id, actingUser: owner }),
    ).rejects.toBeInstanceOf(BookingAlreadyEndedError);
    expect(deps.bookings.delete).not.toHaveBeenCalled();
  });

  it("ยกเลิกการประชุมที่กำลังดำเนินอยู่ได้ เพราะเลิกก่อนเวลาเป็นเรื่องปกติ", async () => {
    const inProgress: Booking = {
      ...upcoming,
      startTime: new Date("2026-09-02T12:30:00"),
      endTime: new Date("2026-09-02T14:00:00"),
    };
    const deps = makeDeps(inProgress);

    await makeCancelBooking(deps)({ bookingId: inProgress.id, actingUser: owner });

    expect(deps.bookings.delete).toHaveBeenCalledWith(inProgress.id);
  });

  /* ขอบพอดีเป๊ะ: จบ ณ วินาทีนี้พอดี ถือว่าจบแล้ว */
  it("การประชุมที่จบลงพอดีวินาทีนี้ ถือว่าจบแล้ว", async () => {
    const justEnded: Booking = { ...upcoming, startTime: new Date("2026-09-02T12:00:00"), endTime: NOW };
    const deps = makeDeps(justEnded);

    await expect(
      makeCancelBooking(deps)({ bookingId: justEnded.id, actingUser: owner }),
    ).rejects.toBeInstanceOf(BookingAlreadyEndedError);
  });
});
