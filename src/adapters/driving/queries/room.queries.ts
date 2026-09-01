import { container } from "@/composition/container";

export async function getRoomsWithStatus() {
  return container.listRoomsWithStatus();
}

export async function getRoomById(id: string) {
  return container.getRoomById(id);
}
