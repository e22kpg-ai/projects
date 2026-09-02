"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { container } from "@/composition/container";
import { DomainError } from "@/core/domain/errors";
import { MAX_ROOM_CAPACITY } from "@/core/domain/room-rules";

/*
 * เพดานความยาวข้อความ ตัวเลขเดียวกับ TEXT_MAX ใน booking.actions.ts โดยตั้งใจ
 * ทั้งสองฟอร์มไปโผล่ในหน้าจอชุดเดียวกัน ถ้าตั้งคนละเพดานจะได้การ์ดห้องที่พังคนละแบบ
 *
 * description ยาวได้กว่าเพื่อนเพราะเป็นย่อหน้าบรรยาย ไม่ใช่ป้ายชื่อที่ต้องอยู่ในบรรทัดเดียว
 */
const TEXT_MAX = 200;
const DESCRIPTION_MAX = 1000;

const roomFormSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อห้อง").max(TEXT_MAX, "ชื่อห้องยาวเกินไป"),
  location: z.string().max(TEXT_MAX, "ที่ตั้งยาวเกินไป").optional(),
  capacity: z.coerce
    .number()
    .int("ความจุต้องเป็นจำนวนเต็ม")
    .min(1, "ความจุต้องมากกว่า 0")
    .max(MAX_ROOM_CAPACITY, `ความจุต้องไม่เกิน ${MAX_ROOM_CAPACITY} คน`),
  description: z.string().max(DESCRIPTION_MAX, "คำอธิบายยาวเกินไป").optional(),
  equipment: z.string().max(DESCRIPTION_MAX, "รายการอุปกรณ์ยาวเกินไป").optional(),
  ownerName: z.string().max(TEXT_MAX, "ชื่อผู้ดูแลยาวเกินไป").optional(),
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

/** ค่าดิบที่ผู้ใช้กรอกมา ส่งกลับไปให้ฟอร์มเรนเดอร์ต่อเมื่อ submit ไม่ผ่าน */
export interface RoomFormValues {
  name: string;
  location: string;
  capacity: string;
  description: string;
  equipment: string;
  ownerName: string;
}

export interface RoomFormState {
  error?: string;
  success?: boolean;
  /*
   * React 19 reset ฟอร์มที่เป็น uncontrolled ให้อัตโนมัติเมื่อ action ทำงานจบ
   * ถ้าไม่ส่งค่ากลับไป ผู้ใช้ที่กรอกครบ 6 ช่องแล้วใส่ความจุผิด จะเสียของที่พิมพ์ทั้งหมด
   */
  values?: RoomFormValues;
}

function readValues(formData: FormData): RoomFormValues {
  const read = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : "";
  };

  return {
    name: read("name"),
    location: read("location"),
    capacity: read("capacity"),
    description: read("description"),
    equipment: read("equipment"),
    ownerName: read("ownerName"),
  };
}

export async function createRoomAction(
  _prevState: RoomFormState,
  formData: FormData,
): Promise<RoomFormState> {
  const user = await container.authService.getCurrentUser();
  if (!user) redirect("/login");

  const values = readValues(formData);
  const parsed = roomFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง", values };
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
    if (err instanceof DomainError) return { error: err.message, values };
    throw err;
  }

  revalidatePath("/admin/rooms");
  revalidatePath("/rooms");
  revalidatePath("/calendar");
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

  const values = readValues(formData);
  const parsed = roomFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง", values };
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
    if (err instanceof DomainError) return { error: err.message, values };
    throw err;
  }

  revalidatePath("/admin/rooms");
  revalidatePath("/rooms");
  /* ชื่อห้องที่เปลี่ยนไปโผล่เป็นหัวคอลัมน์ในปฏิทินด้วย */
  revalidatePath("/calendar");
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
