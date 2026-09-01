import { eq } from "drizzle-orm";
import type { RoomRepository } from "@/core/ports/room-repository.port";
import type { Room } from "@/core/domain/entities/room";
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
}
