import { cx } from "./cx";
import { AlertIcon, CheckCircleIcon, InfoIcon } from "./Icons";

/*
 * แจ้งเตือนระดับฟอร์มหรือระดับหน้า (คนละอย่างกับ .form-error ที่ผูกกับ field เดียว)
 *
 * variant "danger" ใช้ role="alert" เพราะเป็นสิ่งที่ขัดจังหวะผู้ใช้จริง
 * ที่เหลือใช้ role="status" ซึ่ง screen reader จะอ่านตอนพักไม่แทรกกลางคัน
 *
 * ไม่มี "use client": ไม่มี state
 */
export type AlertVariant = "danger" | "warning" | "success" | "info";

const VARIANT_CLASS: Record<AlertVariant, string> = {
  danger: "alert-danger",
  warning: "alert-warning",
  success: "alert-success",
  info: "alert-info",
};

const VARIANT_ICON: Record<AlertVariant, React.ComponentType<{ className?: string }>> = {
  danger: AlertIcon,
  warning: AlertIcon,
  success: CheckCircleIcon,
  info: InfoIcon,
};

export function Alert({
  variant = "danger",
  children,
  className,
}: {
  variant?: AlertVariant;
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = VARIANT_ICON[variant];

  return (
    <div
      role={variant === "danger" ? "alert" : "status"}
      className={cx(VARIANT_CLASS[variant], className)}
    >
      <Icon className="alert-icon" />
      <span>{children}</span>
    </div>
  );
}
