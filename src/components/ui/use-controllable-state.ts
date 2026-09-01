"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * ให้ component เดียวรองรับทั้งแบบ controlled (`value`) และ uncontrolled (`defaultValue`)
 *
 * จำเป็นเพราะ call site ในแอปนี้มีทั้งสองแบบจริงๆ:
 *  - ThemeSwitcher เป็น controlled (ค่าอยู่ใน zustand store)
 *  - ฟอร์มกรองห้องในหน้าปฏิทินเป็น uncontrolled (ปล่อยให้ native GET form อ่านค่าเอง)
 */
export function useControllableState<T>(
  controlled: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void,
): [T, (next: T) => void] {
  const [uncontrolled, setUncontrolled] = useState<T>(defaultValue);
  const isControlled = controlled !== undefined;

  /*
   * เก็บ onChange ไว้ใน ref เพื่อให้ setValue ไม่เปลี่ยน identity ทุกครั้งที่ parent สร้าง callback ใหม่
   * เขียนค่าใน effect ไม่ใช่ระหว่าง render — ref ตั้งใจให้แตะได้หลัง commit เท่านั้น
   * (setValue ถูกเรียกจาก event handler เสมอ ซึ่งเกิดหลัง effect รอบนั้นไปแล้ว)
   */
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) {
        setUncontrolled(next);
      }
      onChangeRef.current?.(next);
    },
    [isControlled],
  );

  return [isControlled ? controlled : uncontrolled, setValue];
}
