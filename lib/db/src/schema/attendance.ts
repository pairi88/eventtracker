import { pgTable, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { staffTable } from "./staff";
import { eventsTable } from "./events";

export const attendanceTable = pgTable("attendance", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").notNull().references(() => staffTable.id),
  eventId: integer("event_id").notNull().references(() => eventsTable.id),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique("attendance_staff_event_unique").on(table.staffId, table.eventId),
]);

export const insertAttendanceSchema = createInsertSchema(attendanceTable).omit({ id: true, checkedInAt: true });
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendanceTable.$inferSelect;
