import Link from "next/link";
import type { Booking } from "@/core/domain/entities/booking";
import type { RoomWithStatus } from "@/core/domain/entities/room";
import { CalendarGrid } from "./CalendarGrid";

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function buildHref(date: string, roomId?: string): string {
  const params = new URLSearchParams({ date });
  if (roomId) params.set("room", roomId);
  return `/calendar?${params.toString()}`;
}

export function CalendarView({
  date,
  roomId,
  rooms,
  bookings,
  dayStart,
}: {
  date: string;
  roomId?: string;
  rooms: RoomWithStatus[];
  bookings: Booking[];
  dayStart: Date;
}) {
  const visibleRooms = roomId ? rooms.filter((r) => r.id === roomId) : rooms;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={buildHref(shiftDate(date, -1), roomId)} className="btn-secondary">
            ← ก่อนหน้า
          </Link>
          <span className="font-medium px-2">{date}</span>
          <Link href={buildHref(shiftDate(date, 1), roomId)} className="btn-secondary">
            ถัดไป →
          </Link>
        </div>

        <form method="get" action="/calendar" className="flex items-center gap-2">
          <input type="hidden" name="date" value={date} />
          <select name="room" defaultValue={roomId ?? ""} className="input w-auto">
            <option value="">ทุกห้อง</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-secondary">
            กรอง
          </button>
        </form>
      </div>

      <CalendarGrid rooms={visibleRooms} bookings={bookings} dayStart={dayStart} />
    </div>
  );
}
