import { headers } from "next/headers";
import type { AuthService, AuthenticatedUser } from "@/core/ports/auth-service.port";
import { auth } from "./auth";

export class BetterAuthService implements AuthService {
  async getCurrentUser(): Promise<AuthenticatedUser | null> {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return null;

    const extra = session.user as { role?: string; status?: string; affiliation?: string | null };

    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: extra.role === "admin" ? "admin" : "user",
      /*
       * ★ อะไรที่ไม่ใช่ "approved" เป๊ะๆ ถือว่ายังไม่อนุมัติ
       *   ค่าที่หายไปหรืออ่านไม่ออกต้องตกไปทางที่ปลอดภัยที่สุด — ปฏิเสธไว้ก่อน
       *   ถ้าเขียนกลับด้าน (ไม่ใช่ "pending" = อนุมัติ) ข้อมูลเพี้ยนหรือ session เก่า
       *   จะกลายเป็นการเปิดสิทธิ์ให้โดยไม่มีใครรู้
       */
      status: extra.status === "approved" ? "approved" : "pending",
      affiliation: extra.affiliation ?? null,
    };
  }
}
