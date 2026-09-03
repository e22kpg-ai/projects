"use client";

import { useActionState, useEffect } from "react";
import {
  createRoomAction,
  updateRoomAction,
  type RoomFormState,
} from "@/adapters/driving/actions/room-admin.actions";
import type { Room } from "@/core/domain/entities/room";
import { MAX_ROOM_CAPACITY } from "@/core/domain/room-rules";
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

  /*
   * ลำดับความสำคัญของค่าตั้งต้นในแต่ละช่อง:
   *   1. ค่าที่เพิ่งกรอกแล้ว submit ไม่ผ่าน (state.values) — React 19 เคลียร์ฟอร์ม
   *      uncontrolled ทิ้งหลัง action จบ ถ้าไม่เอาค่ากลับมาใส่ ผู้ใช้จะพิมพ์ใหม่ทั้งหมด
   *   2. ค่าเดิมของห้อง (โหมดแก้ไข)
   *   3. ว่าง (โหมดเพิ่มห้อง)
   */
  const v = state.values;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "เพิ่มห้องประชุม" : `แก้ไขห้อง — ${room?.name}`}
    >
      <form action={formAction} className="flex flex-col gap-4">
        {mode === "edit" && room && <input type="hidden" name="roomId" value={room.id} />}

        <Field label="ชื่อห้อง" required>
          <TextInput type="text" name="name" defaultValue={v?.name ?? room?.name ?? ""} required />
        </Field>

        <Field label="ที่ตั้ง">
          <TextInput
            type="text"
            name="location"
            defaultValue={v?.location ?? room?.location ?? ""}
          />
        </Field>

        <Field label="จำนวนผู้เข้าร่วมสูงสุด" required>
          <TextInput
            type="number"
            name="capacity"
            min={1}
            /* ขอบเขตเดียวกับที่ core บังคับจริง — ที่นี่แค่ให้เบราว์เซอร์ช่วยทักก่อนกดส่ง */
            max={MAX_ROOM_CAPACITY}
            defaultValue={v?.capacity ?? room?.capacity ?? ""}
            required
          />
        </Field>

        <Field label="รายละเอียดห้อง">
          <Textarea
            name="description"
            rows={3}
            defaultValue={v?.description ?? room?.description ?? ""}
          />
        </Field>

        <Field label="อุปกรณ์โสตทัศนูปกรณ์" hint="คั่นแต่ละรายการด้วยจุลภาค เช่น โปรเจกเตอร์, จอทีวี, ไมโครโฟน">
          <TextInput
            type="text"
            name="equipment"
            defaultValue={v?.equipment ?? room?.equipment.join(", ") ?? ""}
            placeholder="โปรเจกเตอร์, จอทีวี, ไมโครโฟน"
          />
        </Field>

        <Field label="ผู้รับผิดชอบกำกับดูแลห้องประชุม">
          <TextInput
            type="text"
            name="ownerName"
            defaultValue={v?.ownerName ?? room?.ownerName ?? ""}
          />
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
