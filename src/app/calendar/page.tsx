import { NavBar } from "@/components/layout/NavBar";
import { CalendarView } from "@/components/calendar/CalendarView";
import { getCalendarData } from "@/adapters/driving/queries/calendar.queries";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; room?: string }>;
}) {
  const params = await searchParams;
  const date = params.date ?? new Date().toISOString().slice(0, 10);
  const roomId = params.room || undefined;

  const { rooms, bookings, dayStart } = await getCalendarData({ date, roomId });

  return (
    <>
      <NavBar />
      <main className="max-w-5xl mx-auto w-full p-6 flex flex-col gap-4">
        <h1 className="text-xl font-semibold">ปฏิทินการจอง</h1>
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
