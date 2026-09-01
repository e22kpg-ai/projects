"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ClockIcon, MapPinIcon } from "@/components/ui/Icons";

/*
 * บล็อกการจองหนึ่งอันในตาราง กดแล้วเปิดรายละเอียด
 *
 * แยกเป็น client component ตัวเล็กที่สุดเท่าที่ทำได้ CalendarGrid ที่ครอบอยู่จึงยังเป็น
 * Server Component — ตารางทั้งอันมีหลายร้อย cell ไม่มีเหตุผลให้ลากข้ามฝั่งไปด้วย
 *
 * gridColumn/gridRow เป็น inline style เพราะคำนวณจากข้อมูลตอน runtime
 * เข้าข้อยกเว้น "layout ที่คำนวณแบบ dynamic" ของ CLAUDE.md เหมือนที่ตารางเดิมทำอยู่แล้ว
 */
export function BookingBlock({
  title,
  roomName,
  startLabel,
  endLabel,
  gridColumn,
  gridRow,
}: {
  title: string;
  roomName: string;
  startLabel: string;
  endLabel: string;
  gridColumn: number;
  gridRow: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        style={{ gridColumn, gridRow }}
        onClick={() => setOpen(true)}
        className="m-0.5 flex flex-col items-start overflow-hidden rounded-control border border-brand-500/40 bg-brand-subtle px-2 py-1 text-left text-xs text-brand-500 transition-shadow hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="font-medium truncate w-full">{title}</span>
        <span className="tabular-nums opacity-80">
          {startLabel}–{endLabel}
        </span>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        size="sm"
        description="รายละเอียดการจอง"
      >
        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex items-center gap-2">
            <MapPinIcon className="size-4 shrink-0 text-muted" />
            <dt className="sr-only">ห้อง</dt>
            <dd>{roomName}</dd>
          </div>
          <div className="flex items-center gap-2">
            <ClockIcon className="size-4 shrink-0 text-muted" />
            <dt className="sr-only">ช่วงเวลา</dt>
            <dd className="tabular-nums">
              {startLabel}–{endLabel}
            </dd>
          </div>
        </dl>
      </Modal>
    </>
  );
}
