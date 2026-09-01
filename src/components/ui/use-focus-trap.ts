"use client";

import { useEffect } from "react";

/*
 * ขังโฟกัสไว้ในกล่อง แล้วคืนโฟกัสกลับที่เดิมเมื่อปิด
 *
 * ใช้ร่วมกันระหว่าง Modal กับ DatePicker — สองตัวนี้ต้องการพฤติกรรมเดียวกันเป๊ะ
 */

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

interface FocusTrapOptions {
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  /**
   * ใส่ inert ให้ทุกอย่างนอกกล่อง
   * จำเป็นจริง เพราะ JS trap กัน Tab ได้ แต่กัน virtual cursor ของ screen reader ไม่ได้
   */
  inertBackground?: boolean;
}

export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  active: boolean,
  { initialFocusRef, inertBackground = false }: FocusTrapOptions = {},
) {
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    /* หา element ที่เป็นลูกตรงของ body เพื่อยกเว้นไม่ให้โดน inert */
    let ownRoot: Node = container;
    while (ownRoot.parentNode && ownRoot.parentNode !== document.body) {
      ownRoot = ownRoot.parentNode;
    }

    const inerted: HTMLElement[] = [];
    if (inertBackground) {
      for (const child of Array.from(document.body.children)) {
        if (child === ownRoot || !(child instanceof HTMLElement)) continue;
        if (child.hasAttribute("inert")) continue;
        child.setAttribute("inert", "");
        inerted.push(child);
      }
    }

    const target =
      initialFocusRef?.current ??
      container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ??
      container;
    target.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab" || !container) return;

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      for (const el of inerted) el.removeAttribute("inert");

      /*
       * node เดิมอาจหายไปแล้ว (เช่นปิดเพราะ navigate ไปหน้าอื่น)
       * เรียก focus() บน node ที่หลุดจาก document ไปแล้วจะไม่มีผลและทำให้โฟกัสตกไปที่ body แบบเงียบๆ
       */
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [active, containerRef, initialFocusRef, inertBackground]);
}
