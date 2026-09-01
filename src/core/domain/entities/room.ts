export interface Room {
  id: string;
  name: string;
  location: string | null;
  capacity: number;
  description: string | null;
  createdAt: Date;
}

export interface RoomWithStatus extends Room {
  isBusyNow: boolean;
}
