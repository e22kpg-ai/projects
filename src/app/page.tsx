import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getRoomsWithStatus } from "@/adapters/driving/queries/room.queries";
import { getSessionUser } from "@/adapters/driving/queries/session.queries";
import { FeatureSection } from "@/components/landing/FeatureSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHero, type RoomUsage } from "@/components/landing/LandingHero";
import { StepsSection } from "@/components/landing/StepsSection";

export const metadata: Metadata = {
  title: "ระบบจองห้องประชุม",
  description: "จองห้องประชุมภายในองค์กร เห็นห้องว่างทั้งวันในหน้าเดียว และกันการจองชนกันให้อัตโนมัติ",
};

/*
 * สรุปว่าตอนนี้มีห้องถูกจองอยู่กี่ห้อง จากทั้งหมดกี่ห้อง
 *
 * ใช้ listRoomsWithStatus ตัวเดิมที่หน้า /rooms ใช้ ไม่เขียนการนับขึ้นใหม่ — นิยามของคำว่า
 * "ไม่ว่างตอนนี้" อยู่ใน use-case ที่เดียว ถ้าแยกไปนับเองที่นี่ วันที่กติกาเปลี่ยน
 * (เช่น นับ buffer ก่อนเริ่มประชุม) ตัวเลขสองหน้าจะไม่ตรงกันโดยไม่มีใครรู้
 *
 * ห่อ try/catch เพราะนี่คือประตูหน้าบ้านที่คนยังไม่ล็อกอินเปิดดู ถ้า DB ล่มแล้วปล่อยให้ throw
 * ทั้งหน้าจะกลายเป็น 500 รวมถึงปุ่ม "เข้าสู่ระบบ" ที่ไม่ได้เกี่ยวกับตัวเลขนี้เลย
 * แถบสรุปเป็นของแถม หายไปเงียบๆ ดีกว่าลากทั้งหน้าล้มตาม
 */
async function getRoomUsage(): Promise<RoomUsage | null> {
  try {
    const rooms = await getRoomsWithStatus();
    if (rooms.length === 0) return null;

    return { bookedNow: rooms.filter((room) => room.isBusyNow).length, total: rooms.length };
  } catch (error) {
    console.error("โหลดสรุปสถานะห้องสำหรับหน้าแรกไม่สำเร็จ", error);
    return null;
  }
}

/*
 * หน้าแรกสาธารณะ — หน้าเดียวในระบบที่คนยังไม่ล็อกอินเปิดดูได้
 * (src/proxy.ts บังคับล็อกอินเฉพาะ /rooms, /calendar, /admin เท่านั้น "/" จึงหลุดมาถึงตรงนี้ได้)
 *
 * ใช้ getSessionUser() ไม่ใช่ requireUser() เพราะที่นี่ "ไม่มี session" ไม่ใช่ความผิดพลาด
 * — เป็นเคสหลักของหน้านี้ด้วยซ้ำ ส่วนคนที่ล็อกอินอยู่แล้วส่งไป /rooms เลย
 * จะได้ไม่ต้องมากดผ่านหน้าโฆษณาทุกเช้า
 *
 * เช็ค session ให้จบก่อนค่อยดึงสรุปห้อง เพราะคนที่ล็อกอินอยู่จะถูก redirect ทิ้งไปเลย
 * ดึงพร้อมกันแบบ Promise.all จะเสีย query ฟรีทุกครั้งที่พนักงานเปิดหน้านี้
 *
 * ทั้งหน้าเป็น presentation ล้วน ไม่มี business rule จึงไม่แตะ src/core/
 */
export default async function HomePage() {
  if (await getSessionUser()) {
    redirect("/rooms");
  }

  const usage = await getRoomUsage();

  return (
    <>
      <LandingHeader />

      <main className="flex-1">
        <LandingHero usage={usage} />
        <FeatureSection />
        <StepsSection />
      </main>

      <LandingFooter />
    </>
  );
}
