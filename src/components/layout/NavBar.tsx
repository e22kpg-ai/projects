import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { SignOutButton } from "./SignOutButton";

export function NavBar() {
  return (
    <header className="border-b border-border">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3">
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/rooms">ห้องประชุม</Link>
          <Link href="/calendar">ปฏิทิน</Link>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
