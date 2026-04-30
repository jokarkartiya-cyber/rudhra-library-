import { pgTable, text, serial, integer, date, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studentsTable = pgTable(
  "students",
  {
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
  },
  (table) => ({
    emailUnique: uniqueIndex("students_email_unique").on(sql`lower(${table.email})`),
    seatNumberUnique: uniqueIndex("students_seat_number_unique")
      .on(table.seatNumber)
      .where(sql`${table.seatNumber} IS NOT NULL`),
  }),
);

export const insertStudentSchema = createInsertSchema(studentsTable).omit({
  id: true,
  createdAt: true,
  cardId: true,
});

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;
