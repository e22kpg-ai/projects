"use client";

import { useEffect } from "react";

/*
 * ล็อกไม่ให้หน้าเลื่อนตอนเปิดชั้นลอยเต็มจอ
 *
 * สองรายละเอียดที่มักพลาด:
 *  1. ต้องนับ ref-count ที่ระดับ module — ไม่งั้น modal ซ้อน modal พอปิดตัวในแล้ว
 *     หน้าจะปลดล็อกทั้งที่ตัวนอกยังเปิดอยู่
 *  2. ต้องชดเชยความกว้าง scrollbar ที่หายไป ไม่งั้นเนื้อหาทั้งหน้ากระตุกไปทางขวาตอนเปิด
 */
let lockCount = 0;
let savedOverflow = "";
let savedPaddingRight = "";

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    if (lockCount === 0) {
      const { body, documentElement } = document;
      savedOverflow = body.style.overflow;
      savedPaddingRight = body.style.paddingRight;

      const scrollbarWidth = window.innerWidth - documentElement.clientWidth;
      body.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }
    lockCount += 1;

    return () => {
      lockCount -= 1;
      if (lockCount === 0) {
        /* คืนค่า inline style เดิมเป๊ะๆ ไม่ใช่เซ็ตเป็นค่าว่าง เผื่อหน้ามีการตั้งไว้อยู่ก่อน */
        document.body.style.overflow = savedOverflow;
        document.body.style.paddingRight = savedPaddingRight;
      }
    };
  }, [active]);
}
