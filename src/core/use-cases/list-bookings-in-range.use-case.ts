import type { Booking } from "@/core/domain/entities/booking";
import type { BookingRepository } from "@/core/ports/booking-repository.port";
import type { Clock } from "@/core/ports/clock.port";

export interface ListBookingsInRangeDeps {
  bookings: BookingRepository;
  clock: Clock;
}

export interface ListBookingsInRangeInput {
  start: Date;
  end: Date;
  roomId?: string;
  /**
   * ตัดการประชุมที่จบไปแล้วออก — ปฏิทินใช้ตัวนี้
   *
   * การประชุมที่จบแล้วย้ายไปอยู่ในรายงานการใช้ห้องแทน (ดู summarize-room-usage.use-case.ts)
   * เกณฑ์ต้องเป็นอันเดียวกันทั้งสองที่ ไม่งั้นจะมีช่วงที่ข้อมูลหายไปจากทั้งสองหน้า
   */
  excludeEnded?: boolean;
}

export function makeListBookingsInRange(deps: ListBookingsInRangeDeps) {
  return async function listBookingsInRange(
    input: ListBookingsInRangeInput,
  ): Promise<Booking[]> {
    const found = await deps.bookings.findInRange(input.start, input.end, input.roomId);
    if (!input.excludeEnded) return found;

    /*
     * กรองในหน่วยความจำ ไม่ใช่ใน SQL โดยตั้งใจ — "ตอนนี้" ของระบบมาจาก Clock port
     * ถ้าไปเทียบกับ CURRENT_TIMESTAMP ของฐานข้อมูล เทสต์จะตรึงเวลาไม่ได้อีกต่อไป
     * และเวลาของ DB กับของ process ก็ไม่จำเป็นต้องตรงกันด้วย
     */
    const now = deps.clock.now();
    return found.filter((booking) => booking.endTime > now);
  };
}
