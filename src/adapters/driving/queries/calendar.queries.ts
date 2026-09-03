import { container } from "@/composition/container";

export interface CalendarQueryParams {
  date: string; // YYYY-MM-DD
  roomId?: string;
}

export async function getCalendarData({ date, roomId }: CalendarQueryParams) {
  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T00:00:00`);
  dayEnd.setDate(dayEnd.getDate() + 1);

  /*
   * ใช้ listRoomsPlain ไม่ใช่ listRoomsWithStatus — ปฏิทินใช้แค่ id/name ของห้อง
   * ส่วน isBusyNow ต้องยิง query การจอง "ตอนนี้" เพิ่มอีกหนึ่งชุด (แถมเป็น full scan
   * เพราะไม่ได้ระบุ room_id) แล้วผลลัพธ์ก็ถูกโยนทิ้งโดยไม่มีใครอ่าน
   */
  /*
   * excludeEnded: การประชุมที่จบไปแล้วไม่ต้องขึ้นปฏิทิน มันย้ายไปอยู่ในรายงานการใช้ห้องแทน
   * (ดู /admin/reports) ปฏิทินมีไว้หาช่องว่างเพื่อจอง ส่วนของที่ผ่านไปแล้วเป็นข้อมูลสถิติ
   */
  const [rooms, bookings] = await Promise.all([
    container.listRoomsPlain(),
    container.listBookingsInRange({ start: dayStart, end: dayEnd, roomId, excludeEnded: true }),
  ]);

  return { rooms, bookings, dayStart, dayEnd };
}
