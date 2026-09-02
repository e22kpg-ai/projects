import Link from "next/link";
import { notFound } from "next/navigation";
import { getRoomById, getRoomBookings } from "@/adapters/driving/queries/room.queries";
import { requireApprovedUser } from "@/adapters/driving/queries/session.queries";
import { BookingForm, type BookedSlot } from "@/components/booking/BookingForm";
import { NavBar } from "@/components/layout/NavBar";
import { addDays, toISODate, todayISO } from "@/components/ui/date-utils";
import { MapPinIcon, UsersIcon } from "@/components/ui/Icons";
import { formatTimeOfDay } from "@/components/ui/time-utils";

/** ดึงล่วงหน้าเท่ากับช่วงที่ DatePicker ยอมให้เลือกได้จริงในทางปฏิบัติ */
const LOOKAHEAD_DAYS = 60;

export default async function BookRoomPage({ params }: { params: Promise<{ id: string }> }) {
  await requireApprovedUser();

  const { id } = await params;

  const [room, bookings] = await Promise.all([
    getRoomById(id),
    getRoomBookings(id, new Date(), LOOKAHEAD_DAYS),
  ]);

  if (!room) {
    notFound();
  }

  /* แปลง Date เป็น string ตั้งแต่ฝั่ง server — ฝั่ง client จะได้ไม่ต้องตีความ timezone เองอีกรอบ */
  const bookedSlots: BookedSlot[] = bookings.map((booking) => ({
    date: toISODate(booking.startTime),
    start: formatTimeOfDay(booking.startTime),
    end: formatTimeOfDay(booking.endTime),
    title: booking.title,
  }));

  return (
    <>
      <NavBar />
      <main className="max-w-5xl mx-auto w-full p-6 flex flex-col gap-6">
        <nav aria-label="ตำแหน่งปัจจุบัน" className="text-sm text-muted">
          <Link href="/rooms" className="link">
            ห้องประชุม
          </Link>
          <span aria-hidden="true"> › </span>
          <span className="text-foreground">{room.name}</span>
        </nav>

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">จองห้อง {room.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <UsersIcon className="size-4" />
              รองรับ {room.capacity} คน
            </span>
            {room.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPinIcon className="size-4" />
                {room.location}
              </span>
            )}
          </div>
          {room.description && <p className="text-sm">{room.description}</p>}
        </div>

        <div className="max-w-xl">
          {/* today/maxDate คำนวณที่ server ที่เดียว ให้ตรงกับช่วงที่ prefetch การจองมาจริง */}
          <BookingForm
            roomId={room.id}
            bookedSlots={bookedSlots}
            today={todayISO()}
            maxDate={addDays(todayISO(), LOOKAHEAD_DAYS)}
          />
        </div>
      </main>
    </>
  );
}
