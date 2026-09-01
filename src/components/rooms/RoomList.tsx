import type { RoomWithStatus } from "@/core/domain/entities/room";
import { RoomCard } from "./RoomCard";

export function RoomList({ rooms }: { rooms: RoomWithStatus[] }) {
  if (rooms.length === 0) {
    return <p className="text-muted">ยังไม่มีห้องประชุมในระบบ</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} />
      ))}
    </div>
  );
}
