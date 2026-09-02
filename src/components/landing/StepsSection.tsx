import { Button } from "@/components/ui/Button";
import { STEPS } from "./landing-content";

/*
 * ใช้ <ol> ไม่ใช่ <div> เพราะลำดับมีความหมายจริง — screen reader จะอ่านว่า "รายการ 1 จาก 3"
 * ให้เอง เลขในวงกลมจึงเป็นแค่ของประกอบสายตา ใส่ aria-hidden ได้ไม่เสียข้อมูล
 */
export function StepsSection() {
  return (
    <section className="border-t border-border bg-card">
      <div className="max-w-5xl mx-auto w-full px-6 py-14 flex flex-col gap-6">
        <h2 className="text-2xl font-semibold text-balance">ใช้งานแค่สามขั้น</h2>

        <ol className="grid gap-6 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, index) => (
            <li key={title} className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="step-number">
                  {index + 1}
                </span>
                <h3 className="inline-flex items-center gap-2 font-semibold">
                  <Icon className="size-4 shrink-0 text-muted" />
                  {title}
                </h3>
              </div>
              <p className="text-muted text-sm">{body}</p>
            </li>
          ))}
        </ol>

        <Button href="/signup" size="lg" className="self-start">
          สมัครใช้งาน
        </Button>
      </div>
    </section>
  );
}
