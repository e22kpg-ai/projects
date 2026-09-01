export interface Room {
  id: string;
  name: string;
  location: string | null;
  capacity: number;
  description: string | null;
  equipment: string[];
  ownerName: string | null;
  createdAt: Date;
}

export interface RoomWithStatus extends Room {
  isBusyNow: boolean;
}

export interface NewRoom {
  name: string;
  location: string | null;
  capacity: number;
  description: string | null;
  equipment: string[];
  ownerName: string | null;
}

export type RoomUpdate = Partial<NewRoom>;
