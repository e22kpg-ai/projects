import { getRoomUsageReport } from "@/adapters/driving/queries/report.queries";
import { requireAdmin } from "@/adapters/driving/queries/session.queries";
import { UsageReportToolbar } from "@/components/admin/UsageReportToolbar";
import { UsageReportView } from "@/components/admin/UsageReportView";
import { NavBar } from "@/components/layout/NavBar";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { formatThaiLong, safeISODateParam, todayISO } from "@/components/ui/date-utils";
import { DomainError } from "@/core/domain/errors";

export const metadata = {
  title: "รายงานการใช้ห้องประชุม",
};

/*
 * รายงานการใช้ห้องประชุม — เห็นได้เฉพาะ admin (requireAdmin ตอบ 404 ให้คนอื่น)
 *
 * ที่มาของข้อมูล: การประชุมที่จบไปแล้ว ซึ่งเป็นชุดเดียวกับที่ถูกซ่อนออกจากปฏิทิน
 * ปฏิทินมีไว้หาช่องว่างเพื่อจอง ส่วนหน้านี้มีไว้ดูว่าห้องถูกใช้ไปอย่างไร
 *
 * ★ ช่วงวันที่มาจาก URL จึงต้องกรองด้วย safeISODateParam ก่อนเสมอ เหมือนหน้าปฏิทิน
 *   ค่าที่ไม่ใช่วันที่ต้องตกกลับเป็นค่าตั้งต้น ไม่ใช่ทำให้ทั้งหน้าล่ม
 */
export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;

  /* คำนวณ "วันนี้" ที่ server ครั้งเดียวแล้วส่งลงไปให้ toolbar ใช้ต่อ */
  const today = todayISO();
  const defaultFrom = `${today.slice(0, 7)}-01`;

  const from = safeISODateParam(params.from, defaultFrom);
  const rawTo = safeISODateParam(params.to, today);
  /* สลับวันมาก็ไม่ควรพัง — ถือว่าวันสิ้นสุดอย่างน้อยต้องเท่ากับวันเริ่ม */
  const to = rawTo < from ? from : rawTo;

  /*
   * try/catch ครอบเฉพาะการดึงข้อมูล ไม่ครอบ JSX — React ไม่ได้เรนเดอร์ component ทันทีที่สร้าง
   * error ตอนเรนเดอร์จึงไม่ตกมาที่ catch นี้อยู่ดี (ของนั้นเป็นหน้าที่ของ error boundary)
   *
   * DomainError ที่นี่คือช่วงวันที่ที่ไม่ผ่านกฎ เช่นยาวเกินหนึ่งปี ซึ่งผู้ใช้แก้เองได้
   * แสดงเป็นข้อความในหน้า ดีกว่าโยนให้ error boundary กินทั้งหน้าจนแถบเลือกวันหายไปด้วย
   */
  let report = null;
  let rangeError: string | null = null;
  try {
    report = await getRoomUsageReport({ actingUser: admin, from, to });
  } catch (err) {
    if (!(err instanceof DomainError)) throw err;
    rangeError = err.message;
  }

  return (
    <>
      <NavBar />
      <main className="max-w-5xl mx-auto w-full p-6 flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">รายงานการใช้ห้องประชุม</h1>
            <p className="text-sm text-muted">
              {formatThaiLong(from)} ถึง {formatThaiLong(to)}
            </p>
          </div>
          <Button href="/admin/rooms" variant="secondary">
            จัดการห้องประชุม
          </Button>
        </div>

        <UsageReportToolbar from={from} to={to} today={today} />

        {rangeError && <Alert>{rangeError}</Alert>}
        {report && <UsageReportView report={report} />}
      </main>
    </>
  );
}
