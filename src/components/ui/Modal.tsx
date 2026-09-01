"use client";

import { useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";
import { cx } from "./cx";
import { XIcon } from "./Icons";
import type { Size } from "./types";
import { useDismiss } from "./use-dismiss";
import { useFocusTrap } from "./use-focus-trap";
import { useScrollLock } from "./use-scroll-lock";

/*
 * กล่องโต้ตอบกลางจอ
 *
 * ทำไมไม่ใช้ <dialog showModal()> ทั้งที่มันแถม focus trap กับ Esc มาให้ฟรี:
 *   top-layer ของ <dialog> อยู่เหนือ z-index ทุกค่า Toast ที่ควรลอยอยู่บน Modal
 *   (เช่น "จองสำเร็จ" ที่ยิงจากฟอร์มใน Modal) จะโดนบังโดยแก้ไม่ได้
 *   นอกจากจะยัด Toast เข้า top-layer ด้วย ซึ่งทำให้ระบบชั้นมีสองมาตรฐาน
 *   โปรเจกต์นี้เลือกคุมชั้นด้วย --ds-z-popover / -modal / -toast ชั้นเดียว
 *
 *   (อีกเรื่องคือ showModal() ต้องเรียกแบบ imperative ใน effect — การใส่ prop `open`
 *    บน <dialog> ตรงๆ ไม่สร้าง top-layer ซึ่งเป็นกับดักที่คนติดกันบ่อย)
 *
 * controlled อย่างเดียว ไม่มี state ภายใน ไม่มี trigger prop — SSR ง่ายและเอาไปประกอบง่าย
 */

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: Size;
  closeOnBackdrop?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

const SIZE_CLASS: Record<Size, string> = {
  sm: "modal-sm",
  md: "modal-md",
  lg: "modal-lg",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closeOnBackdrop = true,
  initialFocusRef,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const uid = useId();

  useScrollLock(open);
  useFocusTrap(panelRef, open, { initialFocusRef, inertBackground: true });
  /* outsidePointer: false เพราะ backdrop จัดการคลิกข้างนอกเองอยู่แล้ว */
  useDismiss({ active: open, onDismiss: onClose, refs: [panelRef], outsidePointer: false });

  if (!open) return null;

  return createPortal(
    <div className="modal-layer">
      {/*
        backdrop เป็น element แยกต่างหาก ไม่ใช่ onClick บน .modal-layer แล้วเช็ค target === currentTarget
        เพราะเวลาลากเลือกข้อความจากใน panel ออกไปปล่อยข้างนอก event click จะยิงที่บรรพบุรุษร่วม
        คือ .modal-layer ทำให้ modal ปิดทิ้งทั้งที่ผู้ใช้แค่จะคัดลอกข้อความ
      */}
      <div
        className="modal-backdrop"
        aria-hidden="true"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}t`}
        aria-describedby={description ? `${uid}d` : undefined}
        className={cx("modal-panel", SIZE_CLASS[size])}
      >
        <div className="modal-header">
          <h2 id={`${uid}t`} className="modal-title">
            {title}
          </h2>
          <Button variant="ghost" size="sm" aria-label="ปิด" onClick={onClose}>
            <XIcon />
          </Button>
        </div>

        {description && (
          <p id={`${uid}d`} className="text-muted text-sm">
            {description}
          </p>
        )}

        <div>{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
