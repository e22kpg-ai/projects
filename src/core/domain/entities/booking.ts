export interface Booking {
  id: string;
  roomId: string;
  userId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
}

export interface NewBooking {
  roomId: string;
  userId: string;
  title: string;
  startTime: Date;
  endTime: Date;
}
