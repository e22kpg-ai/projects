import { container } from "@/composition/container";
import type { AuthenticatedUser } from "@/core/ports/auth-service.port";

export interface UsageReportParams {
  actingUser: AuthenticatedUser;
  /** `YYYY-MM-DD` วันแรกของช่วง */
  from: string;
  /** `YYYY-MM-DD` วันสุดท้ายของช่วง (รวมวันนี้ด้วย) */
  to: string;
}

/*
 * แปลงช่วงวันที่แบบที่ผู้ใช้เลือก (รวมวันสุดท้าย) เป็นแบบที่ use-case ต้องการ (ไม่รวมขอบขวา)
 *
 * ทำที่นี่ไม่ใช่ใน core เพราะ "YYYY-MM-DD" เป็นรูปแบบของหน้าเว็บ ไม่ใช่ของโดเมน
 * และ core ก็ import ตัวช่วยวันที่จาก components/ui ไม่ได้อยู่แล้ว
 */
export async function getRoomUsageReport({ actingUser, from, to }: UsageReportParams) {
  const [fromYear, fromMonth, fromDay] = from.split("-").map(Number);
  const [toYear, toMonth, toDay] = to.split("-").map(Number);

  const start = new Date(fromYear, fromMonth - 1, fromDay);
  /* +1 วัน เพราะผู้ใช้เลือก "ถึงวันที่ 30" แล้วคาดหวังว่าทั้งวันที่ 30 จะถูกนับด้วย */
  const end = new Date(toYear, toMonth - 1, toDay + 1);

  return container.summarizeRoomUsage({ actingUser, from: start, to: end });
}
