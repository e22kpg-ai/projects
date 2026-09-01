"use client";

import { createContext, useContext } from "react";
import { cx } from "./cx";
import { useControllableState } from "./use-controllable-state";

/*
 * RadioGroup กับ Radio อยู่ไฟล์เดียวกันเพราะ Radio ใช้เดี่ยวๆ ไม่ได้อยู่แล้ว
 * (native radio ต้องมี name ร่วมกันถึงจะจับกลุ่ม) แยกไฟล์จะได้แค่ context ไฟล์ที่สามโดยไม่ได้อะไร
 *
 * ★ ไม่มีโค้ดจัดการคีย์บอร์ดสักบรรทัด — เบราว์เซอร์แถม arrow-key roving ของ radio group มาให้เอง
 *   นี่คือส่วนต่างที่ชัดที่สุดระหว่าง "ห่อ native" กับ "เขียนเอง" อย่าง Select
 *   ที่ต้องเขียน keyboard handler ยาวเป็นหน้า
 *
 * ใช้ <div role="radiogroup"> ไม่ใช่ <fieldset> เพื่อเลี่ยง default style ของ fieldset
 * ที่ต้อง reset ทิ้งทุกครั้ง
 */

interface RadioGroupContextValue {
  name: string;
  value: string;
  setValue: (value: string) => void;
  disabled?: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export interface RadioGroupProps {
  name: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
  children: React.ReactNode;
}

export function RadioGroup({
  name,
  value,
  defaultValue,
  onValueChange,
  disabled,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  className,
  children,
}: RadioGroupProps) {
  const [current, setCurrent] = useControllableState(value, defaultValue ?? "", onValueChange);

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={cx("flex flex-col gap-2", className)}
    >
      <RadioGroupContext value={{ name, value: current, setValue: setCurrent, disabled }}>
        {children}
      </RadioGroupContext>
    </div>
  );
}

export interface RadioProps {
  value: string;
  label?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function Radio({ value, label, disabled, className }: RadioProps) {
  const group = useContext(RadioGroupContext);
  if (!group) {
    throw new Error("<Radio> ต้องอยู่ใน <RadioGroup>");
  }

  return (
    <label className={cx("control-row", className)}>
      <input
        type="radio"
        className="peer sr-only"
        name={group.name}
        value={value}
        checked={group.value === value}
        disabled={disabled || group.disabled}
        onChange={() => group.setValue(value)}
      />
      <span className="radio-box" aria-hidden="true">
        <span className="control-mark size-1.5 rounded-pill bg-current" />
      </span>
      {label}
    </label>
  );
}
