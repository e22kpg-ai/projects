import type { Booking } from "@/core/domain/entities/booking";

/*
 * รวมสถิติการใช้ห้องประชุม — ฟังก์ชันบริสุทธิ์ ไม่แตะ DB ไม่แตะนาฬิกา
 *
 * แยกออกมาจาก use-case เพราะการคัดกรอง "การจองไหนนับเป็นการใช้งานแล้ว" เป็นเรื่องของ
 * orchestration (ต้องถามนาฬิกา) ส่วนการนับและจัดอันดับเป็นเลขคณิตล้วน ที่ป้อนอะไรเข้าไป
 * ก็ได้ผลเดิมทุกครั้ง — ส่วนหลังนี่แหละที่ต้องมีเทสต์แน่นๆ เพราะเป็นตัวเลขที่ผู้บริหารเอาไปใช้
 *
 * ★ ห้องที่ไม่ถูกใช้เลยก็ต้องอยู่ในรายงานด้วย (นับเป็น 0) — "ห้องไหนไม่มีใครใช้"
 *   เป็นข้อมูลที่มีค่าพอๆ กับ "ห้องไหนคนแย่งกัน" ถ้าตัดแถวศูนย์ทิ้ง คนอ่านจะไม่มีทางรู้เลย
 */

export interface RoomUsageRow {
  roomId: string;
  roomName: string;
  bookings: number;
  minutes: number;
  /**
   * สัดส่วนของเวลาทำการทั้งช่วงที่ห้องนี้ถูกใช้จริง (0–100) ทศนิยมหนึ่งตำแหน่ง
   *
   * ★ ต้องมีทศนิยม ไม่ใช่จำนวนเต็ม — ถ้าปัดเป็นจำนวนเต็ม รายงานช่วงยาว (เช่นทั้งปี)
   *   จะขึ้น 0% ให้ทุกห้องทั้งที่มีการใช้งานจริง คนอ่านจะเลิกเชื่อคอลัมน์นี้ทันที
   */
  utilisationPercent: number;
}

export interface DepartmentUsageRow {
  /** `null` = การจองเก่าที่บันทึกไว้ก่อนมีช่องหน่วยงาน */
  department: string | null;
  bookings: number;
  minutes: number;
}

export interface BusiestDay {
  /** `YYYY-MM-DD` ตามเวลาท้องถิ่น */
  date: string;
  bookings: number;
}

export interface RoomUsageSummary {
  totalBookings: number;
  totalMinutes: number;
  /** จำนวนห้องที่ถูกใช้จริงอย่างน้อยหนึ่งครั้ง */
  roomsUsed: number;
  /** ความยาวเฉลี่ยต่อการประชุมหนึ่งครั้ง (นาที) ปัดเป็นจำนวนเต็ม */
  averageMinutes: number;
  busiestDay: BusiestDay | null;
  byRoom: RoomUsageRow[];
  byDepartment: DepartmentUsageRow[];
}

export interface SummarizeUsageInput {
  /** เฉพาะการจองที่ถือว่าใช้งานจบไปแล้ว — ผู้เรียกเป็นคนคัดมาก่อน */
  bookings: Booking[];
  /** ห้องทั้งหมดในระบบ ณ ตอนออกรายงาน รวมห้องที่ไม่มีใครใช้ */
  rooms: { id: string; name: string }[];
  /** จำนวนวันในช่วงที่ขอ (นับหัวนับท้าย) */
  daysInRange: number;
  /** นาทีทำการต่อวัน ใช้เป็นตัวหารของอัตราการใช้งาน */
  minutesPerDay: number;
}

/*
 * core import จาก components/ui ไม่ได้ (ทิศทางการพึ่งพาต้องชี้เข้าหา core เสมอ)
 * จึงต้องมีตัวแปลงวันที่ของตัวเอง — รูปแบบต้องตรงกับ toISODate() เป๊ะ
 * และห้ามใช้ toISOString() ด้วยเหตุผลเดียวกัน คือมันแปลงเป็น UTC แล้วข้ามวันผิดตอนดึก
 */
