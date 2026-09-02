"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import {
  BuildingIcon,
  LeafIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
} from "@/components/ui/Icons";
import { MODES, SKINS, type Mode, type Skin } from "./theme-config";
import { useThemeStore } from "./theme-store";

/*
 * ตอน SSR store ยังเป็นค่า default แต่ฝั่ง client จะ rehydrate จาก localStorage ทีหลัง
 * ถ้า render ค่าจริงตั้งแต่แรกจะได้ hydration mismatch จึงรอให้ persist rehydrate เสร็จก่อน
 * (server snapshot คืน false เสมอ → ทั้งฝั่ง server และ render แรกของ client ได้ผลตรงกันแน่นอน)
 */
function useThemeHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useThemeStore.persist.onFinishHydration(onChange),
    () => useThemeStore.persist.hasHydrated(),
    () => false,
  );
}

/*
 * ไอคอนอยู่ที่นี่ ไม่ได้อยู่ใน theme-config.ts เพราะไฟล์นั้นต้องเป็น pure TS ไม่มี React
 * (inline script กัน FOUC ก็ import มันไปใช้) — ที่นี่คือชั้น UI จึงถือ JSX ได้
 *
 * ประกาศเป็น Record<Skin, …> / Record<Mode, …> เต็มรูปแบบ เพิ่ม skin/โหมดใหม่ใน theme-config
 * แล้วลืมใส่ไอคอน TypeScript จะฟ้องตรงนี้ทันที ไม่หลุดไปเป็นช่องว่างบนหน้าจอ
 */
const SKIN_ICONS: Record<Skin, ReactNode> = {
  corporate: <BuildingIcon className="size-4" />,
  forest: <LeafIcon className="size-4" />,
};

const MODE_ICONS: Record<Mode, ReactNode> = {
  light: <SunIcon className="size-4" />,
  dark: <MoonIcon className="size-4" />,
  system: <MonitorIcon className="size-4" />,
};

const SKIN_OPTIONS = SKINS.map((s) => ({ value: s.id, label: s.label, icon: SKIN_ICONS[s.id] }));
const MODE_OPTIONS = MODES.map((m) => ({ value: m.id, label: m.label, icon: MODE_ICONS[m.id] }));

/*
 * ทั้งสองแถวเป็น SegmentedControl ไอคอนล้วนหน้าตาเดียวกัน — skin เคยเป็น <Select> กว้าง 9rem
 * ซึ่งกินที่บนแถบ nav และต้องกดสองครั้ง (เปิดลิสต์ก่อนค่อยเลือก) ทั้งที่มีให้เลือกแค่สองค่า
 * พอเป็นปุ่มเรียงกันแล้วเห็นค่าที่เลือกอยู่ทันทีและกดครั้งเดียวจบ เหมือนแถวโหมดสว่าง/มืด
 */
export function ThemeSwitcher() {
  const hydrated = useThemeHydrated();
  const skin = useThemeStore((state) => state.skin);
  const mode = useThemeStore((state) => state.mode);
  const setSkin = useThemeStore((state) => state.setSkin);
  const setMode = useThemeStore((state) => state.setMode);

  /*
   * เดิมกันที่ด้วยกล่องเปล่า h-9 w-64 ซึ่งเป็นเลขที่ต้องมาไล่แก้เองทุกครั้งที่ control เปลี่ยนขนาด
   * เปลี่ยนมาเรนเดอร์ของจริงแล้วซ่อนด้วย invisible แทน — ขนาดตรงกันเป๊ะโดยอัตโนมัติ
   * (ยังเป็น markup ชุดเดียวกับที่ server render ทุกประการ จึงไม่มี mismatch)
   */
  return (
    <div
      className={hydrated ? "flex items-center gap-2" : "flex items-center gap-2 invisible"}
      aria-hidden={hydrated ? undefined : true}
      inert={!hydrated}
    >
      <SegmentedControl
        name="theme-skin"
        options={SKIN_OPTIONS}
        value={skin}
        onValueChange={(next) => setSkin(next as Skin)}
        aria-label="ธีมสี"
      />

      <SegmentedControl
        name="theme-mode"
        options={MODE_OPTIONS}
        value={mode}
        onValueChange={(next) => setMode(next as Mode)}
        aria-label="โหมดสีจอ"
      />
    </div>
  );
}
