"use client";

import { useState } from "react";
import type { DressCode } from "@/core/domain/entities/booking";
import { Modal } from "@/components/ui/Modal";
import { ClockIcon, MapPinIcon } from "@/components/ui/Icons";
import { Tooltip } from "@/components/ui/Tooltip";
import { DRESS_CODE_LABELS } from "@/components/booking/dress-code-options";

/*
 * บล็อกการจองหนึ่งอันในตาราง ชี้เมาส์ค้างดูรายละเอียดแบบลอย หรือกดเพื่อเปิดดูแบบเต็ม
 *
 * แยกเป็น client component ตัวเล็กที่สุดเท่าที่ทำได้ CalendarGrid ที่ครอบอยู่จึงยังเป็น
 * Server Component — ตารางทั้งอันมีหลายร้อย cell ไม่มีเหตุผลให้ลากข้ามฝั่งไปด้วย
 *
 * gridColumn/gridRow เป็น inline style เพราะคำนวณจากข้อมูลตอน runtime
 * เข้าข้อยกเว้น "layout ที่คำนวณแบบ dynamic" ของ CLAUDE.md เหมือนที่ตารางเดิมทำอยู่แล้ว
 *
 * รายละเอียดชุดเดียวกันโชว์ทั้งใน Tooltip (hover) และ Modal (คลิก) — ผู้ใช้จอสัมผัสไม่มี hover
 * จึงต้องมี Modal เป็นทางเข้าถึงข้อมูลเดียวกันเสมอ ตามกติกาการใช้ Tooltip ของโปรเจกต์
 */
export function BookingBlock({
  title,
  roomName,
  startLabel,
  endLabel,
  department,
  chairperson,
  dressCode,
  gridColumn,
  gridRow,
}: {
  title: string;
  roomName: string;
  startLabel: string;
  endLabel: string;
  department: string | null;
  chairperson: string | null;
  dressCode: DressCode | null;
  gridColumn: number;
  gridRow: string;
}) {
  const [open, setOpen] = useState(false);

  const details = (
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
      <div>
        <dt className="text-muted text-xs">หน่วยงานรับผิดชอบเป็นเจ้าภาพ</dt>
        <dd>{department ?? "-"}</dd>
      </div>
      <div>
        <dt className="text-muted text-xs">เรื่องที่จะประชุม</dt>
        <dd>{title}</dd>
      </div>
      <div>
        <dt className="text-muted text-xs">ชื่อประธานการประชุม</dt>
        <dd>{chairperson ?? "-"}</dd>
      </div>
      <div>
        <dt className="text-muted text-xs">การแต่งกาย</dt>
        <dd>{dressCode ? DRESS_CODE_LABELS[dressCode] : "-"}</dd>
      </div>
    </dl>
  );

  return (
    <>
      {/*
        Tooltip ห่อ trigger ด้วย <span class="inline-flex"> ของมันเอง ทำให้ปุ่มไม่ใช่ grid item
        โดยตรงของตารางใหญ่อีกต่อไป — div ชั้นนอกนี้จึงรับ gridColumn/gridRow แทน แล้วทำตัวเองเป็น
        grid ชั้นในอีกที เพื่อให้ span ของ Tooltip ถูก stretch เต็มพื้นที่ตามค่า default ของ grid
        (เหมือนที่ปุ่มเดิมเคยถูก stretch ตอนที่ยังเป็น grid item โดยตรง)
      */}
      <div style={{ gridColumn, gridRow }} className="m-0.5 grid">
        <Tooltip content={details}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-full w-full flex-col items-start overflow-hidden rounded-control border border-brand-500/40 bg-brand-subtle px-2 py-1 text-left text-xs text-brand-500 transition-shadow hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="font-medium truncate w-full">{title}</span>
            <span className="tabular-nums opacity-80">
              {startLabel}–{endLabel}
            </span>
          </button>
        </Tooltip>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        size="sm"
        description="รายละเอียดการจอง"
      >
        {details}
      </Modal>
    </>
  );
}
