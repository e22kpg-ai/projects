import { getRoomsWithStatus } from "@/adapters/driving/queries/room.queries";
import { requireUser } from "@/adapters/driving/queries/session.queries";
import { BookingSuccessToast } from "@/components/booking/BookingSuccessToast";
import { NavBar } from "@/components/layout/NavBar";
import { RoomBrowser } from "@/components/rooms/RoomBrowser";
import { Button } from "@/components/ui/Button";
import { CalendarIcon } from "@/components/ui/Icons";

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<{ booked?: string }>;
}) {
  await requireUser();

  const [rooms, params] = await Promise.all([getRoomsWithStatus(), searchParams]);

  const freeCount = rooms.filter((room) => !room.isBusyNow).length;

  return (
    <>
      <NavBar />
      <BookingSuccessToast show={params.booked === "1"} />

      <main className="max-w-5xl mx-auto w-full p-6 flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">ห้องประชุม</h1>
            <p className="text-muted text-sm">
              {rooms.length === 0
                ? "ยังไม่มีห้องในระบบ"
                : `ตอนนี้ว่าง ${freeCount} จาก ${rooms.length} ห้อง`}
            </p>
          </div>

          <Button href="/calendar" variant="secondary" iconLeft={<CalendarIcon />}>
            ดูปฏิทิน
          </Button>
        </div>

        <RoomBrowser rooms={rooms} />
      </main>
    </>
  );
}
