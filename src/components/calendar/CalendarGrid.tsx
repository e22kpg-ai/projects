import type { Booking } from "@/core/domain/entities/booking";
import type { Room } from "@/core/domain/entities/room";

const OPEN_HOUR = 8;
const CLOSE_HOUR = 18;
const SLOT_MINUTES = 30;
const TOTAL_SLOTS = ((CLOSE_HOUR - OPEN_HOUR) * 60) / SLOT_MINUTES;

function minutesFromOpen(time: Date, dayStart: Date): number {
  const minutesSinceMidnight = (time.getTime() - dayStart.getTime()) / 60000;
  return minutesSinceMidnight - OPEN_HOUR * 60;
}

function slotLabel(index: number): string {
  const totalMinutes = OPEN_HOUR * 60 + index * SLOT_MINUTES;
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function CalendarGrid({
  rooms,
  bookings,
  dayStart,
}: {
  rooms: Room[];
  bookings: Booking[];
  dayStart: Date;
}) {
  if (rooms.length === 0) {
    return <p className="text-muted">ยังไม่มีห้องประชุมในระบบ</p>;
  }

  return (
    <div className="card-flat overflow-x-auto">
      <div
        className="grid min-w-[640px]"
        style={{
          gridTemplateColumns: `5rem repeat(${rooms.length}, 1fr)`,
          gridTemplateRows: `2.5rem repeat(${TOTAL_SLOTS}, 2rem)`,
        }}
      >
        <div className="border-b border-border" style={{ gridColumn: 1, gridRow: 1 }} />
        {rooms.map((room, i) => (
          <div
            key={room.id}
            className="border-b border-border border-l px-2 py-1 text-sm font-medium truncate"
            style={{ gridColumn: i + 2, gridRow: 1 }}
          >
            {room.name}
          </div>
        ))}

        {Array.from({ length: TOTAL_SLOTS }).map((_, i) => (
          <div
            key={i}
            className="border-b border-border text-muted text-xs px-2 pt-1"
            style={{ gridColumn: 1, gridRow: i + 2 }}
          >
            {i % 2 === 0 ? slotLabel(i) : null}
          </div>
        ))}

        {rooms.map((room, i) =>
          Array.from({ length: TOTAL_SLOTS }).map((_, j) => (
            <div
              key={`${room.id}-${j}`}
              className="border-b border-border border-l"
              style={{ gridColumn: i + 2, gridRow: j + 2 }}
            />
          )),
        )}

        {bookings.map((booking) => {
          const roomIndex = rooms.findIndex((r) => r.id === booking.roomId);
          if (roomIndex === -1) return null;

          const startOffset = Math.max(0, minutesFromOpen(booking.startTime, dayStart));
          const endOffset = Math.min(
            TOTAL_SLOTS * SLOT_MINUTES,
            minutesFromOpen(booking.endTime, dayStart),
          );
          if (endOffset <= 0 || startOffset >= TOTAL_SLOTS * SLOT_MINUTES) return null;

          const rowStart = 2 + Math.floor(startOffset / SLOT_MINUTES);
          const rowEnd = 2 + Math.ceil(endOffset / SLOT_MINUTES);

          return (
            <div
              key={booking.id}
              className="card lift m-0.5 overflow-hidden px-2 py-1 text-xs bg-brand-subtle border-brand-500/40"
              style={{ gridColumn: roomIndex + 2, gridRow: `${rowStart} / ${rowEnd}` }}
            >
              <p className="font-medium truncate">{booking.title}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
