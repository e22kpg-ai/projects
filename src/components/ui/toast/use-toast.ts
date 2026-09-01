"use client";

import { useToastStore } from "./toast-store";

/**
 * ยิง toast จากใน component
 *
 * ทั้ง toast และ dismiss มี identity คงที่ (มาจาก store โดยตรง)
 * จึงใส่ใน dependency array ของ effect ได้โดยไม่ทำให้ effect วิ่งซ้ำ
 */
export function useToast() {
  const toast = useToastStore((state) => state.push);
  const dismiss = useToastStore((state) => state.dismiss);
  return { toast, dismiss };
}
