"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { container } from "@/composition/container";
import { DomainError } from "@/core/domain/errors";

const setRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["user", "admin"]),
});

export interface SetUserRoleFormState {
  error?: string;
}

export async function setUserRoleAction(
  _prevState: SetUserRoleFormState,
  formData: FormData,
): Promise<SetUserRoleFormState> {
  const user = await container.authService.getCurrentUser();
  if (!user) redirect("/login");

  const parsed = setRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  try {
    await container.setUserRole({
      actingUser: user,
      targetUserId: parsed.data.userId,
      role: parsed.data.role,
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }

  revalidatePath("/admin/users");
  return {};
}

const setStatusSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["pending", "approved"]),
});

export interface SetUserStatusFormState {
  error?: string;
}

/*
 * อนุมัติ (approved) หรือเพิกถอน (pending) สิทธิ์ใช้งาน
 *
 * การ์ดจริงอยู่ใน setUserStatus use-case ที่นี่ทำแค่รู้ว่าใครเรียก แปลง FormData
 * และแปลง DomainError เป็นข้อความ — เหมือน setUserRoleAction ทุกประการ
 */
export async function setUserStatusAction(
  _prevState: SetUserStatusFormState,
  formData: FormData,
): Promise<SetUserStatusFormState> {
  const user = await container.authService.getCurrentUser();
  if (!user) redirect("/login");

  const parsed = setStatusSchema.safeParse({
    userId: formData.get("userId"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  try {
    await container.setUserStatus({
      actingUser: user,
      targetUserId: parsed.data.userId,
      status: parsed.data.status,
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }

  revalidatePath("/admin/users");
  return {};
}

const deleteUserSchema = z.object({ userId: z.string().min(1) });

export interface DeleteUserFormState {
  error?: string;
}

/*
 * ปฏิเสธคำขอ = ลบบัญชีถาวร
 *
 * ★ แยก action ออกจาก setUserStatusAction โดยตั้งใจ ไม่รวมเป็น action เดียวที่รับ
 *   "การกระทำ" มาเป็นพารามิเตอร์ — การลบกู้คืนไม่ได้ ส่วนการเพิกถอนกดกลับได้
 *   สองอย่างนี้ไม่ควรอยู่ห่างกันแค่ค่า string ตัวเดียวใน FormData
 */
export async function deleteUserAction(
  _prevState: DeleteUserFormState,
  formData: FormData,
): Promise<DeleteUserFormState> {
  const user = await container.authService.getCurrentUser();
  if (!user) redirect("/login");

  const parsed = deleteUserSchema.safeParse({ userId: formData.get("userId") });
  if (!parsed.success) {
    return { error: "ข้อมูลไม่ถูกต้อง" };
  }

  try {
    await container.deleteUser({ actingUser: user, targetUserId: parsed.data.userId });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    console.error("deleteUserAction failed", err);
    return { error: "ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง" };
  }

  revalidatePath("/admin/users");
  return {};
}
