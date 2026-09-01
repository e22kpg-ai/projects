"use client";

import { useEffect, useRef } from "react";

/*
 * ปิดชั้นลอยด้วย Esc หรือคลิกข้างนอก
 *
 * หัวใจอยู่ที่ stack ระดับ module: มีแต่ตัวบนสุดเท่านั้นที่ตอบ Esc
 * ไม่งั้นกด Esc ตอนเปิด Select อยู่ใน Modal จะปิดทั้งคู่พร้อมกัน
 * ซึ่งเป็นพฤติกรรมที่คนใช้เกลียดที่สุดของ dialog ที่เขียนเอง
 */
const dismissStack: symbol[] = [];

interface DismissOptions {
  active: boolean;
  onDismiss: () => void;
  /** กล่องที่ถือว่า "ข้างใน" — ต้องใส่ทั้ง trigger และ popover ที่ portal ออกไปแล้ว */
  refs: Array<React.RefObject<HTMLElement | null>>;
  /** ปิดเมื่อคลิกข้างนอกหรือไม่ (Modal ปิดที่ backdrop เองจึงตั้งเป็น false) */
  outsidePointer?: boolean;
}

export function useDismiss({ active, onDismiss, refs, outsidePointer = true }: DismissOptions) {
  /*
   * onDismiss กับ refs ถูกสร้างใหม่ทุก render (array literal ที่ call site)
   * ถ้าใส่ใน deps ตรงๆ effect จะ subscribe/unsubscribe รัวทุก render
   * จึงเก็บค่าล่าสุดไว้ใน ref แล้วให้ deps เหลือแค่สิ่งที่เปลี่ยนพฤติกรรมจริง
   */
  const onDismissRef = useRef(onDismiss);
  const refsRef = useRef(refs);

  /* เขียนค่าใน effect ไม่ใช่ระหว่าง render — listener ข้างล่างอ่านค่าตอนมี event เท่านั้น จึงได้ค่าล่าสุดเสมอ */
  useEffect(() => {
    onDismissRef.current = onDismiss;
    refsRef.current = refs;
  });

  useEffect(() => {
    if (!active) return;

    const token = Symbol("dismissable");
    dismissStack.push(token);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (dismissStack[dismissStack.length - 1] !== token) return;
      event.preventDefault();
      event.stopPropagation();
      onDismissRef.current();
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      const inside = refsRef.current.some((ref) => ref.current?.contains(target));
      if (!inside) onDismissRef.current();
    }

    document.addEventListener("keydown", handleKeyDown, true);
    if (outsidePointer) {
      document.addEventListener("pointerdown", handlePointerDown, true);
    }

    return () => {
      const index = dismissStack.indexOf(token);
      if (index > -1) dismissStack.splice(index, 1);
      document.removeEventListener("keydown", handleKeyDown, true);
      if (outsidePointer) {
        document.removeEventListener("pointerdown", handlePointerDown, true);
      }
    };
  }, [active, outsidePointer]);
}
