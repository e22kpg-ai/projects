"use client";

import { useId } from "react";
import { cx } from "./cx";
import { FieldContext } from "./field-context";

/*
 * ห่อ label + control + คำอธิบาย + ข้อความ error ไว้ด้วยกัน แล้วต่อสาย a11y ให้อัตโนมัติ
 *
 * ก่อนหน้านี้ทั้งแอปไม่มี input ตัวไหนมี id / aria-describedby / aria-invalid เลยสักตัว
 * label ใช้วิธีครอบ (implicit) ซึ่งพอ control กลายเป็น <button role="combobox"> แบบ Select ตัวใหม่แล้วใช้ไม่ได้
 */

export interface FieldProps {
  label: React.ReactNode;
  hint?: React.ReactNode;
  /** มีค่าเมื่อไหร่ = control กลายเป็น aria-invalid โดยอัตโนมัติ */
  error?: React.ReactNode;
  required?: boolean;
  /** ทางออกฉุกเฉินเมื่อ control ข้างในกำหนด id ของตัวเองไว้แล้ว */
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

export function Field({
  label,
  hint,
  error,
  required,
  htmlFor,
  className,
  children,
}: FieldProps) {
  const uid = useId();
  const id = htmlFor ?? `${uid}c`;
  const hintId = `${uid}h`;
  const errorId = `${uid}e`;

  const describedBy = [hint ? hintId : null, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cx("field", className)}>
      <label className="field-label" htmlFor={id}>
        {label}
        {required && (
          <span className="field-required" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <FieldContext
        value={{
          id,
          "aria-describedby": describedBy,
          "aria-invalid": error ? true : undefined,
          required,
        }}
      >
        {children}
      </FieldContext>

      {hint && (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      )}

      {/*
        ย่อหน้า error ถูกเรนเดอร์ทิ้งไว้เสมอ (ว่างแล้วซ่อนเองด้วย .form-error:empty)
        ไม่ใช่ {error && <p>} เพราะ useActionState ทำให้ error โผล่มาหลัง submit
        ถ้า node เพิ่ง mount ตอนนั้น screen reader จะอ่านบ้างไม่อ่านบ้าง
        การประกาศ aria-live ไว้บน node ที่อยู่มาก่อนแล้วเชื่อถือได้กว่ามาก
      */}
      <p id={errorId} className="form-error" aria-live="polite">
        {error}
      </p>
    </div>
  );
}
