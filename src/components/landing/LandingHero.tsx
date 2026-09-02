import { Button } from "@/components/ui/Button";
import { AppPreview } from "./AppPreview";

/** สรุปการใช้งาน ณ วินาทีที่เรนเดอร์ — `null` เมื่อยังไม่มีห้องในระบบหรือดึงข้อมูลไม่สำเร็จ */
export interface RoomUsage {
  bookedNow: number;
  total: number;
}

/*
 * หัวข้อหลักใช้คำเดียวกับแผงซ้ายของ AuthShell ตั้งใจให้คนที่กด "เข้าสู่ระบบ" ต่อ
 * เจอประโยคเดิมอีกครั้ง จะได้รู้สึกว่ายังอยู่ในระบบเดียวกัน ไม่ใช่หลงไปเว็บอื่น
 *
 * CTA คู่: สมัครใช้งานเป็นปุ่มหลัก เข้าสู่ระบบเป็นปุ่มรอง เพราะคนที่มีบัญชีอยู่แล้ว
 * ส่วนใหญ่จะถูก redirect ไป /rooms ตั้งแต่เปิดหน้านี้ ไม่ค่อยได้เห็นปุ่มนี้อยู่แล้ว
 *
 * แถบสรุปใต้ CTA รับตัวเลขมาเป็น prop ไม่ดึงข้อมูลเอง — หน้านี้ยังเป็น presentation ล้วน
 * และคนที่เห็นเป็นผู้เยี่ยมชมที่ยังไม่ล็อกอิน จึงบอกแค่ "กี่ห้อง" ไม่บอกว่าห้องไหนหรือใครจอง
 */
export function LandingHero({ usage }: { usage: RoomUsage | null }) {
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

          {usage ? (
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
              <span className={usage.bookedNow > 0 ? "badge-danger badge-dot" : "badge-success badge-dot"}>
                {usage.bookedNow > 0 ? `จองอยู่ ${usage.bookedNow} ห้อง` : "ตอนนี้ว่างทุกห้อง"}
              </span>
              จากห้องประชุมทั้งหมด {usage.total} ห้อง
            </p>
          ) : null}
        </div>

        {/*
          ส่งจำนวนห้องจริงให้ preview ด้วย ไม่ใช่ปล่อยให้มันตายตัวที่ 3 ห้อง
          ไม่งั้นตารางจะมีจำนวนคอลัมน์ไม่ตรงกับเลขในแถบสรุปที่อยู่เหนือมันไม่ถึงคืบ
        */}
        <AppPreview roomCount={usage?.total ?? null} />
      </div>
    </section>
  );
}
