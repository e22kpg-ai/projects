import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/adapters/driving/queries/session.queries";
import { FeatureSection } from "@/components/landing/FeatureSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHero } from "@/components/landing/LandingHero";
import { StepsSection } from "@/components/landing/StepsSection";

export const metadata: Metadata = {
  title: "ระบบจองห้องประชุม",
  description: "จองห้องประชุมภายในองค์กร เห็นห้องว่างทั้งวันในหน้าเดียว และกันการจองชนกันให้อัตโนมัติ",
};

/*
 * หน้าแรกสาธารณะ — หน้าเดียวในระบบที่คนยังไม่ล็อกอินเปิดดูได้
 * (src/proxy.ts บังคับล็อกอินเฉพาะ /rooms, /calendar, /admin เท่านั้น "/" จึงหลุดมาถึงตรงนี้ได้)
 *
 * ใช้ getSessionUser() ไม่ใช่ requireUser() เพราะที่นี่ "ไม่มี session" ไม่ใช่ความผิดพลาด
 * — เป็นเคสหลักของหน้านี้ด้วยซ้ำ ส่วนคนที่ล็อกอินอยู่แล้วส่งไป /rooms เลย
 * จะได้ไม่ต้องมากดผ่านหน้าโฆษณาทุกเช้า
 *
 * ทั้งหน้าเป็น presentation ล้วน ไม่มี business rule จึงไม่แตะ src/core/
 */
export default async function HomePage() {
  if (await getSessionUser()) {
    redirect("/rooms");
  }

  return (
    <>
      <LandingHeader />

      <main className="flex-1">
        <LandingHero />
        <FeatureSection />
        <StepsSection />
      </main>

      <LandingFooter />
    </>
  );
}
