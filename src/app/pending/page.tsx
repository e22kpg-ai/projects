import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/adapters/driving/queries/session.queries";
import {
  PendingNoticeToast,
  type PendingNoticeReason,
} from "@/components/auth/PendingNoticeToast";
import { NavBar } from "@/components/layout/NavBar";

export const metadata: Metadata = {
  title: "รอผู้ดูแลระบบอนุมัติ",
};

/* รับเฉพาะค่าที่รู้จัก ค่าที่ใครพิมพ์มั่วมาใน URL ต้องไม่ทำให้เกิด toast แปลกๆ */
function toReason(raw: string | undefined): PendingNoticeReason | null {
  return raw === "signedup" || raw === "blocked" ? raw : null;
}

/*
 * หน้าปลายทางของบัญชีที่สมัครแล้วแต่ยังไม่ถูกอนุมัติ
 *
 * ★ ใช้ requireUser ไม่ใช่ requireApprovedUser — ไม่งั้นจะ redirect วนหาตัวเองไม่รู้จบ
 *
 * ★ คนที่อนุมัติแล้วเดินมาที่นี่ให้ส่งกลับไป /rooms เพราะหน้านี้ไม่มีอะไรให้เขาทำ
 *   และถ้าปล่อยให้ค้างอยู่ เขาจะเข้าใจว่าตัวเองยังใช้งานไม่ได้ทั้งที่ใช้ได้แล้ว
 *
 * ★ toast เป็นตัวเสริมที่ตอบว่า "ทำไมถึงมาอยู่ตรงนี้" ส่วนตัวหน้าตอบว่า "ตอนนี้อยู่สถานะไหน"
 *   สองคำถามคนละข้อ และข้อหลังต้องตอบได้เสมอแม้ผ่านไปเป็นสัปดาห์ จึงต้องอยู่ในหน้า ไม่ใช่ใน toast
 *
 * เป็น presentation ล้วน ไม่มี business rule — กฎว่าใครใช้ระบบได้อยู่ใน core
 */
export default async function PendingApprovalPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const user = await requireUser();
  if (user.status === "approved") {
    redirect("/rooms");
  }

  const reason = toReason((await searchParams).notice);

  return (
    <>
      <NavBar />
      <PendingNoticeToast reason={reason} />
      <main className="flex-1 grid place-items-center p-6">
        <div className="card flex max-w-md flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="badge-warning badge-dot self-start">รอการอนุมัติ</span>
            <h1 className="text-xl font-semibold">บัญชีของคุณกำลังรอผู้ดูแลระบบอนุมัติ</h1>
          </div>

          <p className="text-sm text-muted">
            การสมัครเสร็จสมบูรณ์แล้ว ผู้ดูแลระบบจะตรวจสอบและเปิดสิทธิ์ใช้งานให้
            หลังจากนั้นคุณจะจองห้องประชุมและดูปฏิทินได้ทันทีโดยไม่ต้องสมัครใหม่
          </p>

          <dl className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">ชื่อ</dt>
              <dd className="text-right">{user.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">อีเมล</dt>
              <dd className="text-right break-all">{user.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">สังกัด</dt>
              <dd className="text-right">
                {user.affiliation ?? <span className="text-muted">ไม่ได้ระบุ</span>}
              </dd>
            </div>
          </dl>

          {/*
            บอกให้ชัดว่าต้องทำอะไรต่อ — ถ้าไม่บอก คนจะกด refresh รัวๆ หรือสมัครซ้ำ
            ด้วยอีเมลอื่น แล้วจะได้บัญชีค้างในระบบเพิ่มขึ้นเรื่อยๆ ให้ admin ต้องมาตามลบ
          */}
          <p className="text-xs text-muted">
            หากรอนานผิดปกติ กรุณาติดต่อผู้ดูแลระบบโดยตรง
            การสมัครซ้ำด้วยอีเมลอื่นไม่ได้ทำให้ได้รับอนุมัติเร็วขึ้น
          </p>
        </div>
      </main>
    </>
  );
}
