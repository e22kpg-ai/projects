"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { container } from "@/composition/container";
import { DomainError } from "@/core/domain/errors";

const roomFormSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อห้อง"),
  location: z.string().optional(),
  capacity: z.coerce.number().int("ความจุต้องเป็นจำนวนเต็ม"),
  description: z.string().optional(),
  equipment: z.string().optional(),
  ownerName: z.string().optional(),
});

function emptyToNull(value: string | undefined): string | null {
  return value && value.trim() !== "" ? value.trim() : null;
}

function parseEquipment(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export interface RoomFormState {
  error?: string;
  success?: boolean;
}

export async function createRoomAction(
  _prevState: RoomFormState,
  formData: FormData,
): Promise<RoomFormState> {
  const user = await container.authService.getCurrentUser();
  if (!user) redirect("/login");

  const parsed = roomFormSchema.safeParse({
    name: formData.get("name"),
    location: formData.get("location"),
    capacity: formData.get("capacity"),
    description: formData.get("description"),
    equipment: formData.get("equipment"),
    ownerName: formData.get("ownerName"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  try {
    await container.createRoom({
      actingUser: user,
      name: parsed.data.name,
      location: emptyToNull(parsed.data.location),
      capacity: parsed.data.capacity,
      description: emptyToNull(parsed.data.description),
      equipment: parseEquipment(parsed.data.equipment),
      ownerName: emptyToNull(parsed.data.ownerName),
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }

  revalidatePath("/admin/rooms");
  revalidatePath("/rooms");
  return { success: true };
}

export async function updateRoomAction(
  _prevState: RoomFormState,
  formData: FormData,
): Promise<RoomFormState> {
  const user = await container.authService.getCurrentUser();
  if (!user) redirect("/login");

  const roomId = formData.get("roomId");
  if (typeof roomId !== "string" || !roomId) {
    return { error: "ข้อมูลไม่ถูกต้อง" };
  }

  const parsed = roomFormSchema.safeParse({
    name: formData.get("name"),
    location: formData.get("location"),
    capacity: formData.get("capacity"),
    description: formData.get("description"),
    equipment: formData.get("equipment"),
    ownerName: formData.get("ownerName"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  try {
    await container.updateRoom({
      roomId,
      actingUser: user,
      changes: {
        name: parsed.data.name,
        location: emptyToNull(parsed.data.location),
        capacity: parsed.data.capacity,
        description: emptyToNull(parsed.data.description),
        equipment: parseEquipment(parsed.data.equipment),
        ownerName: emptyToNull(parsed.data.ownerName),
      },
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }

  revalidatePath("/admin/rooms");
  revalidatePath("/rooms");
  return { success: true };
}

export async function deleteRoomAction(
  _prevState: RoomFormState,
  formData: FormData,
): Promise<RoomFormState> {
  const user = await container.authService.getCurrentUser();
  if (!user) redirect("/login");

  const roomId = formData.get("roomId");
  if (typeof roomId !== "string" || !roomId) {
    return { error: "ข้อมูลไม่ถูกต้อง" };
  }

  try {
    await container.deleteRoom({ roomId, actingUser: user });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }

  revalidatePath("/admin/rooms");
  revalidatePath("/rooms");
  revalidatePath("/calendar");
  return { success: true };
}
