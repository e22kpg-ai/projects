import type { Booking, NewBooking } from "@/core/domain/entities/booking";
import { findConflict } from "@/core/domain/services/booking-overlap";
import { isWithinBusinessHours } from "@/core/domain/booking-rules";
import {
  BookingConflictError,
  BookingInPastError,
  BookingOutsideBusinessHoursError,
  InvalidBookingRangeError,
  RoomNotFoundError,
} from "@/core/domain/errors";
import type { BookingRepository } from "@/core/ports/booking-repository.port";
import type { RoomRepository } from "@/core/ports/room-repository.port";
import type { Clock } from "@/core/ports/clock.port";

export interface CreateBookingDeps {
  bookings: BookingRepository;
  rooms: RoomRepository;
  clock: Clock;
}

export function makeCreateBooking(deps: CreateBookingDeps) {
  return async function createBooking(input: NewBooking): Promise<Booking> {
    /*
     * เช็ครูปแบบวันเวลาก่อนเป็นอันดับแรก
     * new Date("อะไรก็ไม่รู้") ให้ Invalid Date ซึ่งเปรียบเทียบยังไงก็ได้ false หมด
     * ถ้าไม่ดักตรงนี้มันจะรอดทั้งด่านช่วงเวลาและด่านชนกัน แล้วไปพังที่ driver เป็น 500 แทน
     */
    if (Number.isNaN(input.startTime.getTime()) || Number.isNaN(input.endTime.getTime())) {
      throw new InvalidBookingRangeError("รูปแบบวันที่หรือเวลาไม่ถูกต้อง");
    }

    if (input.endTime <= input.startTime) {
      throw new InvalidBookingRangeError();
    }

    if (input.startTime < deps.clock.now()) {
      throw new BookingInPastError();
    }

    if (!isWithinBusinessHours(input.startTime, input.endTime)) {
      throw new BookingOutsideBusinessHoursError();
    }

    const room = await deps.rooms.findById(input.roomId);
    if (!room) {
      throw new RoomNotFoundError(input.roomId);
    }

    const existing = await deps.bookings.findByRoomInRange(
      input.roomId,
      input.startTime,
      input.endTime,
    );
    if (findConflict(existing, input)) {
      throw new BookingConflictError();
    }

    // The adapter re-checks overlap inside its own transaction to close the
    // race-condition window between this check and the insert.
    return deps.bookings.create(input);
  };
}
