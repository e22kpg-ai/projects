"use client";

import { useActionState, useState } from "react";
import {
  deleteUserAction,
  setUserRoleAction,
  setUserStatusAction,
  type DeleteUserFormState,
  type SetUserRoleFormState,
  type SetUserStatusFormState,
} from "@/adapters/driving/actions/user-admin.actions";
import type { Role } from "@/core/ports/auth-service.port";
import type { AppUser } from "@/core/ports/user-repository.port";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

const initialRoleState: SetUserRoleFormState = {};
const initialStatusState: SetUserStatusFormState = {};
const initialDeleteState: DeleteUserFormState = {};

const ROLE_OPTIONS = [
  { value: "user", label: "ผู้ใช้ทั่วไป" },
  { value: "admin", label: "ผู้ดูแลระบบ" },
];

const ROLE_LABELS: Record<Role, string> = {
  user: "ผู้ใช้ทั่วไป",
  admin: "ผู้ดูแลระบบ",
};

function UserRoleRow({ user, isSelf }: { user: AppUser; isSelf: boolean }) {
  const [state, formAction, pending] = useActionState(setUserRoleAction, initialRoleState);
  const [statusState, statusAction, statusPending] = useActionState(
    setUserStatusAction,
    initialStatusState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteUserAction,
    initialDeleteState,
  );

  /* ปฏิเสธคือการลบถาวร จึงต้องยืนยันสองจังหวะเหมือนการยกเลิกการจอง */
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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
  const approved = user.status === "approved";
  const busy = pending || statusPending || deletePending;

  /*
   * ★ admin ⇒ approved เสมอ (บังคับจริงที่ set-user-status.use-case.ts)
   *   ปุ่มเพิกถอนจึงไม่โผล่ให้ admin เพราะกดไปก็ถูกปฏิเสธ — ปุ่มที่กดแล้วขึ้น error
   *   ทุกครั้งแย่กว่าไม่มีปุ่ม ต้องบอกแทนว่าให้ลดขั้นก่อน
   */
  const canRevoke = approved && user.role !== "admin";

  return (
    <li className="card-flat flex flex-col gap-3 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-medium truncate">{user.name}</p>
          <p className="text-muted text-sm truncate">{user.email}</p>
          <p className="text-muted text-sm truncate">
            สังกัด: {user.affiliation ?? <span className="text-muted">ไม่ได้ระบุ</span>}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className={approved ? "badge-success badge-dot" : "badge-warning badge-dot"}>
            {approved ? "ใช้งานได้" : "รออนุมัติ"}
          </span>
          {isSelf && <span className="badge">บัญชีของคุณ</span>}
        </div>
      </div>

      {isSelf ? (
        /*
         * ★ ตัวเองแก้อะไรไม่ได้เลย ทั้ง role และสถานะ
         *   admin คนสุดท้ายที่เผลอเพิกถอนหรือลบตัวเอง จะล็อกทุกคนออกจากหน้านี้ถาวร
         *   ทางกลับมีทางเดียวคือไปแก้ที่ฐานข้อมูลตรงๆ
         */
        <div className="flex flex-col items-start gap-1">
          <span className="badge">{ROLE_LABELS[user.role]}</span>
          <span className="text-muted text-xs">ไม่สามารถเปลี่ยนสิทธิ์หรือสถานะของตัวเองได้</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3 border-t border-border pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <form action={formAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="userId" value={user.id} />
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
            </form>

            <div className="flex flex-wrap items-center gap-2">
              {approved && !canRevoke ? (
                <span className="text-muted text-xs">
                  ลดขั้นเป็นผู้ใช้ทั่วไปก่อน จึงจะเพิกถอนสิทธิ์ได้
                </span>
              ) : (
                <form action={statusAction}>
                  <input type="hidden" name="userId" value={user.id} />
                  <input type="hidden" name="status" value={approved ? "pending" : "approved"} />
                  <Button
                    type="submit"
                    size="sm"
                    variant={approved ? "secondary" : "primary"}
                    loading={statusPending}
                    disabled={busy}
                  >
                    {approved ? "เพิกถอนสิทธิ์" : "อนุมัติ"}
                  </Button>
                </form>
              )}

              {/*
                ปุ่มปฏิเสธโผล่เฉพาะบัญชีที่ยังรออนุมัติ
                บัญชีที่ใช้งานอยู่แล้วมีการจองผูกอยู่ ต้องเพิกถอนก่อนถึงจะลบได้
                เป็นการบังคับให้คิดสองจังหวะก่อนทำลายข้อมูลที่มีคนใช้จริง
              */}
              {!approved && !confirmingDelete && (
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  disabled={busy}
                  onClick={() => setConfirmingDelete(true)}
                >
                  ปฏิเสธ
                </Button>
              )}
            </div>
          </div>

          {confirmingDelete && (
            <form action={deleteAction} className="flex flex-col gap-2 border-t border-border pt-3">
              <input type="hidden" name="userId" value={user.id} />
              <p className="text-sm">
                ลบบัญชีของ {user.name} ({user.email}) ถาวรหรือไม่? กู้คืนไม่ได้
                และเจ้าตัวจะสมัครใหม่ได้ทันที
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={deletePending}
                  onClick={() => setConfirmingDelete(false)}
                >
                  ไม่ลบแล้ว
                </Button>
                <Button type="submit" size="sm" variant="danger" loading={deletePending}>
                  ยืนยันลบบัญชี
                </Button>
              </div>
            </form>
          )}

          {state.error && <Alert>{state.error}</Alert>}
          {statusState.error && <Alert>{statusState.error}</Alert>}
          {deleteState.error && <Alert>{deleteState.error}</Alert>}
        </div>
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
  /*
   * คนที่รออนุมัติขึ้นก่อนเสมอ แล้วค่อยเรียงตามวันสมัคร (เก่าสุดก่อน)
   *
   * ★ นี่คืองานเดียวที่ admin เปิดหน้านี้มาทำ ถ้าคนรออนุมัติไปปนอยู่กลางรายชื่อ
   *   พนักงานใหม่จะถูกลืมไว้เป็นวันๆ โดยไม่มีอะไรเตือน — เรียงให้ถูกคือฟีเจอร์ ไม่ใช่ความสวยงาม
   * ★ คัดลอกอาเรย์ก่อน sort เพราะ sort แก้ของเดิมในที่ ซึ่ง props ไม่ใช่ของเรา
   */
  const ordered = [...users].sort((a, b) => {
    if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  const pendingCount = ordered.filter((u) => u.status === "pending").length;

  return (
    <div className="flex flex-col gap-3">
      {pendingCount > 0 && (
        <p className="text-sm text-muted">
          มี <span className="text-foreground font-medium">{pendingCount}</span> บัญชีรอการอนุมัติ
        </p>
      )}
      <ul className="flex flex-col gap-3">
        {ordered.map((user) => (
          <UserRoleRow key={user.id} user={user} isSelf={user.id === currentUserId} />
        ))}
      </ul>
    </div>
  );
}
