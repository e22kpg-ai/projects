import type { RoomWithStatus } from "@/core/domain/entities/room";
import { Button } from "@/components/ui/Button";
import { MapPinIcon, UsersIcon } from "@/components/ui/Icons";

export function RoomCard({ room }: { room: RoomWithStatus }) {
  return (
    <article className="card lift flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-semibold truncate">{room.name}</h2>
          {room.location && (
            <p className="text-muted text-sm inline-flex items-center gap-1.5">
              <MapPinIcon className="size-3.5 shrink-0" />
              <span className="truncate">{room.location}</span>
            </p>
          )}
        </div>
        <span className={room.isBusyNow ? "badge-danger badge-dot" : "badge-success badge-dot"}>
          {room.isBusyNow ? "ไม่ว่าง" : "ว่าง"}
        </span>
      </div>

      <p className="text-muted text-sm inline-flex items-center gap-1.5">
        <UsersIcon className="size-4 shrink-0" />
        รองรับ {room.capacity} คน
      </p>

      {room.description && <p className="text-sm line-clamp-2">{room.description}</p>}

      <Button href={`/rooms/${room.id}/book`} className="mt-auto self-start">
        จองห้องนี้
      </Button>
    </article>
  );
}
