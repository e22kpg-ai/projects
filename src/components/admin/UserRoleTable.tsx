"use client";

import { useActionState, useRef } from "react";
import {
  setUserRoleAction,
  type SetUserRoleFormState,
} from "@/adapters/driving/actions/user-admin.actions";
import type { AppUser } from "@/core/ports/user-repository.port";
import { Alert } from "@/components/ui/Alert";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

const initialState: SetUserRoleFormState = {};

const ROLE_OPTIONS = [
  { value: "user", label: "ผู้ใช้ทั่วไป" },
  { value: "admin", label: "ผู้ดูแลระบบ" },
];

function UserRoleRow({ user, isSelf }: { user: AppUser; isSelf: boolean }) {
  const [state, formAction] = useActionState(setUserRoleAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <li className="card-flat flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-medium truncate">{user.name}</p>
        <p className="text-muted text-sm truncate">{user.email}</p>
      </div>

      {isSelf ? (
        <div className="flex flex-col items-end gap-1">
          <span className="badge-success">
            {user.role === "admin" ? "ผู้ดูแลระบบ" : "ผู้ใช้ทั่วไป"}
          </span>
          <span className="text-muted text-xs">ไม่สามารถเปลี่ยนสิทธิ์ของตัวเองได้</span>
        </div>
      ) : (
        <form ref={formRef} action={formAction} className="flex flex-col items-end gap-1">
          <input type="hidden" name="userId" value={user.id} />
          <SegmentedControl
            name="role"
            options={ROLE_OPTIONS}
            defaultValue={user.role}
            aria-label={`สิทธิ์ของ ${user.name}`}
            onValueChange={() => formRef.current?.requestSubmit()}
          />
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
