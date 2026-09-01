import type { Booking } from "@/core/domain/entities/booking";
import type { Room } from "@/core/domain/entities/room";
import { EmptyState } from "@/components/ui/EmptyState";
import { toISODate } from "@/components/ui/date-utils";
import {
  CLOSE_HOUR,
  OPEN_HOUR,
  SLOT_MINUTES,
  TOTAL_SLOTS,
  formatTimeOfDay,
  slotLabel,
} from "@/components/ui/time-utils";
import { BookingBlock } from "./BookingBlock";

/*
 * ตารางเวลารายวัน — ยังเป็น Server Component
 *
 * ค่าคงที่เวลาทำการย้ายไปอยู่ที่ components/ui/time-utils.ts แล้ว
 * เพื่อให้ตัวเลือกเวลาในฟอร์มจองกับตารางนี้อ้างอิงค่าชุดเดียวกัน
 * (ก่อนหน้านี้ประกาศซ้ำอยู่ในไฟล์นี้เอง มีโอกาสหลุดจากกันโดยไม่มีใครรู้)
 */

function minutesFromOpen(time: Date, dayStart: Date): number {
  const minutesSinceMidnight = (time.getTime() - dayStart.getTime()) / 60000;
  return minutesSinceMidnight - OPEN_HOUR * 60;
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
    return (
      <EmptyState
        title="ไม่มีห้องให้แสดง"
        description="ลองเปลี่ยนตัวกรองห้องด้านบน หรือเพิ่มห้องเข้าระบบก่อน"
      />
    );
  }

  /* เส้นบอกเวลาปัจจุบัน — แสดงเฉพาะตอนที่กำลังดูวันนี้และอยู่ในเวลาทำการ */
  const now = new Date();
  const isToday = toISODate(now) === toISODate(dayStart);
  const nowMinutes = minutesFromOpen(now, dayStart);
  const showNowLine =
    isToday && nowMinutes >= 0 && nowMinutes <= (CLOSE_HOUR - OPEN_HOUR) * 60;

  return (
    <div className="card-flat overflow-x-auto">
      <div
        className="grid min-w-160"
        style={{
          gridTemplateColumns: `4.5rem repeat(${rooms.length}, minmax(7rem, 1fr))`,
          gridTemplateRows: `2.5rem repeat(${TOTAL_SLOTS}, 2rem)`,
        }}
      >
        {/* หัวตาราง */}
        <div className="border-b border-border" style={{ gridColumn: 1, gridRow: 1 }} />
        {rooms.map((room, i) => (
          <div
            key={room.id}
            className="border-b border-l border-border px-2 py-1 text-sm font-medium truncate"
            style={{ gridColumn: i + 2, gridRow: 1 }}
          >
            {room.name}
          </div>
        ))}

        {/* ป้ายเวลาทางซ้าย — แสดงเฉพาะต้นชั่วโมง */}
        {Array.from({ length: TOTAL_SLOTS }).map((_, i) => (
          <div
            key={i}
            className="border-b border-border px-2 pt-1 text-xs text-muted tabular-nums"
            style={{ gridColumn: 1, gridRow: i + 2 }}
          >
            {i % 2 === 0 ? slotLabel(i) : null}
          </div>
        ))}

        {/* ช่องว่าง — เส้นครึ่งชั่วโมงจางกว่าเส้นเต็มชั่วโมง ทำให้กวาดตาหาชั่วโมงได้เร็วขึ้น */}
        {rooms.map((room, i) =>
          Array.from({ length: TOTAL_SLOTS }).map((_, j) => (
            <div
              key={`${room.id}-${j}`}
              className={
                j % 2 === 0
                  ? "border-b border-l border-border/50 border-l-border"
                  : "border-b border-l border-border border-l-border"
              }
              style={{ gridColumn: i + 2, gridRow: j + 2 }}
            />
          )),
        )}

        {/* บล็อกการจอง */}
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
            <BookingBlock
              key={booking.id}
              title={booking.title}
              roomName={rooms[roomIndex].name}
              startLabel={formatTimeOfDay(booking.startTime)}
              endLabel={formatTimeOfDay(booking.endTime)}
              department={booking.department}
              chairperson={booking.chairperson}
              dressCode={booking.dressCode}
              gridColumn={roomIndex + 2}
              gridRow={`${rowStart} / ${rowEnd}`}
            />
          );
        })}

        {/* เส้นเวลาปัจจุบัน พาดทับทุกคอลัมน์ */}
        {showNowLine && (
          <div
            aria-hidden="true"
            className="pointer-events-none relative border-t-2 border-danger"
            style={{
              gridColumn: `2 / ${rooms.length + 2}`,
              gridRow: `${2 + Math.floor(nowMinutes / SLOT_MINUTES)}`,
              marginTop: `${((nowMinutes % SLOT_MINUTES) / SLOT_MINUTES) * 2}rem`,
              height: 0,
            }}
          />
        )}
      </div>
    </div>
  );
}
