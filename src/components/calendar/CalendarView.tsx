import type { Booking } from "@/core/domain/entities/booking";
import type { Room } from "@/core/domain/entities/room";
import type { ISODate } from "@/components/ui/types";
import { CalendarGrid } from "./CalendarGrid";
import { CalendarToolbar } from "./CalendarToolbar";

/*
 * ยังเป็น Server Component — มีแค่ CalendarToolbar ที่ข้ามไปฝั่ง client
 * เพราะต้อง navigate ตอนเปลี่ยนวันหรือเปลี่ยนห้อง
 *
 * today ถูกคำนวณที่ page แล้วส่งลงมา ไม่ให้ toolbar เรียก todayISO() เอง —
 * ไม่งั้นตอนข้ามเที่ยงคืน ฝั่ง SSR กับฝั่ง hydrate จะได้คนละวัน
 */
export function CalendarView({
  date,
  today,
  roomId,
  rooms,
  bookings,
  dayStart,
}: {
  date: ISODate;
  today: ISODate;
  roomId?: string;
  rooms: Room[];
  bookings: Booking[];
  dayStart: Date;
}) {
  const visibleRooms = roomId ? rooms.filter((r) => r.id === roomId) : rooms;

  return (
    <div className="flex flex-col gap-4">
      <CalendarToolbar date={date} today={today} roomId={roomId} rooms={rooms} />
      <CalendarGrid rooms={visibleRooms} bookings={bookings} dayStart={dayStart} />
    </div>
  );
}
