"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast/use-toast";

/*
 * แจ้งเหตุที่ผู้ใช้มาอยู่หน้า /pending แล้วลบ query ทิ้ง
 *
 * ★ toast เป็นตัวเสริม ไม่ใช่ตัวหลัก
 *   สถานะ "รออนุมัติ" อยู่ได้เป็นวันๆ ส่วน toast หายไปในไม่กี่วินาที
 *   คำตอบถาวรของคำถาม "ตอนนี้ฉันอยู่สถานะไหน" จึงยังเป็นตัวหน้า /pending เอง
 *   ที่บอกชื่อ อีเมล และสังกัดไว้ให้กลับมาดูได้เสมอ
 *   toast มีไว้ตอบคำถามคนละข้อคือ "ทำไมฉันถึงมาอยู่ตรงนี้"
 *
 * ★ แยกเป็น client leaf ตัวเล็กด้วยเหตุผลเดียวกับ BookingSuccessToast:
 *   ทั้งการสมัครและการถูกกันออกจากหน้าอื่นจบด้วย redirect หน้าเดิมจึง unmount
 *   ไปก่อนที่ toast จะได้ขึ้น ต้องให้หน้าปลายทางเป็นคนยิงแทน
 *
 * ลบ query ด้วย replace เพื่อไม่ให้กด refresh แล้ว toast เด้งซ้ำ
 * และไม่ให้ปุ่ม back พาย้อนกลับมาที่สถานะเดิม
 */
export type PendingNoticeReason = "signedup" | "blocked";

const MESSAGES: Record<PendingNoticeReason, { message: string; variant: "success" | "info" }> = {
  signedup: {
    message: "สมัครสมาชิกเรียบร้อยแล้ว รอผู้ดูแลระบบอนุมัติก่อนเริ่มใช้งาน",
    variant: "success",
  },
  /*
   * ยิงทุกครั้งที่ถูกกันออกจากหน้าอื่น ไม่ใช่เฉพาะตอนล็อกอินครั้งแรก โดยตั้งใจ
   * เพราะทุกครั้งที่ถูกเด้งกลับมาคือทุกครั้งที่ผู้ใช้กำลังสงสัยว่าเกิดอะไรขึ้น
   * ถ้าเงียบไว้ เขาจะคิดว่าลิงก์เสียหรือระบบพัง แทนที่จะรู้ว่ายังไม่ถึงคิวตัวเอง
   */
  blocked: {
    message: "บัญชีของคุณยังรอการอนุมัติ จึงยังเข้าส่วนนั้นไม่ได้",
    variant: "info",
  },
};

export function PendingNoticeToast({ reason }: { reason: PendingNoticeReason | null }) {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const firedRef = useRef(false);

  useEffect(() => {
    if (!reason || firedRef.current) return;
    firedRef.current = true;

    toast(MESSAGES[reason]);
    router.replace(pathname);
  }, [reason, toast, router, pathname]);

  return null;
}
