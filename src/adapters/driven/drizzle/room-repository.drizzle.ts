import { eq } from "drizzle-orm";
import type { RoomRepository } from "@/core/ports/room-repository.port";
import type { NewRoom, Room, RoomUpdate } from "@/core/domain/entities/room";
import { db } from "./client";
import { rooms } from "./schema/app-schema";

/*
 * equipment เป็นคอลัมน์ JSON ที่ไม่มี CHECK constraint กำกับ ถ้าแถวไหนมีค่าที่ไม่ใช่ array
 * (เช่นถูกแก้มือผ่าน db:studio หรือกู้ dump เก่ามา) โค้ดฝั่ง UI ที่เรียก .map/.join จะพัง
 * แล้วลาก /rooms, /admin/rooms, /calendar ตกไปทั้งหน้า — normalize ที่ขอบ adapter เหมือนที่
 * DrizzleUserRepository ทำกับ role
 */
function toRoom(row: typeof rooms.$inferSelect): Room {
  return { ...row, equipment: Array.isArray(row.equipment) ? row.equipment : [] };
}

export class DrizzleRoomRepository implements RoomRepository {
  async findAll(): Promise<Room[]> {
    const rows = await db.select().from(rooms);
    return rows.map(toRoom);
  }

  async findById(id: string): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
    return room ? toRoom(room) : undefined;
  }

  async create(input: NewRoom): Promise<Room> {
    const [room] = await db.insert(rooms).values(input).returning();
    return toRoom(room);
  }

  async update(id: string, input: RoomUpdate): Promise<Room | undefined> {
    const [room] = await db.update(rooms).set(input).where(eq(rooms.id, id)).returning();
    return room ? toRoom(room) : undefined;
  }

  async delete(id: string): Promise<void> {
    await db.delete(rooms).where(eq(rooms.id, id));
  }
}
