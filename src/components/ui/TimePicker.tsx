"use client";

import { ClockIcon } from "./Icons";
import { Select } from "./Select";
import { buildTimeSlots } from "./time-utils";
import type { Size, TimeString } from "./types";

/*
 * ตัวเลือกเวลา — เป็น wrapper บางๆ ของ Select ไม่ใช่ widget ใหม่
 *
 * ระบบจองนี้ล็อกช่วงเวลาไว้ที่ทุก 30 นาทีในเวลาทำการอยู่แล้ว (ดู time-utils.ts)
 * การให้พิมพ์เวลาอิสระแบบ <input type="time"> จึงเปิดช่องให้กรอกเวลาที่ระบบรับไม่ได้ตั้งแต่แรก
 * เปลี่ยนเป็นรายการช่วงเวลาให้เลือกแทน ทั้งคุมหน้าตาได้และลดโอกาสกรอกผิดไปพร้อมกัน
 */
export interface TimePickerProps {
  name?: string;
  value?: TimeString;
  defaultValue?: TimeString;
  onValueChange?: (value: TimeString) => void;
  /** ตัดตัวเลือกที่เร็วกว่านี้ทิ้ง เช่นเวลาสิ้นสุดต้องหลังเวลาเริ่ม */
  min?: TimeString;
  minInclusive?: boolean;
  /** ให้เลือกเวลาปิดทำการได้ (เวลาสิ้นสุดต้องเลือก 18:00 ได้) */
  includeCloseHour?: boolean;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  form?: string;
  size?: Size;
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

export function TimePicker({
  min,
  minInclusive,
  includeCloseHour,
  placeholder = "เลือกเวลา",
  ...rest
}: TimePickerProps) {
  const options = buildTimeSlots({ min, minInclusive, includeCloseHour });

  return (
    <Select
      {...rest}
      options={options}
      placeholder={placeholder}
      icon={<ClockIcon className="size-4 shrink-0 text-muted" />}
    />
  );
}
