import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { Button } from "@/components/ui/Button";

/*
 * header ของหน้า landing โดยเฉพาะ — ไม่ reuse NavBar เพราะ NavBar เกิดมาเพื่อคนที่ล็อกอินแล้ว
 * (ลิงก์ไป /rooms, มี SignOutButton, อ่าน role จาก session) ถ้าเอามาใช้ต่อจะต้องยัด prop
 * แยกสถานะ guest เข้าไปเรื่อยๆ จนอ่านยากทั้งสองฝั่ง แยกไฟล์คนละใบตรงไปตรงมากว่า
 *
 * ส่วนที่ตั้งใจให้เหมือน NavBar เป๊ะๆ คือแถบ sticky + โลโก้ + การซ่อน ThemeSwitcher บนจอเล็ก
 * เพื่อให้ตอนกดเข้าสู่ระบบแล้วหัวหน้าไม่กระตุก
 */
export function LandingHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
      <div className="max-w-5xl mx-auto flex items-center gap-4 px-6 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span
            aria-hidden="true"
            className="grid size-7 place-items-center rounded-control bg-brand-500 text-on-brand text-sm"
          >
            ◈
          </span>
          <span className="hidden sm:inline">ระบบจองห้องประชุม</span>
        </Link>

        <div className="ml-auto flex items-center gap-3">
          {/* เกณฑ์การซ่อนเท่ากับ NavBar เป๊ะๆ ไม่งั้นตอนล็อกอินเสร็จหัวหน้าจะกระตุก */}
          <div className="hidden sm:block">
            <ThemeSwitcher />
          </div>
          <Button href="/login" variant="secondary" size="sm">
            เข้าสู่ระบบ
          </Button>
          <Button href="/signup" size="sm">
            สมัครใช้งาน
          </Button>
        </div>
      </div>
    </header>
  );
}
