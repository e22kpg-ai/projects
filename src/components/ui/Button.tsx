import Link from "next/link";
import { cx } from "./cx";
import { Spinner } from "./Spinner";
import type { ButtonVariant, Size } from "./types";

/*
 * ปุ่มตัวเดียวที่ใช้ทั้งระบบ — เรนเดอร์เป็น <button> หรือ <Link> ก็ได้
 *
 * ทำไมต้องรองรับสองแบบ: ในโค้ดเดิมมี 4 จุดที่เอาคลาส .btn-* ไปแปะบน <Link> เอง
 * (การ์ดห้อง, ปุ่มวันก่อนหน้า/ถัดไปในปฏิทิน) ถ้าไม่รวมไว้ที่เดียวสไตล์จะเริ่มเพี้ยนกันทีละนิด
 *
 * ทำไมใช้ discriminated union บน `href` ไม่ใช่ generic `as` หรือ asChild:
 *  - โปรเจกต์นี้เปิด typed routes อยู่ (ดู LayoutProps<"/"> ใน app/layout.tsx)
 *    generic polymorphism จะทำให้ inference ของ href พังทันที union แบบนี้เก็บ type เดิมไว้ครบ
 *  - asChild ต้องพึ่ง cloneElement + Slot ซึ่งเป็นแนวคิดของ library ที่โปรเจกต์ห้ามใช้
 *
 * ไม่มี "use client": ไม่มี hook เลย Server Component จึงเรนเดอร์ <Button href> ได้ตรงๆ
 * (แต่ส่ง onClick จาก Server Component ไม่ได้ — ตรงไหนต้องมี handler ให้แตก client leaf เล็กๆ)
 */

interface ButtonBase {
  variant?: ButtonVariant;
  size?: Size;
  /** แสดง spinner แทน iconLeft และกันการกดซ้ำ — children ยังอยู่ ปุ่มจึงไม่หดเปลี่ยนขนาด */
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
}

type LinkHref = React.ComponentProps<typeof Link>["href"];

type ButtonAsButton = ButtonBase &
  Omit<React.ComponentPropsWithRef<"button">, keyof ButtonBase> & { href?: undefined };

type ButtonAsLink = ButtonBase &
  Omit<React.ComponentPropsWithRef<typeof Link>, keyof ButtonBase> & { href: LinkHref };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger",
};

/* md คือค่าเริ่มต้นที่ .btn ฝัง padding ไว้แล้ว จึงไม่ต้องใส่คลาสอะไรเพิ่ม */
const SIZE_CLASS: Record<Size, string> = {
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
};

export function Button(props: ButtonProps) {
  /*
   * แยก prop ของตัว Button ออกจาก prop ที่ต้องส่งต่อให้ element ปลายทาง ในครั้งเดียว
   * ต้อง cast เพราะ TypeScript ทำ rest destructuring บน union ให้ตรงชนิดทั้งสองสาขาไม่ได้
   * — จำกัดการ cast ไว้ที่จุดเดียวตรงนี้ ส่วน `props.href` ข้างล่างยังใช้ union เดิมในการแยกสาขา
   */
  const {
    variant = "primary",
    size = "md",
    loading = false,
    iconLeft,
    iconRight,
    fullWidth,
    className,
    children,
    ...rest
  } = props as ButtonBase & Record<string, unknown>;

  const base = cx(VARIANT_CLASS[variant], SIZE_CLASS[size], fullWidth && "w-full", className);

  const content = (
    <>
      {loading ? <Spinner className="btn-spinner" /> : iconLeft}
      {children}
      {!loading && iconRight}
    </>
  );

  if (props.href !== undefined) {
    const linkProps = rest as unknown as React.ComponentPropsWithRef<typeof Link>;

    /* <Link> ใส่ disabled ไม่ได้ ต้องกันการกดและถอดออกจากลำดับ Tab เอง */
    return (
      <Link
        {...linkProps}
        className={cx(base, loading && "btn-link-disabled")}
        aria-disabled={loading || undefined}
        tabIndex={loading ? -1 : linkProps.tabIndex}
      >
        {content}
      </Link>
    );
  }

  const { type, disabled, ...buttonProps } =
    rest as unknown as React.ComponentPropsWithRef<"button">;

  return (
    <button
      {...buttonProps}
      /* default เป็น "button" กันปุ่มธรรมดาในฟอร์มกลายเป็น submit โดยไม่ตั้งใจ */
      type={type ?? "button"}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={base}
    >
      {content}
    </button>
  );
}
