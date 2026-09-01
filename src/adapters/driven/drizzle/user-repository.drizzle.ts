import { eq } from "drizzle-orm";
import type { Role } from "@/core/ports/auth-service.port";
import type { AppUser, UserRepository } from "@/core/ports/user-repository.port";
import { db } from "./client";
import { user } from "./schema/auth-schema";

const columns = { id: user.id, name: user.name, email: user.email, role: user.role };

function toAppUser(row: { id: string; name: string; email: string; role: string }): AppUser {
  return { ...row, role: row.role === "admin" ? "admin" : "user" };
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

  async updateRole(id: string, role: Role): Promise<AppUser | undefined> {
    const [row] = await db
      .update(user)
      .set({ role })
      .where(eq(user.id, id))
      .returning(columns);
    return row ? toAppUser(row) : undefined;
  }
}