function localDateKey(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function bookingMinutes(booking: Booking): number {
  return Math.max(0, Math.round((booking.endTime.getTime() - booking.startTime.getTime()) / 60000));
}

export function summarizeUsage(input: SummarizeUsageInput): RoomUsageSummary {
  const { bookings, rooms, daysInRange, minutesPerDay } = input;

  const perRoom = new Map<string, { bookings: number; minutes: number }>();
  const perDepartment = new Map<string, { bookings: number; minutes: number }>();
  const perDay = new Map<string, number>();
  let totalMinutes = 0;

  for (const booking of bookings) {
    const minutes = bookingMinutes(booking);
    totalMinutes += minutes;

    const room = perRoom.get(booking.roomId) ?? { bookings: 0, minutes: 0 };
    perRoom.set(booking.roomId, { bookings: room.bookings + 1, minutes: room.minutes + minutes });

    /*
     * Map ใช้ string เป็น key เท่านั้น เลยต้องมีค่าแทน null ที่ชนกับชื่อหน่วยงานจริงไม่ได้
     * สตริงว่างใช้ได้ เพราะ zod ฝั่ง action บังคับ min(1) อยู่แล้ว หน่วยงานจริงจึงว่างไม่ได้
     */
    const departmentKey = booking.department ?? "";
    const dept = perDepartment.get(departmentKey) ?? { bookings: 0, minutes: 0 };
    perDepartment.set(departmentKey, {
      bookings: dept.bookings + 1,
      minutes: dept.minutes + minutes,
    });

    const dayKey = localDateKey(booking.startTime);
    perDay.set(dayKey, (perDay.get(dayKey) ?? 0) + 1);
  }

  /* ตัวหารเป็น 0 ได้ถ้าผู้เรียกส่งช่วงว่างมา — กันหารศูนย์ไว้ก่อนดีกว่าได้ NaN โผล่หน้าจอ */
  const availableMinutes = Math.max(0, daysInRange) * Math.max(0, minutesPerDay);

  const byRoom: RoomUsageRow[] = rooms
    .map((room) => {
      const stats = perRoom.get(room.id) ?? { bookings: 0, minutes: 0 };
      return {
        roomId: room.id,
        roomName: room.name,
        bookings: stats.bookings,
        minutes: stats.minutes,
        utilisationPercent:
          availableMinutes > 0
            ? Math.round((stats.minutes / availableMinutes) * 1000) / 10
            : 0,
      };
    })
    /* เรียงตามเวลาที่ใช้จริง ถ้าเท่ากันให้เรียงตามชื่อ จะได้ผลลัพธ์เดิมทุกครั้งที่ออกรายงานซ้ำ */
    .sort((a, b) => b.minutes - a.minutes || a.roomName.localeCompare(b.roomName, "th"));

  const byDepartment: DepartmentUsageRow[] = [...perDepartment.entries()]
    .map(([key, stats]) => ({ department: key === "" ? null : key, ...stats }))
    .sort(
      (a, b) =>
        b.minutes - a.minutes || (a.department ?? "").localeCompare(b.department ?? "", "th"),
    );

  let busiestDay: BusiestDay | null = null;
  for (const [date, count] of perDay) {
    /* เท่ากันให้เอาวันที่มาก่อน ผลลัพธ์จะได้ไม่แกว่งตามลำดับที่ DB คืนมา */
    if (!busiestDay || count > busiestDay.bookings || (count === busiestDay.bookings && date < busiestDay.date)) {
      busiestDay = { date, bookings: count };
    }
  }

  return {
    totalBookings: bookings.length,
    totalMinutes,
    roomsUsed: perRoom.size,
    averageMinutes: bookings.length > 0 ? Math.round(totalMinutes / bookings.length) : 0,
    busiestDay,
    byRoom,
    byDepartment,
  };
}
