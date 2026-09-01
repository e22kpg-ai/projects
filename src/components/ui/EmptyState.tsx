import { cx } from "./cx";

/**
 * สถานะ "ไม่มีอะไรให้แสดง" — แทน <p className="text-muted"> ลอยๆ ที่ใช้อยู่เดิม
 *
 * `action` เอาไว้ใส่ปุ่มพาผู้ใช้ไปต่อ เพราะหน้าจอว่างที่ไม่บอกว่าให้ทำอะไรต่อคือทางตัน
 */
export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("empty-state", className)}>
      <p className="empty-state-title">{title}</p>
      {description && <p className="empty-state-body">{description}</p>}
      {action}
    </div>
  );
}
