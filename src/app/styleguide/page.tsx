import { notFound } from "next/navigation";
import { StyleguideContent } from "@/components/styleguide/StyleguideContent";

/*
 * แกลเลอรีรวม component ทุกตัว — เอาไว้ตรวจงานตอนแก้ design system
 *
 * ปิดใน production ด้วย notFound() เพราะเป็นเครื่องมือของทีมพัฒนา ไม่ใช่หน้าของระบบ
 * (เงื่อนไขเป็นค่าคงที่ตอน build ตัว StyleguideContent จึงถูก tree-shake ออกจาก bundle production ไปเลย)
 *
 * ★ ด่านนี้กัน "โค้ดไม่ถูกส่งขึ้นไป" ส่วนด่านที่กัน "เข้าถึงไม่ได้" อยู่ที่ src/proxy.ts
 *   เพราะ notFound() ตรงนี้เปลี่ยนสถานะเป็น 404 ไม่ทัน — root loading.tsx ทำให้หน้าเรนเดอร์
 *   แบบ streaming สถานะ 200 ถูกส่งออกไปก่อนโค้ดบรรทัดนี้จะทำงานเสมอ (เหตุผลเต็มอยู่ใน proxy.ts)
 *   ต้องมีทั้งคู่ ลบตัวใดตัวหนึ่งแล้วจะเหลือรูโหว่คนละแบบกัน
 */
export default function StyleguidePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <StyleguideContent />;
}
