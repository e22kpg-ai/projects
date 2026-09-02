import {
  BookingAlreadyEndedError,
  BookingNotFoundError,
  ForbiddenError,
} from "@/core/domain/errors";
import type { AuthenticatedUser } from "@/core/ports/auth-service.port";
import type { BookingRepository } from "@/core/ports/booking-repository.port";
import type { Clock } from "@/core/ports/clock.port";

export interface CancelBookingDeps {
  bookings: BookingRepository;
  clock: Clock;
}

export interface CancelBookingInput {
  bookingId: string;
  actingUser: AuthenticatedUser;
}

/*
 * ยกเลิกการจอง — เจ้าของการจองหรือ admin เท่านั้น
 *
 * ★ ลำดับการตรวจสำคัญ: เช็ค "มีจริงไหม" ก่อน "มีสิทธิ์ไหม" ก่อน "ยกเลิกทันไหม"
 *   ถ้าสลับเอา ForbiddenError ขึ้นก่อน คนที่ไม่มีสิทธิ์จะแยกออกทันทีว่า id ไหนมีอยู่จริง
 *   จากข้อความ error ที่ต่างกัน กลายเป็นช่องให้ไล่เดา id ได้
 *
 * ★ ห้ามยกเลิกการประชุมที่จบไปแล้ว เพราะนั่นคือการลบประวัติ ไม่ใช่การยกเลิก
 *   ส่วนการประชุมที่ "กำลังดำเนินอยู่" ยังยกเลิกได้ เพราะเลิกก่อนเวลาเป็นเรื่องปกติ
 *   และการคืนห้องให้คนอื่นจองต่อได้ทันทีคือประโยชน์ตรงๆ ของระบบนี้
 */
export function makeCancelBooking(deps: CancelBookingDeps) {
  return async function cancelBooking(input: CancelBookingInput): Promise<void> {
    const booking = await deps.bookings.findById(input.bookingId);
    if (!booking) {
      throw new BookingNotFoundError();
    }

    const isOwner = booking.userId === input.actingUser.id;
    if (!isOwner && input.actingUser.role !== "admin") {
      throw new ForbiddenError("ยกเลิกได้เฉพาะการจองของตัวเอง");
    }

    if (booking.endTime <= deps.clock.now()) {
      throw new BookingAlreadyEndedError();
    }

    await deps.bookings.delete(input.bookingId);
  };
}
