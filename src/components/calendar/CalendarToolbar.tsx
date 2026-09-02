"use client";

import { useRouter } from "next/navigation";
import type { Room } from "@/core/domain/entities/room";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { addDays, formatThaiLong } from "@/components/ui/date-utils";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/Icons";
import { Select } from "@/components/ui/Select";
import type { ISODate } from "@/components/ui/types";

/*
 * แถบควบคุมของหน้าปฏิทิน
 *
 * ของเดิมเป็น <form method="get"> ที่ต้องกดปุ่ม "กรอง" อีกทีถึงจะมีผล
 * เปลี่ยนมาใช้ router navigation แล้วเปลี่ยนปุ๊บไปปั๊บ — แอปนี้ต้องใช้ JS อยู่แล้ว
 * (Better Auth ทำ sign-in ฝั่ง client) จึงไม่ได้เสีย fallback อะไรเพิ่ม
 *
 * เดิม shiftDate() ใช้ toISOString() ซึ่งเป็น UTC — ที่ไทยตอนดึกจะข้ามวันผิด
 * ตอนนี้ใช้ addDays() จาก date-utils ที่คำนวณตามเวลาท้องถิ่นแทน
 */

function buildHref(date: ISODate, roomId?: string): string {
  const params = new URLSearchParams({ date });
  if (roomId) params.set("room", roomId);
  return `/calendar?${params.toString()}`;
}

export function CalendarToolbar({
  date,
  today,
  roomId,
  rooms,
}: {
  date: ISODate;
  /* คำนวณมาจาก server แล้ว — ห้ามเรียก todayISO() เองที่นี่ ดูเหตุผลใน CalendarView */
  today: ISODate;
  roomId?: string;
  rooms: Room[];
}) {
  const router = useRouter();

  const roomOptions = [
    { value: "", label: "ทุกห้อง" },
    ...rooms.map((room) => ({ value: room.id, label: room.name })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1">
        <Button
          href={buildHref(addDays(date, -1), roomId)}
          variant="secondary"
          className="btn-icon"
          aria-label="วันก่อนหน้า"
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          href={buildHref(addDays(date, 1), roomId)}
          variant="secondary"
          className="btn-icon"
          aria-label="วันถัดไป"
        >
          <ChevronRightIcon />
        </Button>
      </div>

      {/*
        อยู่ที่วันนี้อยู่แล้วก็ไม่ต้องมีลิงก์ให้กด — เรนเดอร์เป็น <button disabled> ไปเลย
        ของเดิมใช้ opacity + pointer-events-none ซึ่งกันได้แค่เมาส์ คนใช้คีย์บอร์ด
        ยัง Tab เข้าไปเจอปุ่มที่ "ดูเหมือนปิดอยู่" แต่กดแล้วยังไปได้อยู่
      */}
      {date === today ? (
        <Button variant="secondary" size="sm" disabled>
          วันนี้
        </Button>
      ) : (
        <Button href={buildHref(today, roomId)} variant="secondary" size="sm">
          วันนี้
        </Button>
      )}

      <DatePicker
        value={date}
        onValueChange={(next) => router.push(buildHref(next, roomId))}
        aria-label="เลือกวันที่ต้องการดู"
        className="w-56"
      />

      <Select
        options={roomOptions}
        value={roomId ?? ""}
        onValueChange={(next) => router.push(buildHref(date, next || undefined))}
        aria-label="กรองตามห้อง"
        className="w-44"
      />

      <p className="text-muted text-sm ml-auto">{formatThaiLong(date)}</p>
    </div>
  );
}
