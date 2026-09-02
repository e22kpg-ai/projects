"use client";

import { useActionState, useEffect } from "react";
import {
  deleteRoomAction,
  type RoomFormState,
} from "@/adapters/driving/actions/room-admin.actions";
import type { Room } from "@/core/domain/entities/room";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

const initialState: RoomFormState = {};

/* mount เฉพาะตอนจะลบจริง (ดู RoomsAdminSection) — state ของ action จึงเริ่มใหม่ทุกครั้ง */
export function DeleteRoomDialog({ room, onClose }: { room: Room; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(deleteRoomAction, initialState);

  useEffect(() => {
    if (state.success) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Modal open onClose={onClose} title="ลบห้องประชุม" size="sm">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="roomId" value={room.id} />

        <Alert variant="warning">
          ลบห้อง “{room.name}” แล้ว การจองทั้งหมดของห้องนี้จะถูกลบไปด้วยและกู้คืนไม่ได้
        </Alert>

        {state.error && <Alert>{state.error}</Alert>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button type="submit" variant="danger" loading={pending}>
            ลบห้องนี้
          </Button>
        </div>
      </form>
    </Modal>
  );
}
