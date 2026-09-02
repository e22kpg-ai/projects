import { Button } from "@/components/ui/Button";
import { AppPreview } from "./AppPreview";

/*
 * หัวข้อหลักใช้คำเดียวกับแผงซ้ายของ AuthShell ตั้งใจให้คนที่กด "เข้าสู่ระบบ" ต่อ
 * เจอประโยคเดิมอีกครั้ง จะได้รู้สึกว่ายังอยู่ในระบบเดียวกัน ไม่ใช่หลงไปเว็บอื่น
 *
 * CTA คู่: สมัครใช้งานเป็นปุ่มหลัก เข้าสู่ระบบเป็นปุ่มรอง เพราะคนที่มีบัญชีอยู่แล้ว
 * ส่วนใหญ่จะถูก redirect ไป /rooms ตั้งแต่เปิดหน้านี้ ไม่ค่อยได้เห็นปุ่มนี้อยู่แล้ว
 */
export function LandingHero() {
  return (
    <section className="landing-hero border-b border-border">
      <div className="max-w-5xl mx-auto w-full px-6 py-16 grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col gap-6">
          <span className="badge self-start">ใช้ภายในองค์กร</span>

          <h1 className="text-3xl sm:text-4xl font-semibold leading-snug text-balance">
            จองห้องประชุมให้จบใน 30 วินาที
          </h1>

          <p className="text-muted max-w-prose">
            เห็นห้องว่างทั้งวันในหน้าเดียว เลือกช่วงเวลาแล้วกดยืนยัน ระบบกันการจองชนกันให้เอง
            ไม่ต้องไล่ถามในแชทหรือแย่งกันแก้ไฟล์ตารางร่วมอีกต่อไป
          </p>

          <div className="flex flex-wrap gap-3">
            <Button href="/signup" size="lg">
              เริ่มใช้งาน
            </Button>
            <Button href="/login" variant="secondary" size="lg">
              เข้าสู่ระบบ
            </Button>
          </div>
        </div>

        <AppPreview />
      </div>
    </section>
  );
}
