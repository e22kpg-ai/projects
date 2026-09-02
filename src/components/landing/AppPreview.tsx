/*
 * ภาพจำลองหน้าตารางห้องประชุม — วาดด้วย markup ล้วน ไม่มีไฟล์รูป
 *
 * ทำไมไม่ใช่ screenshot จริง: รูปนิ่งจะไม่เปลี่ยนตาม skin/โหมด พอสลับเป็นธีมมืดหรือ forest
 * ภาพจะกลายเป็นแผ่นสีน้ำเงินสว่างแปะอยู่กลางหน้าเข้ม และต้องมาถ่ายใหม่ทุกครั้งที่ UI ขยับ
 *
 * ★ ข้อมูลทุกตัวในนี้เป็นค่าคงที่ที่เขียนตายไว้ ห้ามคำนวณวันที่/เวลาจริงเด็ดขาด —
 *   หน้านี้ถูก SSR การอ่าน "ตอนนี้" ทั้งฝั่ง server และ client จะได้ hydration mismatch
 *   โดยไม่ได้ประโยชน์อะไรเลย เพราะมันเป็นของตกแต่ง ไม่ใช่ข้อมูลจริง
 *
 * ทั้งกรอบใส่ aria-hidden ไว้ ไม่ให้ screen reader อ่านตารางปลอมเป็นข้อมูลจริง
 */

const TIMES = ["09:00", "10:00", "11:00", "12:00"];

/* busy = ช่วงเวลาที่ถูกจองแล้ว เรียงตรงกับ TIMES */
const ROOMS = [
  { name: "ห้องแก้วมังกร", busy: [false, true, true, false] },
  { name: "ห้องลำไย", busy: [false, false, false, false] },
  { name: "ห้องมะปราง", busy: [true, false, false, true] },
];

export function AppPreview() {
  return (
    <div className="preview-frame" aria-hidden="true">
      <div className="preview-bar">
        <span className="preview-dot" />
        <span className="preview-dot" />
        <span className="preview-dot" />
        <span className="ml-2 text-xs text-muted">ปฏิทินห้องประชุม</span>
      </div>

      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">ตารางวันนี้</span>
          <span className="badge-success badge-dot">ว่างอยู่ 1 ห้อง</span>
        </div>

        <div className="flex gap-2">
          {/* คอลัมน์เวลา — span เปล่าข้างบนไว้เว้นให้ตรงกับแถวชื่อห้อง */}
          <div className="flex shrink-0 flex-col gap-2">
            <span className="h-5" />
            {TIMES.map((time) => (
              <span key={time} className="flex h-6 items-center text-xs text-muted tabular-nums">
                {time}
              </span>
            ))}
          </div>

          <div className="grid flex-1 grid-cols-3 gap-2">
            {ROOMS.map((room) => (
              <div key={room.name} className="flex flex-col gap-2">
                <span className="h-5 truncate text-xs font-medium">{room.name}</span>
                {room.busy.map((isBusy, index) => (
                  <span
                    key={TIMES[index]}
                    className={isBusy ? "preview-slot h-6" : "preview-slot-free h-6"}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="preview-slot size-3 shrink-0" />
            จองแล้ว
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="preview-slot-free size-3 shrink-0" />
            ว่าง
          </span>
        </div>
      </div>
    </div>
  );
}
