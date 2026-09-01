"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/components/ui/cx";
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

export function NavLinks({ role }: { role?: Role }) {
  const pathname = usePathname();
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
