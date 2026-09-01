import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { NavLinks } from "./NavLinks";
import { SignOutButton } from "./SignOutButton";

/*
 * ยังเป็น Server Component — เฉพาะส่วนที่ต้องมี state ถูกแตกออกไปเป็น client leaf แล้ว
 * (NavLinks ใช้ usePathname, ThemeSwitcher ใช้ store, SignOutButton มี handler)
 */
export function NavBar() {
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

        <NavLinks />

        <div className="ml-auto flex items-center gap-3">
          {/* ตัวสลับธีมกินพื้นที่พอสมควร บนจอเล็กจึงซ่อนไว้ก่อน ฟังก์ชันหลักสำคัญกว่า */}
          <div className="hidden md:block">
            <ThemeSwitcher />
          </div>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
