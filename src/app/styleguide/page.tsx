import { notFound } from "next/navigation";
import { StyleguideContent } from "@/components/styleguide/StyleguideContent";

/*
 * แกลเลอรีรวม component ทุกตัว — เอาไว้ตรวจงานตอนแก้ design system
 *
 * ปิดใน production ด้วย notFound() เพราะเป็นเครื่องมือของทีมพัฒนา ไม่ใช่หน้าของระบบ
 * (เงื่อนไขเป็นค่าคงที่ตอน build ตัว StyleguideContent จึงถูก tree-shake ออกจาก bundle production ไปเลย)
 */
export default function StyleguidePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <StyleguideContent />;
}
