"use client";

import { useCallback, useLayoutEffect } from "react";

/*
 * วางตำแหน่งชั้นลอยให้เกาะกับ trigger — เขียนเอง ไม่ลง positioning library
 *
 * ทำไมเลือก portal ไป body + position:fixed แทน absolute ในกล่อง relative:
 *  1. CalendarGrid ห่ออยู่ใน overflow-x-auto และบล็อกการจองมี overflow-hidden
 *     popover ที่วางแบบ absolute ในนั้นจะโดน clip ทันที เจอทีหลังแล้วต้องรื้อ DOM ทั้งก้อน
 *  2. เมื่อทุกชั้นลอย portal ไป body หมด สงคราม z-index ก็จบ
 *     คุมด้วย --ds-z-popover / -modal / -toast ชั้นเดียวพอ
 *
 * ทำไมเขียนลง element.style ตรงๆ แทนที่จะเก็บตำแหน่งไว้ใน state:
 *  - ตอน scroll ต้องคำนวณใหม่ทุกเฟรม ถ้าใช้ state จะ re-render React ทั้ง subtree ตามไปด้วย
 *  - และถ้า React มี inline style ของตัวเองอยู่ พอ component re-render ด้วยเหตุอื่น
 *    (เช่น activeIndex ของ Select เปลี่ยน) React จะเขียนทับตำแหน่งที่เราคำนวณไว้ทิ้ง
 *  ตำแหน่งเริ่มต้นกับ visibility: hidden มาจากคลาส .anchored ใน index.css
 *
 * CSS anchor positioning ตัดทิ้งเพราะ Safari กับ Firefox ยังไม่พร้อม
 *
 * หมายเหตุเรื่องกติกา: ค่าที่เขียนลง style คือ top/left/minWidth ที่คำนวณจาก
 * getBoundingClientRect() เท่านั้น เข้าข้อยกเว้น "layout ที่คำนวณแบบ dynamic" ของ CLAUDE.md
 * สี/ระยะห่าง/ตัวอักษร ยังห้าม inline เหมือนเดิม
 */

export type Placement = "bottom-start" | "bottom-end" | "top-start" | "top-end";

interface AnchoredOptions {
  placement?: Placement;
  /** ระยะห่างจาก trigger */
  offset?: number;
  /** ให้ popover กว้างอย่างน้อยเท่า trigger (minWidth ไม่ใช่ width — ป้ายไทยยาวกว่า trigger บ่อย) */
  matchWidth?: boolean;
  /** ระยะเผื่อจากขอบจอ */
  gutter?: number;
}

export function useAnchoredPosition(
  anchorRef: React.RefObject<HTMLElement | null>,
  floatingRef: React.RefObject<HTMLElement | null>,
  open: boolean,
  options: AnchoredOptions = {},
): void {
  const { placement = "bottom-start", offset = 4, matchWidth = false, gutter = 8 } = options;

  const compute = useCallback(() => {
    const anchor = anchorRef.current;
    const floating = floatingRef.current;
    if (!anchor || !floating) return;

    const a = anchor.getBoundingClientRect();
    const f = floating.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const spaceBelow = vh - a.bottom - offset;
    const spaceAbove = a.top - offset;

    /* พลิกขึ้นบนเมื่อข้างล่างไม่พอและข้างบนเหลือมากกว่า */
    const preferTop = placement.startsWith("top");
    const flipUp = preferTop
      ? spaceAbove >= f.height || spaceAbove > spaceBelow
      : spaceBelow < f.height && spaceAbove > spaceBelow;

    const rawTop = flipUp ? a.top - f.height - offset : a.bottom + offset;
    const top = Math.max(gutter, Math.min(rawTop, vh - f.height - gutter));

    const rawLeft = placement.endsWith("end") ? a.right - f.width : a.left;
    const left = Math.max(gutter, Math.min(rawLeft, vw - f.width - gutter));

    if (matchWidth) floating.style.minWidth = `${a.width}px`;
    floating.style.top = `${top}px`;
    floating.style.left = `${left}px`;
    floating.style.visibility = "visible";
  }, [anchorRef, floatingRef, placement, offset, matchWidth, gutter]);

  useLayoutEffect(() => {
    if (!open) return;

    /* วัดและวางก่อน paint — ผู้ใช้จึงไม่มีทางเห็นเฟรมที่ตำแหน่งยังผิด */
    compute();

    /* capture = true เพื่อให้จับ scroll ของ container ลูกด้วย ไม่ใช่แค่ของหน้าต่าง */
    window.addEventListener("scroll", compute, true);
    window.addEventListener("resize", compute);

    /* สังเกตเฉพาะ anchor — ถ้าสังเกต floating ด้วย การตั้ง minWidth จะย้อนกลับมาปลุก compute เป็นลูป */
    const observer = new ResizeObserver(compute);
    const anchor = anchorRef.current;
    if (anchor) observer.observe(anchor);

    return () => {
      window.removeEventListener("scroll", compute, true);
      window.removeEventListener("resize", compute);
      observer.disconnect();
    };
  }, [open, compute, anchorRef]);
}
