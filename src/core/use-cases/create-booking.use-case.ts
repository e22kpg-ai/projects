import type { Booking, NewBooking } from "@/core/domain/entities/booking";
import { findConflict } from "@/core/domain/services/booking-overlap";
import { isWithinBusinessHours } from "@/core/domain/booking-rules";
import { isApproved } from "@/core/domain/account-rules";
import {
  AccountPendingError,
  BookingConflictError,
  BookingInPastError,
  BookingOutsideBusinessHoursError,
  InvalidBookingRangeError,
  RoomNotFoundError,
} from "@/core/domain/errors";
import type { BookingRepository } from "@/core/ports/booking-repository.port";
import type { RoomRepository } from "@/core/ports/room-repository.port";
import type { Clock } from "@/core/ports/clock.port";
import type { AuthenticatedUser } from "@/core/ports/auth-service.port";

/**
 * ข้อมูลการจอง บวกกับ "ใครเป็นคนกด"
 *
 * ★ ต้องรับ actingUser เข้ามา ไม่ใช่ดูแค่ userId ที่อยู่ใน NewBooking อยู่แล้ว
 *   เพราะ userId บอกได้แค่ว่าจะบันทึกเป็นของใคร ไม่ได้บอกว่าคนนั้นได้รับอนุมัติหรือยัง
 */
export interface CreateBookingInput extends NewBooking {
  actingUser: AuthenticatedUser;
}

export interface CreateBookingDeps {
  bookings: BookingRepository;
  rooms: RoomRepository;
  clock: Clock;
}

export function makeCreateBooking(deps: CreateBookingDeps) {
  return async function createBooking(input: CreateBookingInput): Promise<Booking> {
    /*
     * ★ ด่านแรกสุดคือ "ได้รับอนุมัติหรือยัง" ก่อนตรวจอะไรทั้งสิ้น
     *
     *   คนที่ยังไม่ถูกอนุมัติไม่ควรได้ error เรื่องเวลาหรือห้องชนกลับไปเลย เพราะนั่นเท่ากับ
     *   ยืนยันให้เขารู้ว่าห้องไหนว่างช่วงไหน ทั้งที่ยังไม่มีสิทธิ์เห็นข้อมูลนั้น
     *
     *   หน้าเว็บกันไว้อีกชั้นด้วยการ redirect ไป /pending แต่ด่านจริงอยู่ที่นี่
     *   เพราะ use-case ถูกเรียกจากทางอื่นได้ (สคริปต์ งานนำเข้าข้อมูล)
     *
     * (destructure actingUser ออกด้วยเลย — มันเป็นบริบทของการเรียก ไม่ใช่คอลัมน์ในตาราง)
     */
    const { actingUser, ...booking } = input;
    if (!isApproved(actingUser)) {
      throw new AccountPendingError();
    }

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
    return deps.bookings.create(booking);
  };
}
