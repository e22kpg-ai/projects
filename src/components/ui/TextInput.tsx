"use client";

import { cx } from "./cx";
import { useFieldControl } from "./field-context";

/*
 * ช่องกรอกข้อความมาตรฐาน — ยังเป็น <input> จริงอยู่ข้างใน
 *
 * ตรงนี้ไม่ต้อง custom เต็มเหมือน Select เพราะ <input type="text"> สไตล์ได้ครบทุกส่วนอยู่แล้ว
 * สิ่งที่ component เพิ่มให้คือการต่อสาย a11y เข้ากับ <Field> ซึ่งเป็นของที่เดิมไม่มีเลย
 */
export interface TextInputProps extends React.ComponentPropsWithRef<"input"> {
  className?: string;
}

export function TextInput({
  className,
  id,
  required,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...rest
}: TextInputProps) {
  const a11y = useFieldControl({
    id,
    required,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid === true || ariaInvalid === "true",
  });

  return <input {...rest} {...a11y} className={cx("input", className)} />;
}
