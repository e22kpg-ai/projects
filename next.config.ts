import type { NextConfig } from "next";

/*
 * Security headers
 *
 * ★ ทำไมต้องมี ทั้งที่ระบบนี้ใช้ภายในองค์กร:
 *   หน้าจัดการสิทธิ์มีปุ่มที่กดครั้งเดียวแล้วเปลี่ยนสิทธิ์หรือลบบัญชีถาวร
 *   ถ้าเว็บอื่นฝัง /admin/users ไว้ใน iframe โปร่งใสแล้วหลอกให้ admin กดทับ
 *   (clickjacking) การ์ดฝั่ง server ทุกชั้นจะปล่อยผ่านหมด เพราะมันเป็น request
 *   ที่ถูกต้องทุกประการจาก admin ตัวจริง — ด่านนี้เป็นด่านเดียวที่กันได้
 */
const securityHeaders = [
  /*
   * frame-ancestors เป็นตัวจริงที่กัน clickjacking ส่วน X-Frame-Options เป็นของเก่า
   * ที่ยังต้องใส่ไว้เผื่อ browser ที่ไม่อ่าน CSP — ทั้งคู่สั่งเรื่องเดียวกัน
   *
   * ★ ตั้งใจใส่แค่ frame-ancestors ยังไม่ใส่ CSP เต็ม (script-src ฯลฯ)
   *   Next ฝัง inline script ของตัวเองสำหรับ RSC payload ทุกหน้า การจะคุม script-src
   *   ให้ได้จริงต้องใช้ nonce ที่สร้างใหม่ทุก request จาก middleware แล้วส่งต่อให้ Next
   *   ซึ่งต้องรื้อ proxy.ts (ตอนนี้ matcher ครอบเฉพาะหน้าที่ต้องล็อกอิน ถ้าขยายให้ครอบ
   *   ทุกหน้าโดยไม่แก้ logic เดิม /login จะ redirect หาตัวเองไม่รู้จบ)
   *   ส่วน script-src 'unsafe-inline' นั้นใส่ไปก็แทบไม่ได้อะไร จึงยังไม่ใส่ดีกว่าใส่หลอกตา
   */
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },

  /* กัน browser เดา MIME type เอง ซึ่งเป็นทางที่ไฟล์อัปโหลดกลายเป็นสคริปต์ได้ */
  { key: "X-Content-Type-Options", value: "nosniff" },

  /*
   * URL ของระบบนี้มี id ของห้องและช่วงวันที่อยู่ใน query string
   * ค่าตั้งต้นของ browser ส่ง path เต็มไปให้เว็บปลายทางตอนคลิกลิงก์ออก
   * นโยบายนี้ให้ส่งแค่ origin เมื่อออกนอกเว็บ ส่วนภายในเว็บเดียวกันยังส่งเต็มเหมือนเดิม
   */
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  /* ระบบนี้ไม่ได้ใช้อุปกรณ์พวกนี้เลย ปิดทิ้งไว้ดีกว่ารอให้มีคนเผลอเปิด */
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },

  /*
   * HSTS — browser จะสนใจ header นี้เฉพาะตอนที่ส่งมาผ่าน https เท่านั้น
   * ตอน dev บน http://localhost จึงไม่มีผลอะไร ไม่ต้องแยกเงื่อนไขตาม environment
   *
   * ★ ไม่ใส่ preload โดยตั้งใจ — การเข้า preload list ถอนออกยากมากและใช้เวลาเป็นเดือน
   *   ควรเป็นการตัดสินใจของคนดูแล domain ไม่ใช่ผลข้างเคียงของการแก้ไฟล์นี้
   */
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
