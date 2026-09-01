/*
 * หน้าจอระหว่างรอข้อมูล — ก่อนหน้านี้ไม่มีไฟล์นี้เลย ผู้ใช้จึงเห็นหน้าค้างเปล่าๆ ตอนโหลด
 * ใช้โครงร่างจางๆ ที่มีสัดส่วนใกล้ของจริง แทน spinner กลางจอ เพื่อลดความรู้สึกกระตุกตอนของจริงมาแทน
 */
export default function Loading() {
  return (
    <main className="max-w-5xl mx-auto w-full p-6 flex flex-col gap-6" aria-busy="true">
      <span className="sr-only">กำลังโหลด</span>

      <div className="flex flex-col gap-2">
        <div className="skeleton h-7 w-40" />
        <div className="skeleton h-4 w-56" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card flex flex-col gap-3">
            <div className="skeleton h-5 w-32" />
            <div className="skeleton h-4 w-24" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-9 w-28" />
          </div>
        ))}
      </div>
    </main>
  );
}
