import type { Booking } from "@/core/domain/entities/booking";
import type { RoomWithStatus } from "@/core/domain/entities/room";
import type { ISODate } from "@/components/ui/types";
import { CalendarGrid } from "./CalendarGrid";
import { CalendarToolbar } from "./CalendarToolbar";

/*
 * ยังเป็น Server Component — มีแค่ CalendarToolbar ที่ข้ามไปฝั่ง client
 * เพราะต้อง navigate ตอนเปลี่ยนวันหรือเปลี่ยนห้อง
 */
export function CalendarView({
  date,
  roomId,
  rooms,
  bookings,
  dayStart,
}: {
  date: ISODate;
  roomId?: string;
  rooms: RoomWithStatus[];
  bookings: Booking[];
  dayStart: Date;
}) {
  const visibleRooms = roomId ? rooms.filter((r) => r.id === roomId) : rooms;

  return (
    <div className="flex flex-col gap-4">
      <CalendarToolbar date={date} roomId={roomId} rooms={rooms} />
      <CalendarGrid rooms={visibleRooms} bookings={bookings} dayStart={dayStart} />
    </div>
  );
}
