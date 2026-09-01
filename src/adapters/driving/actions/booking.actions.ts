"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { container } from "@/composition/container";
import { DomainError } from "@/core/domain/errors";

const bookingFormSchema = z.object({
  roomId: z.string().min(1),
  title: z.string().min(1, "กรุณาระบุหัวข้อการจอง"),
  date: z.string().min(1, "กรุณาเลือกวันที่"),
  startTime: z.string().min(1, "กรุณาเลือกเวลาเริ่มต้น"),
  endTime: z.string().min(1, "กรุณาเลือกเวลาสิ้นสุด"),
  department: z.string().min(1, "กรุณาระบุหน่วยงานรับผิดชอบ"),
  chairperson: z.string().min(1, "กรุณาระบุชื่อประธานการประชุม"),
  dressCode: z.enum(["long_sleeve_uniform", "duty_uniform", "unspecified"]),
});

function combineDateAndTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

export interface BookingFormState {
  error?: string;
}

export async function createBookingAction(
  _prevState: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const user = await container.authService.getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const parsed = bookingFormSchema.safeParse({
    roomId: formData.get("roomId"),
    title: formData.get("title"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    department: formData.get("department"),
    chairperson: formData.get("chairperson"),
    dressCode: formData.get("dressCode"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const { roomId, title, date, startTime, endTime, department, chairperson, dressCode } =
    parsed.data;

  try {
    await container.createBooking({
      roomId,
      userId: user.id,
      title,
      startTime: combineDateAndTime(date, startTime),
      endTime: combineDateAndTime(date, endTime),
      department,
      chairperson,
      dressCode,
    });
  } catch (err) {
    if (err instanceof DomainError) {
      return { error: err.message };
    }
    throw err;
  }

  revalidatePath("/rooms");
  revalidatePath("/calendar");
  /*
   * action นี้ redirect ทันทีที่สำเร็จ ฟอร์มจึง unmount ไปก่อน — ยิง toast จากในฟอร์มไม่ทัน
   * ส่งสัญญาณผ่าน query param แล้วให้หน้า /rooms เป็นคนแจ้งผลแทน
   */
  redirect("/rooms?booked=1");
}
