"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast/use-toast";

/*
 * แจ้งผลการจองสำเร็จ แล้วลบ ?booked=1 ทิ้งจาก URL
 *
 * ต้องแยกเป็น client leaf เล็กๆ แบบนี้เพราะ createBookingAction จบด้วย redirect
 * ฟอร์มจึง unmount ไปก่อนที่ toast จะได้ขึ้น
 *
 * ลบ query ออกด้วย replace เพื่อไม่ให้กด refresh แล้ว toast เด้งซ้ำ
 * และไม่ให้ปุ่ม back ของเบราว์เซอร์พาย้อนกลับมาที่สถานะนี้
 */
export function BookingSuccessToast({ show }: { show: boolean }) {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const firedRef = useRef(false);

  useEffect(() => {
    if (!show || firedRef.current) return;
    firedRef.current = true;

    toast({ message: "จองห้องประชุมเรียบร้อยแล้ว", variant: "success" });
    router.replace(pathname);
  }, [show, toast, router, pathname]);

  return null;
}
