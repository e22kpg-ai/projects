import { eq } from "drizzle-orm";
import type { AppUser, UserAccessChanges, UserRepository } from "@/core/ports/user-repository.port";
import { db } from "./client";
import { user } from "./schema/auth-schema";

const columns = {
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  affiliation: user.affiliation,
  createdAt: user.createdAt,
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  affiliation: string | null;
  createdAt: Date;
};

/*
 * แปลง row เป็น AppUser
 *
 * ★ role กับ status เก็บเป็น text ในฐานข้อมูล จึงต้องแคบให้เหลือค่าที่โดเมนรู้จักตรงนี้
 *   ค่าที่อ่านไม่ออกให้ตกไปทางที่ปลอดภัยที่สุดเสมอ: ไม่ใช่ admin และยังไม่ได้รับอนุมัติ
 *   ถ้าเผลอ default ไปทาง approved ข้อมูลเพี้ยนหนึ่งแถวจะกลายเป็นการเปิดสิทธิ์ให้เงียบๆ
 */
function toAppUser(row: UserRow): AppUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role === "admin" ? "admin" : "user",
    status: row.status === "approved" ? "approved" : "pending",
    affiliation: row.affiliation,
    createdAt: row.createdAt,
  };
}

export class DrizzleUserRepository implements UserRepository {
  async findAll(): Promise<AppUser[]> {
    const rows = await db.select(columns).from(user);
    return rows.map(toAppUser);
  }

  async findById(id: string): Promise<AppUser | undefined> {
    const [row] = await db.select(columns).from(user).where(eq(user.id, id)).limit(1);
    return row ? toAppUser(row) : undefined;
  }

  async updateAccess(id: string, changes: UserAccessChanges): Promise<AppUser | undefined> {
    /*
     * ผู้เรียกส่งมาเฉพาะฟิลด์ที่ต้องการเปลี่ยน จึงต้องกรอง undefined ออกก่อน
     * ไม่งั้น drizzle จะเขียนทับด้วย undefined แล้วค่าเดิมหายไปเงียบๆ
     */
    const set: { role?: UserAccessChanges["role"]; status?: UserAccessChanges["status"] } = {};
    if (changes.role !== undefined) set.role = changes.role;
    if (changes.status !== undefined) set.status = changes.status;
    if (Object.keys(set).length === 0) return this.findById(id);

    const [row] = await db.update(user).set(set).where(eq(user.id, id)).returning(columns);
    return row ? toAppUser(row) : undefined;
  }

  async delete(id: string): Promise<void> {
    await db.delete(user).where(eq(user.id, id));
  }
}
