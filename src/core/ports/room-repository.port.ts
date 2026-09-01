import type { Room } from "@/core/domain/entities/room";

export interface RoomRepository {
  findAll(): Promise<Room[]>;
  findById(id: string): Promise<Room | undefined>;
}
