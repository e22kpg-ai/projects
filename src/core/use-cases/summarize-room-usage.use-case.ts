import { isActiveAdmin } from "@/core/domain/account-rules";
import type { Booking } from "@/core/domain/entities/booking";
import { CLOSE_HOUR, OPEN_HOUR } from "@/core/domain/booking-rules";
import { ForbiddenError, InvalidDateRangeError } from "@/core/domain/errors";
import { summarizeUsage, type RoomUsageSummary } from "@/core/domain/services/room-usage";
import type { AuthenticatedUser } from "@/core/ports/auth-service.port";
import type { BookingRepository } from "@/core/ports/booking-repository.port";
import type { RoomRepository } from "@/core/ports/room-repository.port";
import type { Clock } from "@/core/ports/clock.port";

export interface SummarizeRoomUsageDeps {
  bookings: BookingRepository;
  rooms: RoomRepository;
  clock: Clock;
}

export interface SummarizeRoomUsageInput {
  actingUser: AuthenticatedUser;
  /** เที่ยงคืนของวันแรกในช่วง */
  from: Date;
  /** เที่ยงคืนของวัน**ถัดจาก**วันสุดท้ายในช่วง (ขอบขวาแบบไม่รวม) */
  to: Date;
}

export interface RoomUsageReport extends RoomUsageSummary {
  from: Date;
  to: Date;
  daysInRange: number;
  /** รายการการใช้ห้องแบบละเอียด เรียงตามเวลาเริ่ม */
  entries: Booking[];
}

const MAX_RANGE_DAYS = 366;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/*
 * สรุปรายงานการใช้ห้องประชุมในช่วงวันที่กำหนด — admin เท่านั้น
 *
 * ★ นับเฉพาะการประชุมที่ "จบไปแล้ว" ไม่ใช่ทุกการจองในช่วง
 *   เพราะนี่คือรายงานการ*ใช้*ห้อง ไม่ใช่รายการนัดหมายล่วงหน้า การจองที่ยังมาไม่ถึง
 *   อาจถูกยกเลิกได้ ถ้านับรวมเข้าไปตัวเลขจะพองกว่าความจริงและเปลี่ยนไปเรื่อยๆ
 *   ทุกครั้งที่กดดูซ้ำ ซึ่งเป็นสิ่งที่แย่ที่สุดสำหรับตัวเลขที่เอาไปรายงานต่อ
 *
 *   เกณฑ์นี้เป็นอันเดียวกับที่ปฏิทินใช้ซ่อนการจองที่จบแล้ว — ของที่หายจากปฏิทิน
 *   จะไปโผล่ที่รายงานพอดี ไม่มีช่วงไหนที่ข้อมูลตกหาย
 *
 * ★ จำกัดช่วงไม่เกินหนึ่งปี กันคนพิมพ์ปีผิดแล้วลากข้อมูลทั้งฐานออกมาโดยไม่ตั้งใจ
 */
export function makeSummarizeRoomUsage(deps: SummarizeRoomUsageDeps) {
  return async function summarizeRoomUsage(
    input: SummarizeRoomUsageInput,
  ): Promise<RoomUsageReport> {
    if (!isActiveAdmin(input.actingUser)) {
      throw new ForbiddenError();
    }

    if (Number.isNaN(input.from.getTime()) || Number.isNaN(input.to.getTime())) {
      throw new InvalidDateRangeError();
    }
    if (input.to <= input.from) {
      throw new InvalidDateRangeError("วันสิ้นสุดต้องไม่อยู่ก่อนวันเริ่มต้น");
    }

    const daysInRange = Math.round((input.to.getTime() - input.from.getTime()) / MS_PER_DAY);
    if (daysInRange > MAX_RANGE_DAYS) {
      throw new InvalidDateRangeError(`ขอรายงานได้ครั้งละไม่เกิน ${MAX_RANGE_DAYS} วัน`);
    }

    /*
     * ⚠️ findInRange ใช้เงื่อนไขแบบ "ทับซ้อน" (startTime < to AND endTime > from) ส่วน summarizeUsage
     *   นับ*นาทีทั้งก้อน*ของแต่ละการจอง ไม่ได้ตัดเฉพาะส่วนที่ตกอยู่ในช่วง
     *
     *   ตอนนี้ยังไม่มีปัญหา เพราะการจองข้ามเที่ยงคืนไม่ได้ (OPEN_HOUR/CLOSE_HOUR บังคับให้จบภายในวัน)
     *   จึงไม่มีการจองไหนคร่อมขอบช่วงได้เลย
     *
     *   ★ แต่ถ้าวันหลังเปิดให้จองข้ามวัน ต้องกลับมาแก้ตรงนี้ด้วย ไม่งั้นนาทีจะถูกนับเกินความจริง
     *     และ busiestDay อาจชี้ไปวันที่อยู่นอกช่วงที่ขอ — ผิดแบบไม่มี error ให้เห็น
     */
    const now = deps.clock.now();
    const [rooms, inRange] = await Promise.all([
      deps.rooms.findAll(),
      deps.bookings.findInRange(input.from, input.to),
    ]);

    const entries = inRange
      .filter((booking) => booking.endTime <= now)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    const summary = summarizeUsage({
      bookings: entries,
      rooms,
      daysInRange,
      minutesPerDay: (CLOSE_HOUR - OPEN_HOUR) * 60,
    });

    return { ...summary, from: input.from, to: input.to, daysInRange, entries };
  };
}
