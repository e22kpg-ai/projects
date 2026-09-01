/**
 * แหล่งความจริงเดียวของ design system ฝั่ง TypeScript
 *
 * ไฟล์นี้เป็น presentation concern ล้วนๆ (ไม่ใช่ business rule) จึงอยู่ใน components/ ไม่ใช่ core/
 * และต้องเป็น pure TS ไม่มี React/Next เพราะถูกใช้ทั้งใน store, ใน inline script และใน UI
 *
 * ชื่อ skin ที่นี่ต้องตรงกับ [data-skin="..."] ใน src/styles/skins.css
 */

export const SKINS = [
  { id: "corporate", label: "องค์กร (น้ำเงิน)" },
  { id: "forest", label: "ป่าไม้ (เขียว)" },
] as const;

export const MODES = [
  { id: "light", label: "สว่าง" },
  { id: "dark", label: "มืด" },
  { id: "system", label: "ตามระบบ" },
] as const;

export type Skin = (typeof SKINS)[number]["id"];
export type Mode = (typeof MODES)[number]["id"];

export const DEFAULT_SKIN: Skin = "corporate";
export const DEFAULT_MODE: Mode = "system";

/** key ใน localStorage — ใช้ร่วมกันระหว่าง zustand persist กับ inline script กัน FOUC */
export const THEME_STORAGE_KEY = "meeting-room-theme";

export function isSkin(value: unknown): value is Skin {
  return SKINS.some((skin) => skin.id === value);
}

export function isMode(value: unknown): value is Mode {
  return MODES.some((mode) => mode.id === value);
}

/**
 * เขียนค่าธีมลง <html> — จุดเดียวในระบบที่แตะ DOM เรื่องธีม
 * โหมด "system" คือการ "ไม่ใส่" data-theme แล้วปล่อยให้ @media (prefers-color-scheme) ใน theme.css จัดการ
 * จึงไม่ต้องมี matchMedia listener เลย OS เปลี่ยนเมื่อไหร่หน้าเว็บตามทันที
 */
export function applyTheme(skin: Skin, mode: Mode): void {
  const root = document.documentElement;
  root.dataset.skin = skin;

  if (mode === "system") {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = mode;
  }
}
