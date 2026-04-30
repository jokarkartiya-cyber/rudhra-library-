import { pgTable, text, serial, integer, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studentsTable = pgTable("students", {
  id: serial("id").primaryKey(),
  cardId: text("card_id").notNull().unique(),
  name: text("name").notNull(),
  fatherName: text("father_name"),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  photoUrl: text("photo_url"),
  seatNumber: text("seat_number"),
  shift: text("shift").notNull(),
  joinDate: date("join_date").notNull(),
  validUntil: date("valid_until").notNull(),
  feesPaid: integer("fees_paid").notNull().default(0),
  feesAmount: integer("fees_amount").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStudentSchema = createInsertSchema(studentsTable).omit({
  id: true,
  createdAt: true,
  cardId: true,
});

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;
