"use client";

import { useState } from "react";
import { cx } from "./cx";
import { useFieldControl } from "./field-context";
import { EyeIcon, EyeOffIcon } from "./Icons";

/*
 * ช่องรหัสผ่านที่มีปุ่มดู/ซ่อนในตัว
 *
 * ปุ่มอยู่ในกล่อง .input-affix เดียวกับ input เพื่อให้ ring ตอนโฟกัสล้อมทั้งกล่อง
 * (คลาสนั้นใช้ has-[input:focus-visible] จับโฟกัสของ input ข้างใน ไม่ใช่ focus-within
 *  เพื่อไม่ให้กดปุ่มดูรหัสแล้ว ring ค้าง)
 *
 * ปุ่มเป็น type="button" เสมอ — ถ้าลืมใส่ กดดูรหัสแล้วฟอร์มจะ submit ทันที
 */
export interface PasswordInputProps
  extends Omit<React.ComponentPropsWithRef<"input">, "type"> {
  className?: string;
}

export function PasswordInput({
  className,
  id,
  required,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...rest
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const a11y = useFieldControl({
    id,
    required,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid === true || ariaInvalid === "true",
  });

  return (
    <div className={cx("input-affix", className)}>
      <input
        {...rest}
        {...a11y}
        type={visible ? "text" : "password"}
        className="input-bare"
      />
      <button
        type="button"
        className="input-affix-btn"
        aria-label={visible ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}
