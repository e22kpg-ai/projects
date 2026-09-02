/**
 * ไอคอนทั้งระบบ — วาดเป็น inline SVG เอง ไม่ลง icon library
 *
 * กติกา 3 ข้อของทุกตัวในไฟล์นี้:
 *  1. ใช้ `currentColor` เสมอ สีจึงมาจาก text-* ของ parent และเปลี่ยนตาม skin/โหมดเอง
 *  2. `aria-hidden` + `focusable="false"` เสมอ — ไอคอนไม่เคยเป็นข้อความ ความหมายอยู่ที่ aria-label ของปุ่ม
 *  3. ขนาดคุมด้วยคลาส (size-4 ฯลฯ) ไม่ hardcode width/height เพื่อให้ scale ตาม font ได้
 *
 * ไม่มี directive: ใช้ได้ทั้งฝั่ง server และ client
 */

type IconProps = { className?: string };

function Svg({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={className ?? "size-4"}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 6.5L8 10.5L12 6.5" />
    </Svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M10 3.5L5.5 8L10 12.5" />
    </Svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 3.5L10.5 8L6 12.5" />
    </Svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 8.4L6.2 11.5L13 4.5" />
    </Svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 4L12 12M12 4L4 12" />
    </Svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="2.25" y="3.25" width="11.5" height="10.5" rx="2" />
      <path d="M2.25 6.5h11.5M5.5 1.75v3M10.5 1.75v3" />
    </Svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="8" cy="8" r="5.75" />
      <path d="M8 4.75V8.2l2.1 1.4" />
    </Svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="7.25" cy="7.25" r="4.5" />
      <path d="M10.6 10.6L13.75 13.75" />
    </Svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="8" cy="5.5" r="2.5" />
      <path d="M3 13.5c0-2.5 2.2-4 5-4s5 1.5 5 4" />
    </Svg>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 14.25S12.75 9.9 12.75 6.5a4.75 4.75 0 10-9.5 0C3.25 9.9 8 14.25 8 14.25z" />
      <circle cx="8" cy="6.4" r="1.75" />
    </Svg>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M1.5 8S4 3.75 8 3.75 14.5 8 14.5 8 12 12.25 8 12.25 1.5 8 1.5 8z" />
      <circle cx="8" cy="8" r="1.9" />
    </Svg>
  );
}

export function EyeOffIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6.3 3.99A6.6 6.6 0 018 3.75C12 3.75 14.5 8 14.5 8a11.6 11.6 0 01-2.2 2.63M9.75 9.83a1.9 1.9 0 01-2.7-2.68" />
      <path d="M4.35 4.85A11.5 11.5 0 001.5 8s2.5 4.25 6.5 4.25c1.02 0 1.94-.22 2.75-.57" />
      <path d="M2 2l12 12" />
    </Svg>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="8" cy="8" r="5.75" />
      <path d="M8 7.4v3.3M8 5.35v.05" />
    </Svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 2.4l6 10.4H2L8 2.4z" />
      <path d="M8 6.6v2.6M8 11.1v.05" />
    </Svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="8" cy="8" r="5.75" />
      <path d="M5.5 8.2L7.3 10L10.6 6.2" />
    </Svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" />
    </Svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="8" cy="8" r="3.25" />
      <path d="M8 1v1.25M8 13.75V15M15 8h-1.25M2.25 8H1M12.95 3.05l-.88.88M3.93 12.07l-.88.88M12.95 12.95l-.88-.88M3.93 3.93l-.88-.88" />
    </Svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 2a4 4 0 0 0 6 6 6 6 0 1 1-6-6Z" />
    </Svg>
  );
}

/** จอคอมพิวเตอร์ — ใช้สื่อโหมด "ตามระบบ" (ตามค่าที่เครื่องตั้งไว้) */
export function MonitorIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="1.5" y="2.5" width="13" height="9" rx="1.5" />
      <path d="M5.5 14h5M8 11.5V14" />
    </Svg>
  );
}

/** ตึกออฟฟิศ — ใช้สื่อ skin "องค์กร" */
export function BuildingIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2.5 14V3a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v11" />
      <path d="M9.5 14V6.5h3a1 1 0 0 1 1 1V14" />
      <path d="M1.5 14h13" />
      <path d="M5 5h2M5 8h2M11.5 10h.5" />
    </Svg>
  );
}

/** ใบไม้ — ใช้สื่อ skin "ป่าไม้" */
export function LeafIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7.3 13.3A4.7 4.7 0 0 1 6.5 4.1C10.3 3.3 11.3 3 12.7 1.3c.7 1.3 1.3 2.8 1.3 5.4 0 3.7-3.2 6.6-6.7 6.6Z" />
      <path d="M1.3 14c0-2 1.2-3.6 3.4-4C6.3 9.7 8 8.7 8.7 8" />
    </Svg>
  );
}
