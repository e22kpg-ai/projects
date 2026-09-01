"use client";

import { cx } from "./cx";

/*
 * สวิตช์เปิด/ปิด — native checkbox ที่ใส่ role="switch"
 *
 * role="switch" บน <input type="checkbox"> ถูกต้องตามสเปกและ screen reader รองรับดี
 * จึงได้ semantics ที่ตรงกว่า พร้อมข้อดีของ native ครบเหมือน Checkbox โดยไม่เสียอะไรเลย
 */
export interface SwitchProps extends Omit<React.ComponentPropsWithRef<"input">, "type" | "role"> {
  label?: React.ReactNode;
}

export function Switch({ label, className, ...rest }: SwitchProps) {
  return (
    <label className={cx("control-row", className)}>
      <input type="checkbox" role="switch" className="peer sr-only" {...rest} />
      <span className="switch-track" aria-hidden="true">
        <span className="switch-thumb" />
      </span>
      {label}
    </label>
  );
}
