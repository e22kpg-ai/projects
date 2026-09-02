import type { RoomUsageReport } from "@/core/use-cases/summarize-room-usage.use-case";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatThaiShort, toISODate } from "@/components/ui/date-utils";
import {
  CLOSE_HOUR,
  OPEN_HOUR,
  formatDuration,
  formatTimeOfDay,
} from "@/components/ui/time-utils";
import { DRESS_CODE_LABELS } from "@/components/booking/dress-code-options";

/*
 * ส่วนแสดงผลรายงาน — Server Component ล้วน ไม่มี state ไม่มี handler
 * ตัวเลขทั้งหมดคำนวณมาจาก use-case แล้ว ที่นี่มีหน้าที่จัดหน้าอย่างเดียว
 *
 * เรียงจากหยาบไปละเอียด: ตัวเลขสรุป → แยกตามห้อง → แยกตามหน่วยงาน → รายการเต็ม
 * คนที่เปิดมาดูส่วนใหญ่ต้องการแค่สองบล็อกแรก ส่วนรายการเต็มมีไว้ให้ตรวจสอบย้อนกลับได้
 */

/*
 * เพดานจำนวนแถวของตาราง "รายการทั้งหมด"
 *
 * ★ ช่วงรายงานยาวได้ถึง 366 วัน (ดู summarize-room-usage.use-case.ts) องค์กรที่ประชุมวันละ 30 ครั้ง
 *   จะได้หมื่นกว่า <tr> ใน HTML ก้อนเดียว หน้าอืดและไฟล์บวมโดยที่ไม่มีใครไล่อ่านครบอยู่ดี
 *
 * ★ เพดานนี้ตัดเฉพาะ "แถวที่แสดง" เท่านั้น ตัวเลขสรุปทุกตัวข้างบน (ครั้ง เวลารวม อัตราการใช้
 *   วันที่คึกคักที่สุด) ยังคำนวณจากข้อมูลทั้งหมดเสมอ — ถ้าเผลอไปตัดที่ต้นทาง ตัวเลขจะผิดเงียบๆ
 */
const MAX_ENTRY_ROWS = 200;

function hours(minutes: number): string {
  return minutes === 0 ? "—" : formatDuration(minutes);
}

