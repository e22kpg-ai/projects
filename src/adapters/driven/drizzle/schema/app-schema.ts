import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index, check } from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";

export const rooms = sqliteTable("rooms", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  location: text("location"),
  capacity: integer("capacity").notNull(),
  description: text("description"),
  equipment: text("equipment", { mode: "json" })
    .notNull()
    .default([] as string[])
    .$type<string[]>(),
  ownerName: text("owner_name"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const bookings = sqliteTable(
  "bookings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    roomId: text("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    startTime: integer("start_time", { mode: "timestamp" }).notNull(),
    endTime: integer("end_time", { mode: "timestamp" }).notNull(),
    department: text("department"),
    chairperson: text("chairperson"),
    dressCode: text("dress_code", {
      enum: ["long_sleeve_uniform", "duty_uniform", "unspecified"],
    }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("room_time_idx").on(t.roomId, t.startTime, t.endTime),
    check("end_after_start", sql`${t.endTime} > ${t.startTime}`),
  ],
);
