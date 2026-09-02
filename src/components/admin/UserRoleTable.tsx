"use client";

import { useActionState, useState } from "react";
import {
  setUserRoleAction,
  type SetUserRoleFormState,
} from "@/adapters/driving/actions/user-admin.actions";
import type { Role } from "@/core/ports/auth-service.port";
import type { AppUser } from "@/core/ports/user-repository.port";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

const initialState: SetUserRoleFormState = {};

const ROLE_OPTIONS = [
  { value: "user", label: "ผู้ใช้ทั่วไป" },
  { value: "admin", label: "ผู้ดูแลระบบ" },
];

const ROLE_LABELS: Record<Role, string> = {
  user: "ผู้ใช้ทั่วไป",
  admin: "ผู้ดูแลระบบ",
};

function UserRoleRow({ user, isSelf }: { user: AppUser; isSelf: boolean }) {
  const [state, formAction, pending] = useActionState(setUserRoleAction, initialState);

  /*
   * controlled ไม่ใช่ defaultValue
   *
   * ★ ของเดิมเป็น uncontrolled แล้วยิง submit ทันทีที่ค่าเปลี่ยน มีปัญหาสองชั้น:
   *   1. ถ้า server ปฏิเสธ (ForbiddenError / UserNotFoundError) ปุ่มยังค้างที่ค่าใหม่
   *      = หน้าจัดการสิทธิ์โกหกว่าใครเป็น admin และแก้ไม่ได้จนกว่าจะ reload ทั้งหน้า
   *   2. ใน radiogroup ปุ่มลูกศรเลื่อน = เลือก คนใช้คีย์บอร์ดจึงเปลี่ยนสิทธิ์คนอื่น
   *      โดยแค่กดลูกศรผ่าน
   *   ตอนนี้เลือกแล้วต้องกด "บันทึก" อีกที และถ้าพลาดจะเด้งกลับค่าจริงเสมอ
   */
  const [selected, setSelected] = useState<string>(user.role);

  /*
   * sync กลับหาค่าจริงเสมอเมื่อ action ทำงานจบ (ไม่ว่าสำเร็จหรือพลาด) และเมื่อ props เปลี่ยน
   *
   * เทียบด้วยตัว state ทั้งก้อน ไม่ใช่ state.error — ถ้าพลาดด้วยข้อความเดิมซ้ำสองรอบ
   * ค่า string จะเท่าเดิม แล้วปุ่มจะค้างผิดอยู่อย่างนั้น
   *
   * ปรับ state ตอน render ไม่ใช่ใน useEffect ตามแนวทาง "Adjusting state when a prop changes"
   * ของ React — เขียนใน effect จะได้ render ซ้อนรอบเกินมาโดยไม่จำเป็น
   */
  const [synced, setSynced] = useState({ role: user.role, state });
  if (synced.role !== user.role || synced.state !== state) {
    setSynced({ role: user.role, state });
    setSelected(user.role);
  }

  const dirty = selected !== user.role;

  return (
    <li className="card-flat flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-medium truncate">{user.name}</p>
        <p className="text-muted text-sm truncate">{user.email}</p>
      </div>

      {isSelf ? (
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <span className="badge">{ROLE_LABELS[user.role]}</span>
          <span className="text-muted text-xs">ไม่สามารถเปลี่ยนสิทธิ์ของตัวเองได้</span>
        </div>
      ) : (
        <form action={formAction} className="flex flex-col items-start gap-2 sm:items-end">
          <input type="hidden" name="userId" value={user.id} />

          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl
              name="role"
              options={ROLE_OPTIONS}
              value={selected}
              onValueChange={setSelected}
              aria-label={`สิทธิ์ของ ${user.name}`}
            />
            {dirty && (
              <Button type="submit" size="sm" loading={pending}>
                บันทึก
              </Button>
            )}
          </div>

          {state.error && <Alert>{state.error}</Alert>}
        </form>
      )}
    </li>
  );
}

export function UserRoleTable({
  users,
  currentUserId,
}: {
  users: AppUser[];
  currentUserId: string;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {users.map((user) => (
        <UserRoleRow key={user.id} user={user} isSelf={user.id === currentUserId} />
      ))}
    </ul>
  );
}
