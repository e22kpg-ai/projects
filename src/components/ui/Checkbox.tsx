"use client";

import { useEffect, useRef } from "react";
import { cx } from "./cx";
import { CheckIcon } from "./Icons";

/*
 * Checkbox ที่ควบคุมหน้าตาได้ 100% แต่ข้างในยังเป็น <input type="checkbox"> จริง
 *
 * ทำไมถึงไม่ทำเป็น <div role="checkbox"> แบบ custom เต็มเหมือน Select:
 *  1. ทุก call site ในแอปนี้ส่งฟอร์มผ่าน FormData — native checkbox ส่ง name=value เมื่อติ๊ก
 *     และไม่ส่ง key เลยเมื่อไม่ติ๊ก ให้ฟรี ถ้าทำเองต้องเขียนกฎนี้เองซึ่งพลาดง่ายมาก
 *  2. ได้ label click, form.reset(), :indeterminate, autofill และ native required มาครบ
 *  3. Tailwind v4 มี peer-checked / peer-focus-visible / peer-disabled เป็น first-class
 *     สไตล์ทั้งหมดจึงเป็น CSS ล้วน ไม่ต้องเขียน JS สักบรรทัด
 *
 * ต่างจาก Select ที่ต้อง custom เต็มเพราะ native <select> สไตล์ตัว dropdown ไม่ได้จริงๆ
 * — นี่คือเส้นแบ่งว่าเมื่อไหร่ควรเขียนเอง เมื่อไหร่ควรห่อของเดิม
 */
export interface CheckboxProps extends Omit<React.ComponentPropsWithRef<"input">, "type"> {
  label?: React.ReactNode;
  /** สถานะ "ติ๊กบางส่วน" — ไม่มี attribute ใน HTML ต้องเซ็ตผ่าน DOM property */
  indeterminate?: boolean;
}

export function Checkbox({ label, indeterminate, className, ...rest }: CheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate ?? false;
    }
  }, [indeterminate]);

  return (
    <label className={cx("control-row", className)}>
      <input ref={inputRef} type="checkbox" className="peer sr-only" {...rest} />
      <span className="checkbox-box" aria-hidden="true">
        <CheckIcon className="control-mark size-3" />
      </span>
      {label}
    </label>
  );
}
