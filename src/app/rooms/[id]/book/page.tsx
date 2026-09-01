import { notFound } from "next/navigation";
import { NavBar } from "@/components/layout/NavBar";
import { BookingForm } from "@/components/booking/BookingForm";
import { getRoomById } from "@/adapters/driving/queries/room.queries";

export default async function BookRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const room = await getRoomById(id);

  if (!room) {
    notFound();
  }

  return (
    <>
      <NavBar />
      <main className="max-w-5xl mx-auto w-full p-6 flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold">จองห้อง: {room.name}</h1>
          <p className="text-muted text-sm">รองรับ {room.capacity} คน</p>
        </div>
        <BookingForm roomId={room.id} />
      </main>
    </>
  );
}
