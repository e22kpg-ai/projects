import { container } from "@/composition/container";

export async function getRoomsWithStatus() {
  return container.listRoomsWithStatus();
}

export async function getRoomById(id: string) {
  return container.getRoomById(id);
}

/**
 * การจองของห้องเดียวในช่วงหลายวันข้างหน้า
 *
 * ใช้กับหน้าจองเพื่อโชว์ช่วงที่ไม่ว่างให้เห็นก่อนกดยืนยัน
 * ดึงทีเดียวหลายวันแล้วให้ฝั่ง client กรองตามวันที่เลือกเอง จะได้ไม่ต้องวิ่งกลับ server ทุกครั้งที่เปลี่ยนวัน
 * (ข้อมูลของห้องเดียวไม่กี่วันมีปริมาณน้อยมาก จึงคุ้มกว่าการ round-trip)
 */
export async function getRoomBookings(roomId: string, fromDate: Date, days: number) {
  const start = new Date(fromDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + days);

  return container.listBookingsInRange({ start, end, roomId });
}
