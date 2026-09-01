"use client";

import type { ReactNode } from "react";
import { create } from "zustand";

/*
 * เก็บ toast ไว้ใน zustand store ไม่ใช่ <ToastProvider> ครอบทั้งแอป
 *
 * เหตุผล:
 *  1. โปรเจกต์มี zustand อยู่แล้วและมี pattern ที่ทีมคุ้นมือ (ดู components/theme/theme-store.ts)
 *  2. Provider ที่ครอบ {children} ใน app/layout.tsx ทำให้ทุกครั้งที่ยิง toast
 *     context เปลี่ยน → subtree ทั้งแอป re-render — store ไม่มีปัญหานี้
 *  3. ยิง toast จากนอก React ได้ เช่นใน error handler ของ authClient
 *  4. เหลือ client leaf แค่ <ToastViewport /> ตัวเดียวใน layout ไม่ต้องห่ออะไรเลย
 *
 * ไม่ใส่ persist โดยตั้งใจ — toast ที่รอดข้ามการ refresh หน้าไม่มีประโยชน์กับใคร
 */

export type ToastVariant = "info" | "success" | "danger" | "warning";

export interface ToastItem {
  id: string;
  message: ReactNode;
  variant: ToastVariant;
  duration: number;
}

export interface ToastInput {
  message: ReactNode;
  variant?: ToastVariant;
  /** 0 = ไม่หายเอง ต้องกดปิด */
  duration?: number;
}

interface ToastState {
  toasts: ToastItem[];
  push: (input: ToastInput) => string;
  dismiss: (id: string) => void;
}

const DEFAULT_DURATION = 4000;
let counter = 0;

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],

  push: (input) => {
    counter += 1;
    const id = `toast-${counter}`;
    const item: ToastItem = {
      id,
      message: input.message,
      variant: input.variant ?? "info",
      duration: input.duration ?? DEFAULT_DURATION,
    };
    set((state) => ({ toasts: [...state.toasts, item] }));
    return id;
  },

  dismiss: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));
