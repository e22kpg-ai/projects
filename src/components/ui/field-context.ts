"use client";

import { createContext, useContext, useId } from "react";

/**
 * สะพานระหว่าง <Field> กับ control ข้างใน
 *
 * ทำไมใช้ context ไม่ใช่ cloneElement หรือ render-prop:
 * Select/DatePicker/TimePicker เรนเดอร์หลาย element (ตัว trigger + hidden input + popover ที่ portal ออกไป)
 * การยัด a11y prop ก้อนเดียวเข้าไปแล้วให้ตัวมันกระจายเองสะอาดกว่า และ call site อ่านง่ายกว่ามาก
 *
 * ราคาที่จ่ายคือ control ต้องเป็นลูกหลานของ Field (สัญญาแบบ implicit)
 * จึงต้องออกแบบให้ทุก control ทำงานได้ปกติเมื่อไม่มี Field ครอบ — ตกไปใช้ useId() ของตัวเอง
 */
export interface FieldA11y {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": true | undefined;
  required: boolean | undefined;
}

export const FieldContext = createContext<FieldA11y | null>(null);

export interface OwnFieldProps {
  id?: string;
  required?: boolean;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

/**
 * ค่าที่ส่งมาทาง prop ตรงๆ ชนะ context เสมอ ตามด้วย context แล้วค่อยตกมาที่ค่า default ของตัวเอง
 */
export function useFieldControl(own?: OwnFieldProps): FieldA11y {
  const field = useContext(FieldContext);
  const fallbackId = useId();

  return {
    id: own?.id ?? field?.id ?? fallbackId,
    "aria-describedby": own?.["aria-describedby"] ?? field?.["aria-describedby"],
    "aria-invalid": (own?.["aria-invalid"] ? true : undefined) ?? field?.["aria-invalid"],
    required: own?.required ?? field?.required,
  };
}
