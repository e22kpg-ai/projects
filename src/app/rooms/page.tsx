import { NavBar } from "@/components/layout/NavBar";
import { RoomList } from "@/components/rooms/RoomList";
import { getRoomsWithStatus } from "@/adapters/driving/queries/room.queries";

export default async function RoomsPage() {
  const rooms = await getRoomsWithStatus();

  return (
    <>
      <NavBar />
      <main className="max-w-5xl mx-auto w-full p-6 flex flex-col gap-4">
        <h1 className="text-xl font-semibold">ห้องประชุม</h1>
        <RoomList rooms={rooms} />
      </main>
    </>
  );
}
