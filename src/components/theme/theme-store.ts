"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  applyTheme,
  DEFAULT_MODE,
  DEFAULT_SKIN,
  THEME_STORAGE_KEY,
  type Mode,
  type Skin,
} from "./theme-config";

type ThemeState = {
  skin: Skin;
  mode: Mode;
  setSkin: (skin: Skin) => void;
  setMode: (mode: Mode) => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      skin: DEFAULT_SKIN,
      mode: DEFAULT_MODE,
      setSkin: (skin) => {
        applyTheme(skin, get().mode);
        set({ skin });
      },
      setMode: (mode) => {
        applyTheme(get().skin, mode);
        set({ mode });
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      partialize: (state) => ({ skin: state.skin, mode: state.mode }),
      /*
       * inline script ใน ThemeScript ใส่ attribute ให้ตั้งแต่ก่อน paint แล้ว
       * ที่ sync ซ้ำตรงนี้เผื่อกรณี localStorage ถูกแก้จากแท็บอื่นระหว่างที่หน้านี้เปิดค้างไว้
       */
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.skin, state.mode);
      },
    },
  ),
);
