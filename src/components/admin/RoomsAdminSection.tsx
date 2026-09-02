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
      {/* หัวข้อหน้ากับลิงก์ข้ามไปหน้าผู้ใช้อยู่ที่ page.tsx (Server Component) แล้ว */}
      <Button onClick={() => setCreating(true)} className="self-start">
        เพิ่มห้องประชุม
      </Button>

      {rooms.length === 0 ? (
        <EmptyState
          title="ยังไม่มีห้องประชุมในระบบ"
          description="เพิ่มห้องแรกเข้าระบบเพื่อให้คนอื่นเริ่มจองได้"
          action={<Button onClick={() => setCreating(true)}>เพิ่มห้องประชุม</Button>}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {rooms.map((room) => (
            <li key={room.id} className="card-flat flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex flex-col gap-1">
                {/* h2 เหมือน RoomCard — เป็นรายการห้องเหมือนกัน ให้ screen reader ไล่ตามหัวข้อได้ */}
                <h2 className="font-medium truncate">{room.name}</h2>
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

              {/*
                ต้องมี aria-label ระบุชื่อห้อง — ไม่งั้น screen reader ที่ไล่อ่านรายการปุ่ม
                จะได้ยินแค่ "แก้ไข, ลบ, แก้ไข, ลบ, ..." โดยไม่รู้ว่าปุ่มไหนของห้องอะไร
              */}
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  aria-label={`แก้ไขห้อง ${room.name}`}
                  onClick={() => setEditingRoom(room)}
                >
                  แก้ไข
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  aria-label={`ลบห้อง ${room.name}`}
                  onClick={() => setDeletingRoom(room)}
                >
                  ลบ
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/*
        เรนเดอร์เฉพาะตอนเปิดจริง ไม่ใช่ปล่อยค้างไว้แล้วส่ง open={false}
        เพราะ Modal คืน null ตอนปิด ทำให้เฉพาะ <form> ข้างในหายไป แต่ตัว component ยังอยู่
        state ของ useActionState จึงค้างข้ามการเปิด-ปิด — เคยทำให้เปิดกล่องลบห้อง B
        แล้วเจอ error ของห้อง A ค้างอยู่ทั้งที่ยังไม่ได้กดอะไรเลย
      */}
      {creating && (
        <RoomFormModal open onClose={() => setCreating(false)} mode="create" />
      )}
      {editingRoom && (
        <RoomFormModal
          open
          onClose={() => setEditingRoom(null)}
          mode="edit"
          room={editingRoom}
        />
      )}
      {deletingRoom && (
        <DeleteRoomDialog room={deletingRoom} onClose={() => setDeletingRoom(null)} />
      )}
    </div>
  );
}
