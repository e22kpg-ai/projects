"use client";

import type { ReactNode } from "react";
import { cx } from "./cx";
import type { SelectOption } from "./types";
import { useControllableState } from "./use-controllable-state";

/*
 * กลุ่มปุ่มตัวเลือกแบบเลือกได้อย่างเดียว — ข้างในเป็น native radio ที่ซ่อนไว้
 *
 * ของเดิมใน ThemeSwitcher ใช้ <button aria-pressed> สามตัว ซึ่งอ่านว่า "ปุ่ม toggle สามอัน"
 * ไม่ใช่ "ตัวเลือกสามอันที่เลือกได้อันเดียว" และต้องเขียน roving tabindex เอง
 *
 * พอเปลี่ยนมาใช้ radio ที่ซ่อนไว้ เบราว์เซอร์แถม arrow-key navigation, semantics ที่ถูกต้อง
 * และความสามารถในการอยู่ในฟอร์มจริงมาให้ฟรี — ไม่ต้องเขียน JS จัดการคีย์บอร์ดแม้แต่บรรทัดเดียว
 */

/*
 * ใส่ icon มาด้วยก็ได้ ตัวเลือกจะกลายเป็นไอคอนล้วนทันที (ประหยัดที่บนแถบ nav)
 * แต่ label ยังบังคับให้มีเสมอ เพราะมันคือ accessible name ของ radio ตัวนั้น (ซ่อนด้วย sr-only)
 * และเป็น tooltip ให้คนใช้เมาส์ — ห้ามมีตัวเลือกที่สื่อความหมายด้วยรูปเพียงอย่างเดียว
 */
export interface SegmentedControlOption extends SelectOption {
  icon?: ReactNode;
}

export interface SegmentedControlProps {
  /** native radio ต้องมี name ถึงจะจับกลุ่มกันได้ */
  name: string;
  options: SegmentedControlOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  "aria-label": string;
  className?: string;
}

export function SegmentedControl({
  name,
  options,
  value,
  defaultValue,
  onValueChange,
  "aria-label": ariaLabel,
  className,
}: SegmentedControlProps) {
  const [current, setCurrent] = useControllableState(
    value,
    defaultValue ?? options[0]?.value ?? "",
    onValueChange,
  );

  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cx("segmented", className)}>
      {options.map((option) => (
        <label key={option.value} className="inline-flex">
          <input
            type="radio"
            className="peer sr-only"
            name={name}
            value={option.value}
            checked={option.value === current}
            disabled={option.disabled}
            onChange={() => setCurrent(option.value)}
          />
          {option.icon ? (
            <span className="segment-label segment-icon" title={option.label}>
              {option.icon}
              <span className="sr-only">{option.label}</span>
            </span>
          ) : (
            <span className="segment-label">{option.label}</span>
          )}
        </label>
      ))}
    </div>
  );
}
