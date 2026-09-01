"use client";

import { useSyncExternalStore } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
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

const SKIN_OPTIONS = SKINS.map((s) => ({ value: s.id, label: s.label }));
const MODE_OPTIONS = MODES.map((m) => ({ value: m.id, label: m.label }));

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
      <Select
        options={SKIN_OPTIONS}
        value={skin}
        onValueChange={(next) => setSkin(next as Skin)}
        aria-label="ธีมสี"
        size="sm"
        className="w-36"
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
