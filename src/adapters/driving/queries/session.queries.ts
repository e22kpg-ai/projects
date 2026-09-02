import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { container } from "@/composition/container";
import type { AuthenticatedUser } from "@/core/ports/auth-service.port";

/*
 * จุดเดียวที่หน้าเว็บใช้ถามว่า "ตอนนี้ใครเรียกเข้ามา"
 *
 * ★ ทำไมต้องเช็คซ้ำทั้งที่มี proxy.ts อยู่แล้ว:
 *   getSessionCookie() ใน proxy ดูแค่ว่า "มี cookie ชื่อนี้อยู่ไหม" — ไม่ verify signature
 *   ไม่เช็ค DB ไม่เช็ควันหมดอายุ ใครยิง cookie มั่วๆ มาก็ผ่านด่านนั้นได้ทันที
 *   proxy จึงเป็นแค่ทางลัดให้คนที่ไม่ได้ล็อกอินเด้งไป /login เร็วๆ เท่านั้น
 *   ไม่ใช่ขอบเขตความปลอดภัยจริง — ของจริงอยู่ที่นี่ (และที่ use-case อีกชั้น)
 *
 * ★ ห่อด้วย cache() เพราะหน้าหนึ่งเรียกซ้ำหลายที่ (ตัวหน้าเอง + NavBar)
 *   ถ้าไม่ห่อจะยิง getSession() ไป DB สองรอบต่อหนึ่ง request
 */
export const getSessionUser = cache(
  async (): Promise<AuthenticatedUser | null> => container.authService.getCurrentUser(),
);

/**
 * ใช้กับหน้าที่ต้องล็อกอินก่อน — ไม่มี session แล้วเด้งไป /login
 *
 * ★ ไม่ได้เช็คสถานะอนุมัติ ใช้กับหน้าที่คนรออนุมัติก็เข้าได้ (เช่น /pending เอง)
 *   หน้าที่แตะข้อมูลจริงต้องใช้ requireApprovedUser
 */
export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * ใช้กับทุกหน้าที่แสดงหรือแก้ข้อมูลจริง — ยังไม่ถูกอนุมัติแล้วเด้งไป /pending
 *
 * ★ นี่เป็นแค่ความสะดวกของหน้าเว็บ ไม่ใช่ด่านความปลอดภัย
 *   ด่านจริงอยู่ใน use-case (createBooking/cancelBooking โยน AccountPendingError)
 *   เพราะ Server Action ถูกยิงตรงได้โดยไม่ผ่านการเรนเดอร์หน้าเลย
 */
export async function requireApprovedUser(): Promise<AuthenticatedUser> {
  const user = await requireUser();
  if (user.status !== "approved") {
    redirect("/pending");
  }
  return user;
}

/**
 * ใช้กับหน้า /admin/* — คนที่ไม่ใช่ admin เจอ 404 ไม่ใช่ 403
 * เพื่อไม่ให้รู้ด้วยซ้ำว่ามีหน้านี้อยู่
 */
export async function requireAdmin(): Promise<AuthenticatedUser> {
  const user = await requireApprovedUser();
  if (user.role !== "admin") {
    notFound();
  }
  return user;
}
