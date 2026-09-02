"use server";

import { randomBytes } from "node:crypto";
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

const AFFILIATION_MAX = 120;

const createUserSchema = z.object({
  name: z.string().trim().min(1, "กรุณาระบุชื่อ").max(200, "ชื่อยาวเกินไป"),
  email: z.string().trim().toLowerCase().email("รูปแบบอีเมลไม่ถูกต้อง"),
  affiliation: z
    .string()
    .trim()
    .min(1, "กรุณาระบุสังกัด")
    .max(AFFILIATION_MAX, `สังกัดต้องยาวไม่เกิน ${AFFILIATION_MAX} ตัวอักษร`),
  role: z.enum(["user", "admin"]),
});

export interface CreateUserFormState {
  error?: string;
  /** ค่าที่กรอกมา ส่งกลับไปให้ฟอร์มเรนเดอร์ต่อเมื่อ submit ไม่ผ่าน */
  values?: { name: string; email: string; affiliation: string; role: string };
  /** โชว์ครั้งเดียวหลังสร้างสำเร็จ — ไม่มีที่ไหนเก็บไว้ให้ดูซ้ำ */
  created?: { email: string; password: string };
}

/*
 * รหัสผ่านชั่วคราว: ให้ระบบสุ่ม ไม่ให้ admin คิดเอง
 *
 * ★ admin ที่ต้องตั้งรหัสให้คนอื่นสิบคนจะตั้งซ้ำกันหมด หรือใช้แพตเทิร์นที่เดาได้
 *   (ชื่อ+ปี, 12345678) ซึ่งแย่กว่าการสุ่มทุกกรณี
 *
 * ★ ใช้ randomBytes ไม่ใช่ Math.random ซึ่งเดาลำดับถัดไปได้ถ้ารู้ค่าก่อนหน้า
 *   base64url ตัดอักขระที่กำกวมตอนอ่านออกเสียง (+/=) ไปในตัว
 */
function generateTemporaryPassword(): string {
  return randomBytes(12).toString("base64url");
}

/*
 * admin สร้างบัญชีให้คนที่ไม่มีอีเมลของหน่วยงาน
 *
 * รหัสผ่านถูกส่งกลับมาแสดงครั้งเดียวเพื่อให้ admin ส่งต่อให้เจ้าตัวเอง
 * ระบบยังไม่มีการส่งอีเมล จึงไม่มีทางอื่นให้รหัสถึงมือเจ้าของบัญชี
 */
export async function createUserAction(
  _prevState: CreateUserFormState,
  formData: FormData,
): Promise<CreateUserFormState> {
  const user = await container.authService.getCurrentUser();
  if (!user) redirect("/login");

  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    affiliation: String(formData.get("affiliation") ?? ""),
    role: String(formData.get("role") ?? "user"),
  };

  const parsed = createUserSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง", values: raw };
  }

  const password = generateTemporaryPassword();

  try {
    await container.createUser({
      actingUser: user,
      name: parsed.data.name,
      email: parsed.data.email,
      affiliation: parsed.data.affiliation,
      role: parsed.data.role,
      password,
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message, values: raw };
    console.error("createUserAction failed", err);
    return { error: "ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง", values: raw };
  }

  revalidatePath("/admin/users");
  return { created: { email: parsed.data.email, password } };
}
