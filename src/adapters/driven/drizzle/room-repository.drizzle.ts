import { eq } from "drizzle-orm";
import type { RoomRepository } from "@/core/ports/room-repository.port";
import type { NewRoom, Room, RoomUpdate } from "@/core/domain/entities/room";
import { db } from "./client";
import { rooms } from "./schema/app-schema";

export class DrizzleRoomRepository implements RoomRepository {
  async findAll(): Promise<Room[]> {
    return db.select().from(rooms);
  }

  async findById(id: string): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
    return room;
  }

  async create(input: NewRoom): Promise<Room> {
    const [room] = await db.insert(rooms).values(input).returning();
    return room;
  }

  async update(id: string, input: RoomUpdate): Promise<Room | undefined> {
    const [room] = await db.update(rooms).set(input).where(eq(rooms.id, id)).returning();
    return room;
  }

  async delete(id: string): Promise<void> {
    await db.delete(rooms).where(eq(rooms.id, id));
  }
}
