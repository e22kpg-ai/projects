"use client";

import { useState } from "react";
import type { Room } from "@/core/domain/entities/room";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { MapPinIcon, UsersIcon } from "@/components/ui/Icons";
import { DeleteRoomDialog } from "./DeleteRoomDialog";
import { RoomFormModal } from "./RoomFormModal";

export function RoomsAdminSection({ rooms }: { rooms: Room[] }) {
  const [creating, setCreating] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">จัดการห้องประชุม</h1>
        <Button href="/admin/users" variant="secondary">
          จัดการสิทธิ์ผู้ใช้
        </Button>
      </div>

      <Button onClick={() => setCreating(true)} className="self-start">
        เพิ่มห้องประชุม
      </Button>

      {rooms.length === 0 ? (
        <EmptyState title="ยังไม่มีห้องประชุมในระบบ" description="กดเพิ่มห้องประชุมด้านบนเพื่อเริ่มต้น" />
      ) : (
        <ul className="flex flex-col gap-3">
          {rooms.map((room) => (
            <li key={room.id} className="card-flat flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex flex-col gap-1">
                <p className="font-medium truncate">{room.name}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                  {room.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPinIcon className="size-3.5 shrink-0" />
                      {room.location}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <UsersIcon className="size-3.5 shrink-0" />
                    รองรับ {room.capacity} คน
                  </span>
                  {room.ownerName && <span>ผู้รับผิดชอบ: {room.ownerName}</span>}
                </div>
                {room.equipment.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {room.equipment.map((item) => (
                      <span key={item} className="chip">
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 shrink-0">
                <Button variant="secondary" size="sm" onClick={() => setEditingRoom(room)}>
                  แก้ไข
                </Button>
                <Button variant="danger" size="sm" onClick={() => setDeletingRoom(room)}>
                  ลบ
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <RoomFormModal open={creating} onClose={() => setCreating(false)} mode="create" />
      <RoomFormModal
        open={editingRoom !== null}
        onClose={() => setEditingRoom(null)}
        mode="edit"
        room={editingRoom ?? undefined}
      />
      <DeleteRoomDialog room={deletingRoom} onClose={() => setDeletingRoom(null)} />
    </div>
  );
}
