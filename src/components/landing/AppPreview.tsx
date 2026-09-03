/*
 * ภาพจำลองหน้าตารางห้องประชุม — วาดด้วย markup ล้วน ไม่มีไฟล์รูป
 *
 * ทำไมไม่ใช่ screenshot จริง: รูปนิ่งจะไม่เปลี่ยนตาม skin/โหมด พอสลับเป็นธีมมืดหรือ forest
 * ภาพจะกลายเป็นแผ่นสีน้ำเงินสว่างแปะอยู่กลางหน้าเข้ม และต้องมาถ่ายใหม่ทุกครั้งที่ UI ขยับ
 *
 * ★ ชื่อห้องกับช่วงที่ถูกจองเป็นของสมมติ แต่ "จำนวนคอลัมน์" อิงจำนวนห้องจริงใน DB
 *
 *   เดิมตารางนี้ตายตัวที่ 3 ห้อง ส่วนแถบใต้ปุ่ม CTA ที่อยู่ห่างไปไม่ถึงคืบดึงเลขจริงมาแสดง
 *   หน่วยงานที่มี 2 ห้องจึงเห็น "จากห้องประชุมทั้งหมด 2 ห้อง" อยู่ข้างตารางที่มี 3 คอลัมน์
 *   ของตกแต่งที่หน้าตาเหมือนข้อมูลจริงและตัวเลขไม่ตรงกับข้อมูลจริง = หลอกคนดู
 *
 *   ชื่อห้องยังสมมติต่อไปโดยตั้งใจ เพราะ "/" เป็นหน้าเดียวที่คนยังไม่ล็อกอินเปิดดูได้
 *   (คนที่ล็อกอินแล้วถูก redirect ไป /rooms ตั้งแต่ต้น) การเอาชื่อห้องจริงกับตาราง
 *   การใช้งานขึ้นไปแสดง เท่ากับเปิดเผยข้อมูลภายในให้คนนอกเห็นโดยไม่ต้องล็อกอิน
 *
 * ★ ข้อมูลเวลาทุกตัวในนี้เป็นค่าคงที่ที่เขียนตายไว้ ห้ามคำนวณวันที่/เวลาจริงเด็ดขาด —
 *   หน้านี้ถูก SSR การอ่าน "ตอนนี้" ทั้งฝั่ง server และ client จะได้ hydration mismatch
 *   โดยไม่ได้ประโยชน์อะไรเลย เพราะมันเป็นของตกแต่ง ไม่ใช่ข้อมูลจริง
 *
 * ทั้งกรอบใส่ aria-hidden ไว้ ไม่ให้ screen reader อ่านตารางปลอมเป็นข้อมูลจริง
 */

const TIMES = ["09:00", "10:00", "11:00", "12:00"];

/*
 * เกินจากนี้คอลัมน์จะแคบจนอ่านชื่อห้องไม่ออก และกรอบ preview ก็กว้างเท่าเดิม
 * ป้าย "ตัวอย่างหน้าจอ" จึงต้องอยู่ตลอด ไม่ใช่โผล่เฉพาะตอนล้น — เพราะตอนล้น
 * จำนวนคอลัมน์จะน้อยกว่าห้องจริง ซึ่งเป็นอาการเดียวกับบั๊กที่กำลังแก้อยู่นี่เอง
 */
const MAX_PREVIEW_COLUMNS = 4;

/** ใช้เมื่อยังไม่รู้จำนวนห้องจริง (DB ล่ม หรือยังไม่มีห้องในระบบ) */
const DEFAULT_PREVIEW_COLUMNS = 3;

/*
 * ต้องเป็นคลาสเต็มที่เขียนตรงๆ ไม่ใช่ประกอบสตริงอย่าง `grid-cols-${n}`
 * Tailwind อ่านซอร์สแบบข้อความ ชื่อคลาสที่ประกอบตอน runtime จะไม่ถูก generate ออกมาเลย
 */
const COLUMN_CLASS = ["", "grid-cols-1", "grid-cols-2", "grid-cols-3", "grid-cols-4"] as const;

/* busy = ช่วงเวลาที่ถูกจองแล้ว เรียงตรงกับ TIMES — มีให้ครบ MAX_PREVIEW_COLUMNS */
const PREVIEW_ROOMS = [
  { name: "ห้องแก้วมังกร", busy: [false, true, true, false] },
  { name: "ห้องลำไย", busy: [false, false, false, false] },
  { name: "ห้องมะปราง", busy: [true, false, false, true] },
  { name: "ห้องมะยงชิด", busy: [false, true, false, false] },
];

/**
 * จำนวนคอลัมน์ที่จะวาด จากจำนวนห้องจริงในระบบ
 *
 * แยกเป็นฟังก์ชันบริสุทธิ์เพราะมันคือจุดเดียวที่ตัดสินใจ และเป็นจุดที่เคยพลาดมาแล้ว
 * รับ `null` ได้ เพราะหน้าแรกกลืน error ตอนดึงข้อมูลไว้เพื่อไม่ให้ DB ล่มแล้วทั้งหน้าเป็น 500
 */
export function previewColumnCount(roomCount: number | null): number {
  if (roomCount === null || !Number.isFinite(roomCount)) return DEFAULT_PREVIEW_COLUMNS;

  const whole = Math.floor(roomCount);
  if (whole < 1) return DEFAULT_PREVIEW_COLUMNS;

  return Math.min(whole, MAX_PREVIEW_COLUMNS);
}

export function AppPreview({ roomCount }: { roomCount: number | null }) {
  const columns = previewColumnCount(roomCount);
  const rooms = PREVIEW_ROOMS.slice(0, columns);

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
          {/*
            เดิมตรงนี้เป็นป้าย "ว่างอยู่ 1 ห้อง" ซึ่งเป็นเลขสมมติที่ตีกับเลขจริง
            ในแถบใต้ปุ่ม CTA บอกไปเลยว่านี่คือตัวอย่าง ตรงไปตรงมากว่า
          */}
          <span className="badge">ตัวอย่างหน้าจอ</span>
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

          <div className={`grid flex-1 gap-2 ${COLUMN_CLASS[columns]}`}>
            {rooms.map((room) => (
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
