import type { SelectOption, TimeString } from "./types";

/*
 * ค่าคงที่และฟังก์ชันเวลาของระบบจอง — ไม่มี directive เพราะ CalendarGrid (Server Component) ต้องใช้
 *
 * ก่อนหน้านี้ค่าพวกนี้ประกาศซ้ำอยู่ใน CalendarGrid.tsx ทำให้ตารางปฏิทินกับตัวเลือกเวลาในฟอร์ม
 * มีโอกาสหลุดจากกันได้ — ย้ายมาไว้ที่เดียวแล้วทั้งสองฝั่งอ้างอิงตัวเดียวกัน
 *
 * เทียบเวลาด้วย string comparison ได้ตรงๆ เพราะ "HH:MM" แบบ 24 ชม. zero-padded
 * เรียงตามพจนานุกรมตรงกับเรียงตามเวลาพอดี
 */

/*
 * ค่าคงที่เวลาทำการย้ายไปอยู่ที่ core/domain/booking-rules.ts แล้ว เพราะเป็นกฎธุรกิจ
 * ที่ use-case ต้องบังคับจริงฝั่ง server ไม่ใช่แค่ตัดตัวเลือกในหน้าจอ
 * re-export ต่อที่นี่เพื่อให้ฝั่ง UI ยัง import จากที่เดิมได้เหมือนเดิม
 */
import { OPEN_HOUR, CLOSE_HOUR, SLOT_MINUTES } from "@/core/domain/booking-rules";

export { OPEN_HOUR, CLOSE_HOUR, SLOT_MINUTES };

export const TOTAL_SLOTS = ((CLOSE_HOUR - OPEN_HOUR) * 60) / SLOT_MINUTES;

/** index ช่อง → "HH:MM" (0 = เวลาเปิดทำการ) */
export function slotLabel(index: number): TimeString {
  const totalMinutes = OPEN_HOUR * 60 + index * SLOT_MINUTES;
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

interface TimeSlotOptions {
  /** ตัดตัวเลือกที่เร็วกว่าเวลานี้ทิ้ง */
  min?: TimeString;
  /** true = ยอมให้เท่ากับ min ได้ (default false สำหรับเวลาสิ้นสุดที่ต้องมากกว่าเวลาเริ่ม) */
  minInclusive?: boolean;
  /** รวมเวลาปิดทำการเป็นตัวเลือกด้วย (เวลาสิ้นสุดต้องเลือก 18:00 ได้) */
  includeCloseHour?: boolean;
}

/**
 * รายการช่วงเวลาทุก 30 นาทีตามเวลาทำการ
 *
 * ⚠️ `min` ที่นี่เป็นแค่ affordance ที่ตัดตัวเลือกที่รู้อยู่แล้วว่าจะพังออกไป
 *    กฎจริงว่า endTime ต้องมากกว่า startTime อยู่ที่ core/use-cases/create-booking.use-case.ts
 *    ห้ามย้ายกฎมาไว้ที่นี่ และห้ามถือว่านี่คือการ validate
 */
export function buildTimeSlots(options: TimeSlotOptions = {}): SelectOption[] {
  const { min, minInclusive = false, includeCloseHour = false } = options;
  const count = includeCloseHour ? TOTAL_SLOTS + 1 : TOTAL_SLOTS;

  const slots: SelectOption[] = [];
  for (let i = includeCloseHour ? 1 : 0; i < count; i++) {
    const label = slotLabel(i);
    if (min) {
      if (minInclusive ? label < min : label <= min) continue;
    }
    slots.push({ value: label, label });
  }
  return slots;
}

/** Date → "HH:MM" ตามเวลาท้องถิ่น (เหมือน toISODate คือห้ามใช้ toISOString) */
export function formatTimeOfDay(date: Date): TimeString {
  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

/** ผลต่างเป็นนาทีระหว่างสองเวลาในวันเดียวกัน */
export function minutesBetween(start: TimeString, end: TimeString): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

/** บวกนาทีให้เวลา แล้วหนีบไม่ให้เกินเวลาปิดทำการ */
export function addMinutesClamped(time: TimeString, minutes: number): TimeString {
  const [h, m] = time.split(":").map(Number);
  const total = Math.min(h * 60 + m + minutes, CLOSE_HOUR * 60);
  return `${Math.floor(total / 60)
    .toString()
    .padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
}

/** "1 ชม. 30 น." — ใช้แสดงสรุปช่วงที่เลือก */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} นาที`;
  if (mins === 0) return `${hours} ชั่วโมง`;
  return `${hours} ชม. ${mins} น.`;
}
