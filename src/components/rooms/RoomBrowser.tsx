"use client";

import { useMemo, useState } from "react";
import type { RoomWithStatus } from "@/core/domain/entities/room";
import { Checkbox } from "@/components/ui/Checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchIcon } from "@/components/ui/Icons";
import { Select } from "@/components/ui/Select";
import { RoomCard } from "./RoomCard";
import { CAPACITY_OPTIONS, DEFAULT_CAPACITY, matchesCapacity } from "./capacity-filter";

/*
 * แถบกรอง + ตารางการ์ดห้อง
 *
 * เป็น client component เพราะการกรองเกิดขึ้นทันทีในเครื่อง ไม่ต้องวิ่งกลับ server
 * (จำนวนห้องระดับองค์กรเดียวน้อยพอที่จะกรองฝั่ง client ได้สบาย)
 *
 * หน้า /rooms ยังเป็น Server Component เหมือนเดิม — แตกเฉพาะส่วนที่มี state ออกมาเท่านั้น
 * ถ้าเผลอใส่ "use client" ที่ตัวหน้า จะลากการดึงข้อมูลทั้งหมดข้ามฝั่งไปโดยไม่ได้อะไรเลย
 */

export function RoomBrowser({ rooms }: { rooms: RoomWithStatus[] }) {
  const [query, setQuery] = useState("");
  const [capacity, setCapacity] = useState(DEFAULT_CAPACITY);
  const [onlyFree, setOnlyFree] = useState(false);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rooms.filter((room) => {
      if (onlyFree && room.isBusyNow) return false;
      if (!matchesCapacity(room.capacity, capacity)) return false;
      if (!needle) return true;
      return (
        room.name.toLowerCase().includes(needle) ||
        (room.location?.toLowerCase().includes(needle) ?? false)
      );
    });
  }, [rooms, query, capacity, onlyFree]);

  if (rooms.length === 0) {
    return (
      <EmptyState
        title="ยังไม่มีห้องประชุมในระบบ"
        description="เพิ่มห้องเข้าฐานข้อมูลก่อน แล้วห้องจะมาแสดงที่นี่"
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="input-affix max-w-xs">
          <SearchIcon className="size-4 shrink-0 text-muted" />
          <input
            type="search"
            className="input-bare"
            placeholder="ค้นหาชื่อห้องหรือที่ตั้ง"
            aria-label="ค้นหาห้องประชุม"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <Select
          options={CAPACITY_OPTIONS}
          value={capacity}
          onValueChange={setCapacity}
          aria-label="กรองตามความจุ"
          className="w-48"
        />

        <Checkbox
          label="เฉพาะที่ว่างตอนนี้"
          checked={onlyFree}
          onChange={(event) => setOnlyFree(event.target.checked)}
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="ไม่พบห้องที่ตรงกับเงื่อนไข"
          description="ลองเปลี่ยนช่วงความจุกลับเป็นทุกขนาด หรือปิดตัวเลือกเฉพาะห้องที่ว่าง"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}
    </div>
  );
}
