import { Router, type IRouter } from "express";
import { desc, sql } from "drizzle-orm";
import { db, studentsTable } from "@workspace/db";
import {
  GetStatsOverviewResponse,
  GetRecentStudentsResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../middleware/auth";

const router: IRouter = Router();

function withStatus(row: typeof studentsTable.$inferSelect) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const validUntil = new Date(row.validUntil);
  return {
    id: row.id,
    cardId: row.cardId,
    name: row.name,
    fatherName: row.fatherName,
    email: row.email,
    phone: row.phone,
    address: row.address,
    photoUrl: row.photoUrl,
    seatNumber: row.seatNumber,
    shift: row.shift,
    joinDate: row.joinDate,
    validUntil: row.validUntil,
    feesPaid: row.feesPaid,
    feesAmount: row.feesAmount,
    status: validUntil >= today ? "active" : "expired",
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : String(row.createdAt),
  };
}

router.get("/stats/overview", requireAdmin, async (_req, res): Promise<void> => {
  const all = await db.select().from(studentsTable);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let active = 0;
  let expired = 0;
  let totalRevenue = 0;
  const shiftMap = new Map<string, number>();
  for (const r of all) {
    const validUntil = new Date(r.validUntil);
    if (validUntil >= today) active++;
    else expired++;
    totalRevenue += r.feesPaid;
    shiftMap.set(r.shift, (shiftMap.get(r.shift) ?? 0) + 1);
  }
  const shiftBreakdown = Array.from(shiftMap.entries()).map(
    ([shift, count]) => ({ shift, count }),
  );

  res.json(
    GetStatsOverviewResponse.parse({
      totalStudents: all.length,
      activeStudents: active,
      expiredStudents: expired,
      totalRevenue,
      shiftBreakdown,
    }),
  );
});

router.get("/stats/recent-students", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(studentsTable)
    .orderBy(desc(studentsTable.createdAt))
    .limit(5);
  res.json(GetRecentStudentsResponse.parse(rows.map(withStatus)));
});

export default router;
