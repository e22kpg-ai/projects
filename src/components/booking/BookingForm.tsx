"use client";

import { useActionState } from "react";
import { createBookingAction, type BookingFormState } from "@/adapters/driving/actions/booking.actions";

const initialState: BookingFormState = {};

export function BookingForm({ roomId }: { roomId: string }) {
  const [state, formAction, pending] = useActionState(createBookingAction, initialState);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="card flex flex-col gap-4 max-w-md">
      <input type="hidden" name="roomId" value={roomId} />

      <label className="flex flex-col gap-1 text-sm">
        หัวข้อการจอง
        <input className="input" type="text" name="title" required placeholder="เช่น ประชุมทีม" />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        วันที่
        <input className="input" type="date" name="date" required min={today} defaultValue={today} />
      </label>

      <div className="flex gap-3">
        <label className="flex flex-col gap-1 text-sm flex-1">
          เวลาเริ่ม
          <input className="input" type="time" name="startTime" required />
        </label>
        <label className="flex flex-col gap-1 text-sm flex-1">
          เวลาสิ้นสุด
          <input className="input" type="time" name="endTime" required />
        </label>
      </div>

      {state.error && <p className="form-error">{state.error}</p>}

      <button className="btn-primary" type="submit" disabled={pending}>
        {pending ? "กำลังจอง..." : "ยืนยันการจอง"}
      </button>
    </form>
  );
}
