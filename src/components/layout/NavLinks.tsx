"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/components/ui/cx";
import type { AccountStatus } from "@/core/domain/account-rules";
import type { Role } from "@/core/ports/auth-service.port";

/*
 * ลิงก์เมนูหลัก แยกเป็น client component ตัวเล็กๆ เพราะต้องใช้ usePathname
 * NavBar ที่ครอบอยู่จึงยังเป็น Server Component ได้เหมือนเดิม
 */

const LINKS = [
  { href: "/rooms", label: "ห้องประชุม" },
  { href: "/calendar", label: "ปฏิทิน" },
] as const;

const ADMIN_LINK = { href: "/admin/rooms", label: "ผู้ดูแลระบบ" } as const;

export function NavLinks({ role, status }: { role?: Role; status?: AccountStatus }) {
  const pathname = usePathname();

  /*
   * ★ บัญชีที่ยังไม่ถูกอนุมัติไม่ต้องเห็นเมนูเลย
   *
   *   ลิงก์พวกนี้กดแล้วเด้งกลับ /pending อยู่ดี การโชว์ไว้จึงมีแต่ทำให้คนสับสนว่า
   *   ตัวเองใช้ได้แล้วหรือระบบพัง — เมนูที่กดไม่ได้จริงแย่กว่าไม่มีเมนู
   *
   *   นี่เป็นเรื่องหน้าตาล้วน ไม่ใช่การบังคับสิทธิ์ ตัวจริงอยู่ที่ requireApprovedUser
   *   และที่ use-case ซึ่งเช็คซ้ำอีกชั้นเสมอ
   */
  if (status && status !== "approved") return null;

  const links = role === "admin" ? [...LINKS, ADMIN_LINK] : LINKS;

  return (
    <nav className="flex items-center gap-1" aria-label="เมนูหลัก">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cx(
              "rounded-pill px-3 py-1.5 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-brand-subtle text-brand-500"
                : "text-muted hover:bg-muted/10 hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
