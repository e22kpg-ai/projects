"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { container } from "@/composition/container";
import { DomainError } from "@/core/domain/errors";

/*
 * ★ ต้องเช็ค "รูปแบบ" ไม่ใช่แค่ "ไม่ว่าง"
 *   ของเดิมเป็น z.string().min(1) เฉยๆ ยิง date=abc มาก็ผ่าน แล้วกลายเป็น Invalid Date
 *   ซึ่ง NaN เทียบอะไรก็ false หมด เลยรอดทุกด่านไปพังที่ driver เป็น 500 เต็มหน้า
 *   (กฎเรื่องเวลาทำการ/ห้ามย้อนหลัง/ความยาวสูงสุด อยู่ใน create-booking.use-case.ts)
 */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

/* กันข้อความยาวผิดปกติที่จะไปโผล่ยาวเหยียดใน tooltip ของทุกคน */
const TEXT_MAX = 200;

const bookingFormSchema = z.object({
  roomId: z.string().min(1),
  title: z.string().min(1, "กรุณาระบุหัวข้อการจอง").max(TEXT_MAX, "หัวข้อยาวเกินไป"),
  date: z.string().regex(ISO_DATE, "รูปแบบวันที่ไม่ถูกต้อง"),
  startTime: z.string().regex(HH_MM, "รูปแบบเวลาเริ่มต้นไม่ถูกต้อง"),
  endTime: z.string().regex(HH_MM, "รูปแบบเวลาสิ้นสุดไม่ถูกต้อง"),
  department: z
    .string()
    .min(1, "กรุณาระบุหน่วยงานรับผิดชอบ")
    .max(TEXT_MAX, "ชื่อหน่วยงานยาวเกินไป"),
  chairperson: z
    .string()
    .min(1, "กรุณาระบุชื่อประธานการประชุม")
    .max(TEXT_MAX, "ชื่อประธานยาวเกินไป"),
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
      /* use-case ต้องรู้ว่าใครกด เพื่อเช็คว่าบัญชีถูกอนุมัติแล้วหรือยัง ไม่ใช่แค่จะบันทึกเป็นของใคร */
      actingUser: user,
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
    /*
     * error ที่ไม่ใช่ DomainError (เช่น Turso ล่ม) ถ้า throw ต่อ error boundary จะกินทั้งหน้า
     * แล้วสิ่งที่ผู้ใช้กรอกมาหายหมด — คืนเป็นข้อความแทน แล้ว log ไว้ให้ตามดูฝั่ง server
     */
    console.error("createBookingAction failed", err);
    return { error: "ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง" };
  }

  revalidatePath("/rooms");
  revalidatePath("/calendar");
  /*
   * action นี้ redirect ทันทีที่สำเร็จ ฟอร์มจึง unmount ไปก่อน — ยิง toast จากในฟอร์มไม่ทัน
   * ส่งสัญญาณผ่าน query param แล้วให้หน้า /rooms เป็นคนแจ้งผลแทน
   */
  redirect("/rooms?booked=1");
}

const cancelSchema = z.object({ bookingId: z.string().min(1) });

export interface CancelBookingState {
  error?: string;
  /* ใช้บอก Modal ว่าถึงเวลาปิดตัวเองแล้ว — สถานะเริ่มต้นกับ "ทำสำเร็จ" ต้องแยกออกจากกันได้ */
  success?: boolean;
}

/*
 * ยกเลิกการจอง — ตัวการ์ดจริงอยู่ใน cancel-booking.use-case.ts ที่นี่ทำแค่สามอย่าง
 * รู้ว่าใครเรียก แปลง FormData และแปลง DomainError เป็นข้อความให้ฟอร์ม
 *
 * ไม่ redirect เหมือน createBookingAction เพราะผู้ใช้ยังอยู่หน้าปฏิทินหน้าเดิม
 * revalidatePath ทำให้บล็อกที่เพิ่งยกเลิกหายไปจากตารางเอง
 */
export async function cancelBookingAction(
  _prevState: CancelBookingState,
  formData: FormData,
): Promise<CancelBookingState> {
  const user = await container.authService.getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const parsed = cancelSchema.safeParse({ bookingId: formData.get("bookingId") });
  if (!parsed.success) {
    return { error: "ข้อมูลไม่ถูกต้อง" };
  }

  try {
    await container.cancelBooking({ bookingId: parsed.data.bookingId, actingUser: user });
  } catch (err) {
    if (err instanceof DomainError) {
      return { error: err.message };
    }
    console.error("cancelBookingAction failed", err);
    return { error: "ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง" };
  }

  revalidatePath("/rooms");
  revalidatePath("/calendar");
  return { success: true };
}
