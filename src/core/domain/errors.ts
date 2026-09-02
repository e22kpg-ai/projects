export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

export class BookingConflictError extends DomainError {
  constructor(message = "ห้องนี้ถูกจองในช่วงเวลานี้แล้ว") {
    super(message);
    this.name = "BookingConflictError";
  }
}

export class InvalidBookingRangeError extends DomainError {
  constructor(message = "เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น") {
    super(message);
    this.name = "InvalidBookingRangeError";
  }
}

export class BookingInPastError extends DomainError {
  constructor(message = "จองย้อนหลังไม่ได้") {
    super(message);
    this.name = "BookingInPastError";
  }
}

export class BookingOutsideBusinessHoursError extends DomainError {
  constructor(message = "จองได้เฉพาะในเวลาทำการ 08:00–18:00 ของวันเดียวกัน") {
    super(message);
    this.name = "BookingOutsideBusinessHoursError";
  }
}

export class RoomNotFoundError extends DomainError {
  constructor(roomId: string) {
    super(`ไม่พบห้องประชุม (${roomId})`);
    this.name = "RoomNotFoundError";
  }
}

export class UnauthenticatedError extends DomainError {
  constructor(message = "ต้องเข้าสู่ระบบก่อน") {
    super(message);
    this.name = "UnauthenticatedError";
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "คุณไม่มีสิทธิ์ทำรายการนี้") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class InvalidRoomError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidRoomError";
  }
}

export class UserNotFoundError extends DomainError {
  constructor(userId: string) {
    super(`ไม่พบผู้ใช้ (${userId})`);
    this.name = "UserNotFoundError";
  }
}

/*
 * ไม่ใส่ bookingId ลงในข้อความ ต่างจาก RoomNotFoundError โดยตั้งใจ
 * เพราะข้อความนี้ไปโผล่หน้าผู้ใช้จริงตอนกดยกเลิก และ id ไม่ได้ช่วยให้เขาทำอะไรต่อได้
 */
export class BookingNotFoundError extends DomainError {
  constructor(message = "ไม่พบการจองนี้ อาจถูกยกเลิกไปแล้ว") {
    super(message);
    this.name = "BookingNotFoundError";
  }
}

export class BookingAlreadyEndedError extends DomainError {
  constructor(message = "การประชุมนี้จบไปแล้ว ยกเลิกย้อนหลังไม่ได้") {
    super(message);
    this.name = "BookingAlreadyEndedError";
  }
}
