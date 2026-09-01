import { getCalendarData } from "@/adapters/driving/queries/calendar.queries";
import { CalendarView } from "@/components/calendar/CalendarView";
import { NavBar } from "@/components/layout/NavBar";
import { todayISO } from "@/components/ui/date-utils";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; room?: string }>;
}) {
  const params = await searchParams;
  /* todayISO() คำนวณตามเวลาท้องถิ่น ต่างจาก toISOString() เดิมที่เป็น UTC และข้ามวันผิดตอนดึก */
  const date = params.date ?? todayISO();
  const roomId = params.room || undefined;

  const { rooms, bookings, dayStart } = await getCalendarData({ date, roomId });

  return (
    <>
      <NavBar />
      <main className="max-w-5xl mx-auto w-full p-6 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">ปฏิทินการจอง</h1>
          <p className="text-muted text-sm">
            {bookings.length === 0
              ? "ยังไม่มีการจองในวันนี้"
              : `มี ${bookings.length} รายการในวันที่เลือก`}
          </p>
        </div>

        <CalendarView
          date={date}
          roomId={roomId}
          rooms={rooms}
          bookings={bookings}
          dayStart={dayStart}
        />
      </main>
    </>
  );
}
