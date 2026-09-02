"use client";

import { useActionState, useState } from "react";
import {
  createUserAction,
  type CreateUserFormState,
} from "@/adapters/driving/actions/user-admin.actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { TextInput } from "@/components/ui/TextInput";

const initialState: CreateUserFormState = {};

const ROLE_OPTIONS = [
  { value: "user", label: "ผู้ใช้ทั่วไป" },
  { value: "admin", label: "ผู้ดูแลระบบ" },
];

/*
 * ช่องทางรับคนที่ไม่มีอีเมล @rtarf.mi.th เข้าระบบ
 *
 * ★ ทำไมไม่เปิด gmail.com ใน allowlist แทน:
 *   gmail สมัครฟรีได้ทั้งโลก เปิดแล้วด่านโดเมนจะไม่กรองใครออกเลย
 *   ทางนี้กลับกัน — ไม่มีใครสมัครเองได้ แต่ admin หยิบใครเข้ามาก็ได้เป็นรายคน
 *   และมีคนรับผิดชอบชัดเจนว่าใครเป็นคนพาเข้ามา
 */
export function CreateUserModal() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createUserAction, initialState);

  const values = state.values;
  const created = state.created;

  function close() {
    setOpen(false);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="self-start">
        เพิ่มบัญชีผู้ใช้
      </Button>

      <Modal
        open={open}
        onClose={close}
        title={created ? "สร้างบัญชีเรียบร้อย" : "เพิ่มบัญชีผู้ใช้"}
        size="sm"
        description={
          created
            ? "ส่งรหัสผ่านนี้ให้เจ้าของบัญชี"
            : "สำหรับคนที่ไม่มีอีเมลของหน่วยงาน — บัญชีที่สร้างทางนี้ใช้งานได้ทันที ไม่ต้องรออนุมัติ"
        }
      >
        {created ? (
          <div className="flex flex-col gap-4">
            {/*
              ★ รหัสผ่านโชว์ครั้งเดียวจริงๆ — ระบบเก็บแค่ค่าที่ hash แล้ว
                ถ้าปิดหน้าต่างนี้ไปโดยยังไม่ได้คัดลอก ต้องไปตั้งรหัสใหม่ให้เท่านั้น
                จึงต้องเตือนให้ชัด ไม่ใช่ปล่อยให้รู้ตอนสายไปแล้ว
            */}
            <Alert>
              รหัสผ่านนี้แสดงเพียงครั้งเดียว คัดลอกเก็บไว้ก่อนปิดหน้าต่าง
            </Alert>

            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">อีเมล</dt>
                <dd className="text-right break-all">{created.email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">รหัสผ่านชั่วคราว</dt>
                <dd className="text-right font-mono break-all">{created.password}</dd>
              </div>
            </dl>

            <p className="text-xs text-muted">
              แนะนำให้เจ้าของบัญชีเปลี่ยนรหัสผ่านหลังเข้าใช้งานครั้งแรก
            </p>

            <div className="flex justify-end">
              <Button type="button" onClick={close}>
                เสร็จสิ้น
              </Button>
            </div>
          </div>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <Field label="ชื่อ" required>
              <TextInput type="text" name="name" defaultValue={values?.name} required />
            </Field>

            {/*
              ไม่ต้องบอกว่าต้องเป็น @rtarf.mi.th ตรงนี้ เพราะทางนี้คือข้อยกเว้นของกฎนั้นพอดี
              ถ้าเขียนไว้จะขัดกันเองกับข้อความในหน้าสมัคร
            */}
            <Field label="อีเมล" hint="ใช้อีเมลใดก็ได้ รวมถึงอีเมลนอกหน่วยงาน" required>
              <TextInput type="email" name="email" defaultValue={values?.email} required />
            </Field>

            <Field label="สังกัด" hint="เช่น กรมยุทธการทหาร" required>
              <TextInput
                type="text"
                name="affiliation"
                defaultValue={values?.affiliation}
                maxLength={120}
                required
              />
            </Field>

            <Field label="สิทธิ์">
              <SegmentedControl
                name="role"
                options={ROLE_OPTIONS}
                defaultValue={values?.role ?? "user"}
                aria-label="สิทธิ์ของบัญชีใหม่"
              />
            </Field>

            {state.error && <Alert>{state.error}</Alert>}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" disabled={pending} onClick={close}>
                ยกเลิก
              </Button>
              <Button type="submit" loading={pending}>
                สร้างบัญชี
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
