"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { DatePicker } from "@/components/ui/DatePicker";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { CalendarIcon, ClockIcon, SearchIcon, UsersIcon } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Modal";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Radio, RadioGroup } from "@/components/ui/RadioGroup";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { Switch } from "@/components/ui/Switch";
import { Textarea } from "@/components/ui/Textarea";
import { TextInput } from "@/components/ui/TextInput";
import { TimePicker } from "@/components/ui/TimePicker";
import { Tooltip } from "@/components/ui/Tooltip";
import { useToast } from "@/components/ui/toast/use-toast";
import { todayISO } from "@/components/ui/date-utils";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";

const ROOM_OPTIONS = [
  { value: "", label: "ทุกห้อง" },
  { value: "a", label: "Ocean Room" },
  { value: "b", label: "Sky Room" },
  { value: "c", label: "Garden Room (ปิดปรับปรุง)", disabled: true },
  { value: "d", label: "Focus Pod" },
];

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {note && <p className="text-muted text-sm">{note}</p>}
      </div>
      <div className="card flex flex-wrap items-start gap-4">{children}</div>
    </section>
  );
}

export function StyleguideContent() {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [date, setDate] = useState(todayISO());
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [room, setRoom] = useState("");
  const [checked, setChecked] = useState(true);
  const [mode, setMode] = useState("week");
  const [plan, setPlan] = useState("standard");

  return (
    <main className="max-w-4xl mx-auto w-full p-6 flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Styleguide</h1>
          <p className="text-muted text-sm">
            component ทุกตัวในระบบ — สลับ skin กับโหมดด้านขวาเพื่อตรวจว่าทุกอย่างยังอ่านออก
          </p>
        </div>
        <ThemeSwitcher />
      </header>

      <Section title="ปุ่ม" note="variant × size และสถานะ loading / disabled">
        <div className="flex flex-wrap items-center gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">เล็ก</Button>
          <Button size="md">กลาง</Button>
          <Button size="lg">ใหญ่</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button loading>กำลังบันทึก</Button>
          <Button disabled>กดไม่ได้</Button>
          <Button iconLeft={<CalendarIcon />}>มีไอคอน</Button>
          <Button href="/rooms" variant="secondary">
            เรนเดอร์เป็น Link
          </Button>
        </div>
      </Section>

      <Section title="ป้ายสถานะ">
        <span className="badge">ปกติ</span>
        <span className="badge-success badge-dot">ว่าง</span>
        <span className="badge-danger badge-dot">ไม่ว่าง</span>
        <span className="badge-warning badge-dot">ใกล้เริ่ม</span>
      </Section>

      <Section title="กล่องแจ้งเตือน">
        <div className="flex w-full flex-col gap-2">
          <Alert>ห้องนี้ถูกจองในช่วงเวลานี้แล้ว</Alert>
          <Alert variant="warning">ช่วงที่เลือกชนกับการจองอื่น</Alert>
          <Alert variant="success">จองห้องประชุมเรียบร้อยแล้ว</Alert>
          <Alert variant="info">ช่วงที่เลือกยังว่าง</Alert>
        </div>
      </Section>

      <Section title="ช่องกรอกข้อความ" note="ทุกตัวต่อสาย id / aria-describedby / aria-invalid ให้เองผ่าน Field">
        <div className="grid w-full gap-4 sm:grid-cols-2">
          <Field label="หัวข้อการจอง" required>
            <TextInput placeholder="เช่น ประชุมทีม" />
          </Field>
          <Field label="รหัสผ่าน" hint="อย่างน้อย 8 ตัวอักษร" required>
            <PasswordInput />
          </Field>
          <Field label="อีเมล" error="อีเมลนี้ถูกใช้ไปแล้ว">
            <TextInput type="email" defaultValue="dev@example.com" />
          </Field>
          <Field label="รายละเอียด" hint="ไม่บังคับ">
            <Textarea placeholder="อธิบายเพิ่มเติม" />
          </Field>
        </div>
        <div className="input-affix max-w-xs">
          <SearchIcon className="size-4 shrink-0 text-muted" />
          <input className="input-bare" placeholder="ช่องค้นหาที่มีไอคอน" aria-label="ค้นหา" />
        </div>
      </Section>

      <Section
        title="Select"
        note="listbox ที่เขียนเอง — ลองใช้คีย์บอร์ด: ↓ ↑ Home End พิมพ์ตัวอักษรเพื่อกระโดด Esc เพื่อปิด"
      >
        <div className="grid w-full gap-4 sm:grid-cols-2">
          <Field label="ห้องประชุม">
            <Select options={ROOM_OPTIONS} value={room} onValueChange={setRoom} placeholder="เลือกห้อง" />
          </Field>
          <Field label="ปิดใช้งาน">
            <Select options={ROOM_OPTIONS} disabled placeholder="เลือกไม่ได้" />
          </Field>
        </div>
      </Section>

      <Section
        title="DatePicker / TimePicker"
        note="แสดงเป็น พ.ศ. แต่ค่าที่ส่งออกเป็น ค.ศ. YYYY-MM-DD เสมอ — ลองกดลูกศรและ PageUp/PageDown"
      >
        <div className="grid w-full gap-4 sm:grid-cols-3">
          <Field label="วันที่">
            <DatePicker value={date} onValueChange={setDate} min={todayISO()} />
          </Field>
          <Field label="เวลาเริ่ม">
            <TimePicker value={start} onValueChange={setStart} />
          </Field>
          <Field label="เวลาสิ้นสุด">
            <TimePicker value={end} onValueChange={setEnd} min={start || undefined} includeCloseHour />
          </Field>
        </div>
        <p className="field-hint">
          ค่าที่จะถูกส่งเข้า FormData: date={date || "—"} startTime={start || "—"} endTime={end || "—"}
        </p>
      </Section>

      <Section title="ตัวเลือกแบบติ๊ก" note="ข้างในเป็น native input ที่ซ่อนไว้ — arrow key ของ radio ทำงานเองโดยไม่มี JS">
        <div className="flex flex-col gap-3">
          <Checkbox label="เฉพาะห้องที่ว่าง" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
          <Checkbox label="ติ๊กบางส่วน" indeterminate />
          <Checkbox label="กดไม่ได้" disabled />
          <Switch label="เตือนก่อนเริ่ม 10 นาที" defaultChecked />
        </div>

        <RadioGroup name="plan" value={plan} onValueChange={setPlan} aria-label="ประเภทการจอง">
          <Radio value="standard" label="จองครั้งเดียว" />
          <Radio value="weekly" label="จองซ้ำทุกสัปดาห์" />
          <Radio value="blocked" label="ปิดปรับปรุง (เลือกไม่ได้)" disabled />
        </RadioGroup>

        <SegmentedControl
          name="view-mode"
          options={[
            { value: "day", label: "วัน" },
            { value: "week", label: "สัปดาห์" },
            { value: "month", label: "เดือน" },
          ]}
          value={mode}
          onValueChange={setMode}
          aria-label="มุมมองปฏิทิน"
        />

        {/* แบบไอคอนล้วน — label ยังต้องมีเสมอ ใช้เป็นทั้ง tooltip และ accessible name */}
        <SegmentedControl
          name="view-density"
          defaultValue="day"
          options={[
            { value: "day", label: "รายวัน", icon: <CalendarIcon className="size-4" /> },
            { value: "hour", label: "รายชั่วโมง", icon: <ClockIcon className="size-4" /> },
            { value: "people", label: "ตามผู้เข้าร่วม", icon: <UsersIcon className="size-4" /> },
          ]}
          aria-label="ความละเอียดของมุมมอง"
        />

        <div className="flex flex-wrap gap-2">
          {["30 น.", "1 ชม.", "2 ชม."].map((label, i) => (
            <button key={label} type="button" className="chip" aria-pressed={i === 1}>
              {label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="ชั้นลอย" note="Modal, Toast และ Tooltip — ทุกตัว portal ไป body และคุมลำดับชั้นด้วย --ds-z-*">
        <Button onClick={() => setModalOpen(true)}>เปิด Modal</Button>
        <Button
          variant="secondary"
          onClick={() => toast({ message: "บันทึกเรียบร้อยแล้ว", variant: "success" })}
        >
          ยิง Toast สำเร็จ
        </Button>
        <Button
          variant="secondary"
          onClick={() => toast({ message: "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง", variant: "danger" })}
        >
          ยิง Toast ผิดพลาด
        </Button>
        <Tooltip content="ข้อมูลเสริมที่ไม่จำเป็นต่อการตัดสินใจ">
          <Button variant="ghost">ชี้หรือ Tab มาที่ปุ่มนี้</Button>
        </Tooltip>
      </Section>

      <Section title="สถานะว่างและกำลังโหลด">
        <div className="flex w-full flex-col gap-4">
          <EmptyState
            title="ไม่พบห้องที่ตรงกับเงื่อนไข"
            description="ลองลดเงื่อนไขลง เช่น เอาตัวกรองความจุออก"
            action={<Button variant="secondary">ล้างตัวกรอง</Button>}
          />
          <div className="flex items-center gap-3">
            <Spinner />
            <div className="skeleton h-4 w-48" />
            <div className="skeleton h-9 w-28" />
          </div>
        </div>
      </Section>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="รายละเอียดการจอง"
        description="กด Esc หรือคลิกฉากหลังเพื่อปิด — โฟกัสถูกขังไว้ในกล่องนี้"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={() => setModalOpen(false)}>ยืนยัน</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm">
            ลองเปิด Select ข้างล่างแล้วกด Esc หนึ่งครั้ง — ควรปิดแค่ Select ไม่ปิด Modal ตาม
          </p>
          <Field label="ห้องประชุม">
            <Select options={ROOM_OPTIONS} placeholder="เลือกห้อง" />
          </Field>
        </div>
      </Modal>
    </main>
  );
}