export function UsageReportView({ report }: { report: RoomUsageReport }) {
  if (report.totalBookings === 0) {
    return (
      <EmptyState
        title="ยังไม่มีการใช้ห้องในช่วงที่เลือก"
        description="รายงานนับเฉพาะการประชุมที่จบไปแล้ว ลองขยายช่วงวันที่ หรือเลือกช่วงที่ผ่านมาแล้ว"
      />
    );
  }

  const shownEntries = report.entries.slice(0, MAX_ENTRY_ROWS);
  const hiddenEntries = report.entries.length - shownEntries.length;

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted">ภาพรวม</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="stat-tile">
            <span className="stat-value">{report.totalBookings}</span>
            <span className="stat-label">ครั้งที่ใช้ห้อง</span>
          </div>
          <div className="stat-tile">
            <span className="stat-value">{Math.round(report.totalMinutes / 60)}</span>
            <span className="stat-label">ชั่วโมงรวม</span>
          </div>
          <div className="stat-tile">
            <span className="stat-value">{report.averageMinutes}</span>
            <span className="stat-label">นาที เฉลี่ยต่อครั้ง</span>
          </div>
          <div className="stat-tile">
            <span className="stat-value">
              {report.roomsUsed}
              <span className="text-base font-normal text-muted">/{report.byRoom.length}</span>
            </span>
            <span className="stat-label">ห้องที่ถูกใช้จริง</span>
          </div>
        </div>

        {report.busiestDay && (
          <p className="text-sm text-muted">
            วันที่คึกคักที่สุดคือ{" "}
            <span className="text-foreground">{formatThaiShort(report.busiestDay.date)}</span> มี{" "}
            {report.busiestDay.bookings} ครั้ง · ช่วงรายงาน {report.daysInRange} วัน
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted">แยกตามห้อง</h2>
        <div className="card-flat overflow-x-auto p-0">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">ห้องประชุม</th>
                <th scope="col" className="num">
                  ครั้ง
                </th>
                <th scope="col" className="num">
                  เวลารวม
                </th>
                <th scope="col">อัตราการใช้เทียบเวลาทำการ</th>
              </tr>
            </thead>
            <tbody>
              {report.byRoom.map((row) => (
                <tr key={row.roomId}>
                  <td>{row.roomName}</td>
                  <td className="num">{row.bookings}</td>
                  <td className="num">{hours(row.minutes)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="usage-bar max-w-40">
                        {/*
                          ความกว้างคำนวณจากข้อมูลตอน runtime — เข้าข้อยกเว้น dynamic layout
                          ห้องที่ถูกใช้จริงต้องเห็นแถบอย่างน้อยนิดหนึ่ง ไม่งั้นในช่วงยาวๆ
                          มันจะดูเหมือนไม่มีใครใช้เลยทั้งที่ตัวเลขข้างๆ บอกว่ามี
                        */}
                        <div
                          className="usage-bar-fill"
                          style={{
                            width: `${Math.min(100, row.minutes > 0 ? Math.max(1, row.utilisationPercent) : 0)}%`,
                          }}
                        />
                      </div>
                      <span className="tabular-nums text-xs text-muted">
                        {row.utilisationPercent}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/*
          บอกตัวหารให้ชัด ไม่งั้นคนอ่านจะตีความ 70% ว่า "ยังว่างอีกเยอะ" ทั้งที่จองเต็มทุกวันทำการแล้ว
          — ตัวเลขที่ตีความผิดได้เงียบๆ อันตรายกว่าตัวเลขที่ไม่มี
        */}
        <p className="text-xs text-muted">
          อัตราการใช้หารด้วยเวลาทำการ ({OPEN_HOUR}:00–{CLOSE_HOUR}:00) คูณจำนวนวันในช่วงทั้งหมด{" "}
          {report.daysInRange} วัน ซึ่งรวมเสาร์–อาทิตย์และวันหยุดด้วย ห้องที่ถูกจองเต็มทุกวันทำการ
          จึงขึ้นราว 70% ไม่ใช่ 100%
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted">แยกตามหน่วยงาน</h2>
        <div className="card-flat overflow-x-auto p-0">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">หน่วยงานรับผิดชอบ</th>
                <th scope="col" className="num">
                  ครั้ง
                </th>
                <th scope="col" className="num">
                  เวลารวม
                </th>
              </tr>
            </thead>
            <tbody>
              {report.byDepartment.map((row) => (
                <tr key={row.department ?? "__none__"}>
                  {/* การจองเก่าที่บันทึกไว้ก่อนมีช่องหน่วยงาน ต้องยังนับรวมอยู่ ไม่ใช่หายไปเฉยๆ */}
                  <td>{row.department ?? <span className="text-muted">ไม่ได้ระบุ</span>}</td>
                  <td className="num">{row.bookings}</td>
                  <td className="num">{hours(row.minutes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted">
          รายการทั้งหมด ({report.entries.length} รายการ)
        </h2>
        <div className="card-flat overflow-x-auto p-0">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">วันที่</th>
                <th scope="col">เวลา</th>
                <th scope="col">ห้อง</th>
                <th scope="col">เรื่องที่ประชุม</th>
                <th scope="col">หน่วยงาน</th>
                <th scope="col">ประธาน</th>
                <th scope="col">การแต่งกาย</th>
              </tr>
            </thead>
            <tbody>
              {shownEntries.map((entry) => {
                const room = report.byRoom.find((r) => r.roomId === entry.roomId);
                return (
                  <tr key={entry.id}>
                    <td className="whitespace-nowrap">
                      {formatThaiShort(toISODate(entry.startTime))}
                    </td>
                    <td className="whitespace-nowrap tabular-nums">
                      {formatTimeOfDay(entry.startTime)}–{formatTimeOfDay(entry.endTime)}
                    </td>
                    {/* ห้องที่ถูกลบไปแล้วจะไม่มีชื่อให้แสดง แต่แถวเดิมยังต้องอ่านออก */}
                    <td>{room?.roomName ?? <span className="text-muted">ห้องที่ถูกลบแล้ว</span>}</td>
                    <td>{entry.title}</td>
                    <td>{entry.department ?? <span className="text-muted">—</span>}</td>
                    <td>{entry.chairperson ?? <span className="text-muted">—</span>}</td>
                    <td>
                      {entry.dressCode ? (
                        DRESS_CODE_LABELS[entry.dressCode]
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {hiddenEntries > 0 && (
          <p className="text-xs text-muted">
            แสดง {MAX_ENTRY_ROWS} รายการแรก (เรียงตามเวลาเริ่ม) ยังมีอีก {hiddenEntries} รายการ
            ที่ไม่ได้แสดง — ย่อช่วงวันที่ลงเพื่อดูส่วนที่เหลือ ตัวเลขสรุปด้านบนนับครบทุกรายการแล้ว
          </p>
        )}
      </section>
    </div>
  );
}
