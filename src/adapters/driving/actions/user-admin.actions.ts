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
