/**
 * ตัวหมุนบอกว่ากำลังทำงานอยู่ — ใช้ในปุ่มตอน loading และหน้าที่รอข้อมูล
 *
 * ไม่มี directive: ไม่มี hook เลย ใช้ได้ทั้งสองฝั่ง
 * `animate-spin` ถูกปิดอัตโนมัติให้คนที่ตั้ง prefers-reduced-motion แล้วที่ index.css
 */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "size-4 animate-spin"}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.75" opacity="0.25" />
      <path
        d="M14.25 8A6.25 6.25 0 008 1.75"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
