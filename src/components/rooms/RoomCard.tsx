import Link from "next/link";
import type { RoomWithStatus } from "@/core/domain/entities/room";

export function RoomCard({ room }: { room: RoomWithStatus }) {
  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold">{room.name}</h2>
          {room.location && <p className="text-muted text-sm">{room.location}</p>}
        </div>
        <span
          className={room.isBusyNow ? "badge-danger" : "badge-success"}
        >
          {room.isBusyNow ? "ไม่ว่าง" : "ว่าง"}
        </span>
      </div>

      <p className="text-muted text-sm">รองรับ {room.capacity} คน</p>
      {room.description && <p className="text-sm">{room.description}</p>}

      <Link href={`/rooms/${room.id}/book`} className="btn-primary mt-auto self-start">
        จองห้องนี้
      </Link>
    </div>
  );
}
