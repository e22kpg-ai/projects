"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { addDays, addMonths } from "@/components/ui/date-utils";
import type { ISODate } from "@/components/ui/types";

/*
 * แถบเลือกช่วงวันที่ของรายงาน
 *
 * ใช้ router navigation แบบเดียวกับ CalendarToolbar — ช่วงที่เลือกอยู่ใน URL
 * จึงส่งลิงก์ให้คนอื่นเปิดดูรายงานชุดเดียวกันได้ และกด back กลับไปช่วงก่อนหน้าได้
 *
 * ★ today รับมาจาก server ห้ามเรียก todayISO() เองที่นี่ (ดู no-client-clock.test.ts)
 *   ไม่งั้นตอนข้ามเที่ยงคืนปุ่ม "เดือนนี้" จะคำนวณคนละเดือนกับที่ server เรนเดอร์มา
 */

function firstDayOfMonth(iso: ISODate): ISODate {
  return `${iso.slice(0, 7)}-01`;
}

export function UsageReportToolbar({
  from,
  to,
  today,
}: {
  from: ISODate;
  to: ISODate;
  today: ISODate;
}) {
  const router = useRouter();

  function go(nextFrom: ISODate, nextTo: ISODate) {
    router.push(`/admin/reports?from=${nextFrom}&to=${nextTo}`);
  }

  const thisMonthStart = firstDayOfMonth(today);
  const lastMonthStart = addMonths(thisMonthStart, -1);
  /* วันสุดท้ายของเดือนก่อน = ย้อนหนึ่งวันจากวันแรกของเดือนนี้ ไม่ต้องรู้ว่าเดือนไหนมีกี่วัน */
  const lastMonthEnd = addDays(thisMonthStart, -1);

  const presets: { label: string; from: ISODate; to: ISODate }[] = [
    { label: "7 วันล่าสุด", from: addDays(today, -6), to: today },
    { label: "30 วันล่าสุด", from: addDays(today, -29), to: today },
    { label: "เดือนนี้", from: thisMonthStart, to: today },
    { label: "เดือนที่แล้ว", from: lastMonthStart, to: lastMonthEnd },
  ];

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted">ตั้งแต่วันที่</span>
          <DatePicker
            value={from}
            /* เลือกวันเริ่มที่หลังวันสิ้นสุด ให้ดันวันสิ้นสุดตามไปด้วย ดีกว่าเด้ง error ใส่หน้า */
            onValueChange={(next) => go(next, next > to ? next : to)}
            aria-label="วันเริ่มต้นของรายงาน"
            className="w-52"
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted">ถึงวันที่</span>
          <DatePicker
            value={to}
            min={from}
            max={today}
            onValueChange={(next) => go(from, next)}
            aria-label="วันสิ้นสุดของรายงาน"
            className="w-52"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted">ช่วงที่ใช้บ่อย</span>
        {presets.map((preset) => {
          const active = preset.from === from && preset.to === to;
          return (
            <Button
              key={preset.label}
              variant="ghost"
              size="sm"
              aria-pressed={active}
              onClick={() => go(preset.from, preset.to)}
            >
              {preset.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
