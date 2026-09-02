// Local-dev-only account, seeded by `npm run db:seed` and reached from the UI
// only through the dev-auth server action (see dev-auth.actions.ts).
//
// ★ "server-only" ไม่ใช่การตกแต่ง: ก่อนหน้านี้ LoginForm/SignupForm import ไฟล์นี้ตรงๆ
//   ปุ่ม dev ถูกตัดออกตอน build จริงก็จริง แต่ตัวโมดูลยังติดไปใน client chunk
//   (`grep devpassword123 .next/static/chunks/` เคยเจอไฟล์สาธารณะสองไฟล์)
//   บรรทัดนี้ทำให้การ import จากฝั่ง client พัง ตอน build แทนที่จะหลุดไปเงียบๆ
import "server-only";
import { DEV_USERS } from "./dev-users-config";

// สำหรับ server component / action — ใช้ dev user แรก (non-admin)
export const DEV_USER_EMAIL = DEV_USERS[0].email;
export const DEV_USER_PASSWORD = DEV_USERS[0].password;
export const DEV_USER_NAME = DEV_USERS[0].name;

export const DEV_ADMIN_EMAIL = DEV_USERS[1].email;
export const DEV_ADMIN_PASSWORD = DEV_USERS[1].password;
export const DEV_ADMIN_NAME = DEV_USERS[1].name;
