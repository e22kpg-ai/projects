"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertIcon, CheckCircleIcon, InfoIcon, XIcon } from "../Icons";
import { useToastStore, type ToastItem } from "./toast-store";

/*
 * ที่แขวน toast — วางไว้ครั้งเดียวใน app/layout.tsx
 *
 * viewport เป็น pointer-events-none แต่ตัว toast เป็น pointer-events-auto
 * เพื่อไม่ให้กล่องใสๆ ไปบังการคลิกพื้นที่ว่างมุมขวาล่างของหน้า
 */

const ICONS = {
  info: InfoIcon,
  success: CheckCircleIcon,
  danger: AlertIcon,
  warning: AlertIcon,
};

function ToastRow({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const [paused, setPaused] = useState(false);
  const Icon = ICONS[item.variant];

  useEffect(() => {
    if (paused || item.duration <= 0) return;
    const timer = window.setTimeout(onDismiss, item.duration);
    return () => window.clearTimeout(timer);
  }, [paused, item.duration, onDismiss]);

  return (
    <div
      className="toast"
      data-variant={item.variant}
      /* danger ต้องขัดจังหวะ ที่เหลือรอให้ screen reader อ่านตอนพัก */
      role={item.variant === "danger" ? "alert" : "status"}
      aria-live={item.variant === "danger" ? "assertive" : "polite"}
      aria-atomic="true"
      /* หยุดนับถอยหลังตอนเมาส์ชี้หรือโฟกัสอยู่ แล้วเริ่มนับใหม่เมื่อออก */
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <Icon className="toast-icon" />
      <span className="flex-1">{item.message}</span>
      <button type="button" className="input-affix-btn" aria-label="ปิดการแจ้งเตือน" onClick={onDismiss}>
        <XIcon className="size-3.5" />
      </button>
    </div>
  );
}

export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  /*
   * ไม่ต้องมี mounted flag: store เริ่มต้นด้วย array ว่างเสมอ
   * ฝั่ง server และ render แรกของ client จึงคืน null ตรงกันอยู่แล้ว
   * toast ตัวแรกเกิดได้หลังผู้ใช้ทำอะไรบางอย่าง ซึ่งเป็นฝั่ง client ล้วน — createPortal จึงปลอดภัย
   */
  if (toasts.length === 0) return null;

  return createPortal(
    <div className="toast-viewport">
      {toasts.map((item) => (
        <ToastRow key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
      ))}
    </div>,
    document.body,
  );
}
