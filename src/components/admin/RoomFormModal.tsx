"use client";

import { useActionState, useEffect } from "react";
import {
  createRoomAction,
  updateRoomAction,
  type RoomFormState,
} from "@/adapters/driving/actions/room-admin.actions";
import type { Room } from "@/core/domain/entities/room";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { TextInput } from "@/components/ui/TextInput";
import { Textarea } from "@/components/ui/Textarea";

const initialState: RoomFormState = {};

export function RoomFormModal({
  open,
  onClose,
  mode,
  room,
}: {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  room?: Room;
}) {
  const action = mode === "create" ? createRoomAction : updateRoomAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "เพิ่มห้องประชุม" : `แก้ไขห้อง — ${room?.name}`}
    >
      <form action={formAction} className="flex flex-col gap-4">
        {mode === "edit" && room && <input type="hidden" name="roomId" value={room.id} />}

        <Field label="ชื่อห้อง" required>
          <TextInput type="text" name="name" defaultValue={room?.name} required />
        </Field>

        <Field label="ที่ตั้ง">
          <TextInput type="text" name="location" defaultValue={room?.location ?? ""} />
        </Field>

        <Field label="จำนวนผู้เข้าร่วมสูงสุด" required>
          <TextInput type="number" name="capacity" min={1} defaultValue={room?.capacity} required />
        </Field>

        <Field label="รายละเอียดห้อง">
          <Textarea name="description" rows={3} defaultValue={room?.description ?? ""} />
        </Field>

        <Field label="อุปกรณ์โสตทัศนูปกรณ์" hint="คั่นแต่ละรายการด้วยจุลภาค เช่น โปรเจกเตอร์, จอทีวี, ไมโครโฟน">
          <TextInput
            type="text"
            name="equipment"
            defaultValue={room?.equipment.join(", ") ?? ""}
            placeholder="โปรเจกเตอร์, จอทีวี, ไมโครโฟน"
          />
        </Field>

        <Field label="ผู้รับผิดชอบกำกับดูแลห้องประชุม">
          <TextInput type="text" name="ownerName" defaultValue={room?.ownerName ?? ""} />
        </Field>

        {state.error && <Alert>{state.error}</Alert>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button type="submit" loading={pending}>
            {mode === "create" ? "เพิ่มห้อง" : "บันทึกการแก้ไข"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
