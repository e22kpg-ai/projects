export type DressCode = "long_sleeve_uniform" | "duty_uniform" | "unspecified";

export interface Booking {
  id: string;
  roomId: string;
  userId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  department: string | null;
  chairperson: string | null;
  dressCode: DressCode | null;
  createdAt: Date;
}

export interface NewBooking {
  roomId: string;
  userId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  department: string;
  chairperson: string;
  dressCode: DressCode;
}
