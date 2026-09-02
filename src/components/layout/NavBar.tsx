import Link from "next/link";
import { getSessionUser } from "@/adapters/driving/queries/session.queries";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { NavLinks } from "./NavLinks";
import { SignOutButton } from "./SignOutButton";

/*
 * ยังเป็น Server Component — เฉพาะส่วนที่ต้องมี state ถูกแตกออกไปเป็น client leaf แล้ว
 * (NavLinks ใช้ usePathname, ThemeSwitcher ใช้ store, SignOutButton มี handler)
 *
 * เป็น async เพื่ออ่าน role ของผู้ใช้ปัจจุบันแล้วส่งลงไปให้ NavLinks —
 * นี่เป็นแค่ความสะดวกด้าน UI (ซ่อนลิงก์) ไม่ใช่จุดบังคับสิทธิ์จริง
 * จุดบังคับสิทธิ์จริงอยู่ที่หน้า /admin/* และ use-case แต่ละตัว
 *
 * getSessionUser ห่อด้วย cache() ไว้แล้ว การเรียกซ้ำกับตัวหน้าจึงไม่ยิง DB เพิ่ม
 */
export async function NavBar() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
      <div className="max-w-5xl mx-auto flex items-center gap-4 px-6 py-3">
        <Link
          href="/rooms"
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

        <NavLinks role={user?.role} />

        <div className="ml-auto flex items-center gap-3">
          {/* พอเป็นไอคอนล้วนก็เล็กลงมาก โผล่ได้ตั้งแต่ sm ไม่ต้องรอ md เหมือนตอนยังเป็น Select */}
          <div className="hidden sm:block">
            <ThemeSwitcher />
          </div>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
