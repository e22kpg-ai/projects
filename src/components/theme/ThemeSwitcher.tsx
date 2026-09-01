"use client";

import { useSyncExternalStore } from "react";
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

export function ThemeSwitcher() {
  const hydrated = useThemeHydrated();
  const skin = useThemeStore((state) => state.skin);
  const mode = useThemeStore((state) => state.mode);
  const setSkin = useThemeStore((state) => state.setSkin);
  const setMode = useThemeStore((state) => state.setMode);

  // กันที่ไว้ด้วยกล่องเปล่าขนาดเท่ากัน เพื่อไม่ให้ navbar ขยับตอนของจริงโผล่
  if (!hydrated) {
    return <div className="h-9 w-64" aria-hidden />;
  }

  return (
    <div className="flex items-center gap-2">
      <label className="sr-only" htmlFor="skin-select">
        ธีมสี
      </label>
      <select
        id="skin-select"
        className="select w-32"
        value={skin}
        onChange={(event) => setSkin(event.target.value as Skin)}
      >
        {SKINS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-1" role="group" aria-label="โหมดสีจอ">
        {MODES.map((option) => (
          <button
            key={option.id}
            type="button"
            className="btn-ghost px-2 text-xs"
            aria-pressed={mode === option.id}
            onClick={() => setMode(option.id as Mode)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
