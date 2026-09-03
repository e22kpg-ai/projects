import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/*
 * เส้นทางที่เป็นเครื่องมือของทีมพัฒนาล้วนๆ ต้องไม่มีอยู่จริงบน production
 *
 * ★ ทำไมต้องกันที่นี่ ไม่ใช่ notFound() ในหน้านั้นเอง
 *
 *   หน้า /styleguide เรียก notFound() อยู่แล้วเมื่อ NODE_ENV เป็น production
 *   และเนื้อหาก็ไม่เคยรั่วออกไปจริง แต่สถานะที่ตอบกลับคือ 200 ไม่ใช่ 404
 *
 *   สาเหตุคือ src/app/loading.tsx ที่ root ทำให้ทุกหน้าเรนเดอร์แบบ streaming
 *   Next ส่ง header ออกไปพร้อมโครงหน้าก่อน แล้วค่อยเรนเดอร์เนื้อในตามลงไปในสตรีมเดียวกัน
 *   พอ notFound() ทำงาน สถานะ 200 ถูกส่งออกไปแล้ว จะย้อนกลับไปแก้เป็น 404 ไม่ได้อีก
 *   (ลอง force-dynamic แล้วก็ยังเป็น 200 เพราะปัญหาอยู่ที่ "ส่ง header ไปก่อน" ไม่ใช่ "เรนเดอร์ตอนไหน")
 *
 *   ผลเสียคือหน้านี้ไม่ได้ meta noindex ที่หน้า not-found จริงมีติดมาด้วย search engine
 *   จึงเก็บ index ได้ว่าเป็นหน้าปกติของระบบที่เขียนว่า "ไม่พบหน้าที่ต้องการ" และเครื่องมือ
 *   ที่ไล่เช็ค dead link จะไม่มีทางรู้ว่าหน้านี้ไม่มีอยู่จริง
 *
 *   proxy ทำงานก่อนการเรนเดอร์จะเริ่ม จึงเป็นที่เดียวที่ยังกำหนดสถานะได้ทัน
 *   ปลายทางของ rewrite ตั้งใจให้เป็นเส้นทางที่ไม่มีอยู่จริง Next จะจัดการต่อให้เอง
 *   เป็น 404 พร้อมหน้า not-found ของระบบและ noindex ครบ เหมือนพิมพ์ URL มั่วๆ ทุกประการ
 *
 * หมายเหตุ: notFound() ในหน้านั้นยังต้องอยู่ ห้ามลบ เพราะเป็นด่านที่ทำให้ StyleguideContent
 * ถูก tree-shake ออกจาก bundle production ตั้งแต่ตอน build — ด่านนี้กันแค่ "เข้าถึงไม่ได้"
 * ส่วนด่านนั้นกัน "ไม่ถูกส่งขึ้นไปตั้งแต่แรก" คนละหน้าที่กัน
 */
const DEV_ONLY_PATHS = ["/styleguide"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (DEV_ONLY_PATHS.includes(pathname)) {
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.next();
    }
    return NextResponse.rewrite(new URL("/dev-only-path-not-available", request.url));
  }

  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/rooms/:path*", "/calendar/:path*", "/admin/:path*", "/pending", "/styleguide"],
};
