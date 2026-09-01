import type { NewRoom, Room, RoomUpdate } from "@/core/domain/entities/room";

export interface RoomRepository {
  findAll(): Promise<Room[]>;
  findById(id: string): Promise<Room | undefined>;
  create(input: NewRoom): Promise<Room>;
  update(id: string, input: RoomUpdate): Promise<Room | undefined>;
  delete(id: string): Promise<void>;
}
