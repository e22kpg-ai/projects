"use client";

import { useActionState, useState } from "react";
import {
  createBookingAction,
  type BookingFormState,
} from "@/adapters/driving/actions/booking.actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/Field";
import { ClockIcon } from "@/components/ui/Icons";
import { TextInput } from "@/components/ui/TextInput";
import { TimePicker } from "@/components/ui/TimePicker";
import { addMinutesClamped, formatDuration, minutesBetween } from "@/components/ui/time-utils";
import { todayISO } from "@/components/ui/date-utils";
import type { ISODate, TimeString } from "@/components/ui/types";

/** ช่วงที่ถูกจองไปแล้ว แปลงเป็น string ตั้งแต่ฝั่ง server เพื่อไม่ให้ timezone เพี้ยนระหว่างทาง */
export interface BookedSlot {
  date: ISODate;
  start: TimeString;
  end: TimeString;
  title: string;
}

const initialState: BookingFormState = {};

const DURATION_PRESETS = [30, 60, 90, 120];

function overlapsBooked(
  slots: BookedSlot[],
  date: ISODate,
  start: TimeString,
  end: TimeString,
): BookedSlot | undefined {
  /* เทียบ "HH:MM" ด้วย string ตรงๆ ได้ เพราะ zero-padded 24 ชม. เรียงตามพจนานุกรมถูกอยู่แล้ว */
  return slots.find((s) => s.date === date && start < s.end && s.start < end);
}

export function BookingForm({
  roomId,
  bookedSlots,
}: {
  roomId: string;
  bookedSlots: BookedSlot[];
}) {
  const [state, formAction, pending] = useActionState(createBookingAction, initialState);

  /* คำนวณจากเวลาท้องถิ่น ไม่ใช่ toISOString() — ไม่งั้นหลังห้าทุ่มที่ไทยจะได้วันของเมื่อวาน */
  const today = todayISO();

  const [date, setDate] = useState<ISODate>(today);
  const [startTime, setStartTime] = useState<TimeString>("");
  const [endTime, setEndTime] = useState<TimeString>("");

  function handleStartChange(next: TimeString) {
    setStartTime(next);
    /* เวลาสิ้นสุดเดิมอาจกลายเป็นค่าที่เป็นไปไม่ได้ ล้างทิ้งแทนที่จะปล่อยให้ผู้ใช้ไปเจอ error ตอน submit */
    if (endTime && endTime <= next) setEndTime("");
  }

  const slotsForDate = bookedSlots.filter((s) => s.date === date);
  const duration = startTime && endTime ? minutesBetween(startTime, endTime) : 0;
  const conflict =
    startTime && endTime ? overlapsBooked(bookedSlots, date, startTime, endTime) : undefined;

  return (
    <form action={formAction} className="card flex flex-col gap-5">
      <input type="hidden" name="roomId" value={roomId} />

      <Field label="หัวข้อการจอง" required>
        <TextInput type="text" name="title" placeholder="เช่น ประชุมทีม" required />
      </Field>

      <Field label="วันที่" required>
        <DatePicker name="date" value={date} onValueChange={setDate} min={today} required />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="เวลาเริ่ม" required>
          <TimePicker name="startTime" value={startTime} onValueChange={handleStartChange} required />
        </Field>
        <Field label="เวลาสิ้นสุด" required>
          <TimePicker
            name="endTime"
            value={endTime}
            onValueChange={setEndTime}
            min={startTime || undefined}
            includeCloseHour
            required
          />
        </Field>
      </div>

      {startTime && (
        <div className="flex flex-col gap-2">
          <span className="field-label">ระยะเวลาที่ใช้บ่อย</span>
          <div className="flex flex-wrap gap-2">
            {DURATION_PRESETS.map((minutes) => {
              const target = addMinutesClamped(startTime, minutes);
              return (
                <button
                  key={minutes}
                  type="button"
                  className="chip"
                  aria-pressed={endTime === target}
                  onClick={() => setEndTime(target)}
                >
                  {formatDuration(minutes)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {duration > 0 && !conflict && (
        <Alert variant="info">
          ช่วงที่เลือกยังว่าง — {startTime}–{endTime} ({formatDuration(duration)})
        </Alert>
      )}

      {/*
        เตือนล่วงหน้าเฉยๆ เพื่อไม่ให้ผู้ใช้เสียเวลากดแล้วโดนปฏิเสธ
        กฎจริงเรื่องจองชนกันอยู่ที่ core/use-cases/create-booking.use-case.ts และมี
        transaction re-check ที่ adapter อีกชั้น — ที่นี่ไม่ใช่การ validate
      */}
      {conflict && (
        <Alert variant="warning">
          ช่วงนี้ชนกับ “{conflict.title}” ({conflict.start}–{conflict.end}) กดยืนยันไปจะถูกปฏิเสธ
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <span className="field-label">ช่วงที่ถูกจองแล้วในวันที่เลือก</span>
        {slotsForDate.length === 0 ? (
          <p className="field-hint">ยังไม่มีใครจองห้องนี้ในวันนี้</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {slotsForDate.map((slot) => (
              <li
                key={`${slot.start}-${slot.end}-${slot.title}`}
                className="flex items-center gap-2 rounded-control bg-card px-3 py-2 text-sm text-muted"
              >
                <ClockIcon className="size-4 shrink-0" />
                <span className="font-medium text-foreground tabular-nums">
                  {slot.start}–{slot.end}
                </span>
                <span className="truncate">{slot.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {state.error && <Alert>{state.error}</Alert>}

      <Button type="submit" loading={pending}>
        {pending ? "กำลังจอง..." : "ยืนยันการจอง"}
      </Button>
    </form>
  );
}
