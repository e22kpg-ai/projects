import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-5xl mx-auto w-full px-6 py-6 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className="grid size-6 place-items-center rounded-control bg-brand-500 text-on-brand text-xs"
          >
            ◈
          </span>
          ระบบจองห้องประชุม · ใช้ภายในองค์กรเท่านั้น
        </span>

        <Link href="/login" className="link">
          เข้าสู่ระบบ
        </Link>
      </div>
    </footer>
  );
}
