import { CalendarIcon, CheckCircleIcon, UsersIcon } from "@/components/ui/Icons";

/*
 * โครงหน้าสำหรับ /login และ /signup — แผงแบรนด์ซ้าย ฟอร์มขวา
 *
 * แผงซ้ายซ่อนบนจอเล็ก (hidden lg:flex) เพราะบนมือถือพื้นที่ควรเป็นของฟอร์มทั้งหมด
 * ไม่ใช่ของภาพประกอบ — และไม่ต้องโหลดรูปอะไรเพิ่มเลย ใช้ token สีล้วน
 *
 * เป็น Server Component: ไม่มี state ไม่มี handler
 */

const POINTS = [
  { icon: CalendarIcon, text: "เห็นห้องว่างทั้งวันในหน้าเดียว" },
  { icon: CheckCircleIcon, text: "กันจองชนกันตั้งแต่ตอนกดยืนยัน" },
  { icon: UsersIcon, text: "ใช้ร่วมกันได้ทั้งองค์กร" },
];

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 grid lg:grid-cols-2">
      <section className="hidden lg:flex flex-col justify-between bg-brand-500 text-on-brand p-10">
        <div className="flex items-center gap-2 font-semibold">
          <span className="grid size-8 place-items-center rounded-card bg-on-brand/15">◈</span>
          ระบบจองห้องประชุม
        </div>

        <div className="flex flex-col gap-6 max-w-sm">
          <h2 className="text-3xl font-semibold leading-snug text-balance">
            จองห้องประชุมให้จบใน 30 วินาที
          </h2>
          <ul className="flex flex-col gap-3">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm">
                <Icon className="size-5 shrink-0 opacity-90" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm opacity-70">ใช้ภายในองค์กรเท่านั้น</p>
      </section>

      <section className="flex items-center justify-center p-6">{children}</section>
    </main>
  );
}
