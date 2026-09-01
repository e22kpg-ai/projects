"use client";

import { cloneElement, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAnchoredPosition } from "./use-anchored-position";

/*
 * คำอธิบายสั้นๆ ตอนชี้หรือโฟกัส
 *
 * ⚠️ กติกาการใช้: ข้อมูลที่จำเป็นต่อการตัดสินใจห้ามอยู่ใน tooltip อย่างเดียว
 *    บนมือถือไม่มี hover คนใช้ touch จะไม่มีวันเห็น — ที่นี่จึงซ่อนทันทีที่มีการแตะ
 *
 * โครงสร้าง: ห่อ trigger ด้วย <span class="inline-flex"> ที่ถือ ref และ event handler ไว้เอง
 * แล้วส่งลงไปให้ลูกเฉพาะ aria-describedby ผ่าน cloneElement
 *
 * ทำไมไม่ส่ง ref ลงไปทาง cloneElement ทั้งที่จะได้ไม่ต้องมี span ตัวห่อ:
 *   การยื่น ref ให้ฟังก์ชันตอน render เปิดช่องให้ฟังก์ชันนั้นอ่าน .current ระหว่าง render
 *   ซึ่งผิดกฎของ React (eslint react-hooks/refs จับได้) — span ที่เพิ่มมาเป็น inline-flex
 *   จึงแทบไม่กระทบ layout และแลกมาด้วยความถูกต้อง
 *
 * aria-describedby ยังไปอยู่บน element ที่โฟกัสได้จริง ไม่ใช่บน span ตัวห่อ
 * ไม่งั้น screen reader จะไม่อ่านคำอธิบายให้เลย
 */

type TriggerElement = React.ReactElement<{ "aria-describedby"?: string }>;

export interface TooltipProps {
  content: React.ReactNode;
  children: TriggerElement;
  /** หน่วงเฉพาะตอนชี้ด้วยเมาส์ — โฟกัสด้วยคีย์บอร์ดแสดงทันที ไม่ควรต้องรอ */
  delay?: number;
}

export function Tooltip({ content, children, delay = 400 }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const floatingRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef(0);
  const tooltipId = useId();

  useAnchoredPosition(anchorRef, floatingRef, open, { placement: "top-start", offset: 6 });

  function show(immediate: boolean) {
    window.clearTimeout(timerRef.current);
    if (immediate) {
      setOpen(true);
      return;
    }
    timerRef.current = window.setTimeout(() => setOpen(true), delay);
  }

  function hide() {
    window.clearTimeout(timerRef.current);
    setOpen(false);
  }

  return (
    <>
      <span
        ref={anchorRef}
        className="inline-flex"
        onPointerEnter={(event) => {
          if (event.pointerType !== "touch") show(false);
        }}
        onPointerLeave={hide}
        onPointerDown={hide}
        /* React map onFocus/onBlur ไปที่ focusin/focusout ซึ่ง bubble ขึ้นมาถึง span ตัวห่อ */
        onFocus={() => show(true)}
        onBlur={hide}
      >
        {cloneElement(children, {
          /* ใส่ idref เฉพาะตอนเปิด — ชี้ไปยัง node ที่ไม่มีอยู่จริงแย่กว่าการไม่ใส่เลย */
          "aria-describedby": open ? tooltipId : undefined,
        })}
      </span>

      {open &&
        createPortal(
          <div ref={floatingRef} id={tooltipId} role="tooltip" className="tooltip anchored">
            {content}
          </div>,
          document.body,
        )}
    </>
  );
}
