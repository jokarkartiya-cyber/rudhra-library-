import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, ne, or, sql } from "drizzle-orm";
import { db, studentsTable } from "@workspace/db";
import {
  CreateStudentBody,
  GetStudentParams,
  GetStudentResponse,
  UpdateStudentBody,
  UpdateStudentParams,
  UpdateStudentResponse,
  DeleteStudentParams,
  ListStudentsQueryParams,
  ListStudentsResponse,
  VerifyStudentCardParams,
  VerifyStudentCardResponse,
} from "@workspace/api-zod";
import { generateCardId } from "../lib/cardId";

const router: IRouter = Router();

type StudentRow = typeof studentsTable.$inferSelect;

function toDateString(d: Date | string | undefined): string | undefined {
  if (d === undefined) return undefined;
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return d.slice(0, 10);
}

function withStatus(row: StudentRow) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const validUntil = new Date(row.validUntil);
  const status = validUntil >= today ? "active" : "expired";
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
    status,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : String(row.createdAt),
  };
}

router.get("/students", async (req, res): Promise<void> => {
  const parsed = ListStudentsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { search, status } = parsed.data;

  const filters = [] as Array<ReturnType<typeof eq>>;
  if (search && search.trim().length > 0) {
    const term = `%${search.trim()}%`;
    const searchExpr = or(
      ilike(studentsTable.name, term),
      ilike(studentsTable.email, term),
      ilike(studentsTable.phone, term),
      ilike(studentsTable.cardId, term),
    );
    if (searchExpr) filters.push(searchExpr as ReturnType<typeof eq>);
  }

  let rows = await db
    .select()
    .from(studentsTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(studentsTable.createdAt));

  let withStatusRows = rows.map(withStatus);
  if (status && status !== "all") {
    withStatusRows = withStatusRows.filter((r) => r.status === status);
  }

  res.json(ListStudentsResponse.parse(withStatusRows));
});

router.post("/students", async (req, res): Promise<void> => {
  const parsed = CreateStudentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const normalizedEmail = parsed.data.email.trim().toLowerCase();
  const trimmedSeat = parsed.data.seatNumber?.trim();
  const seatNumber = trimmedSeat && trimmedSeat.length > 0 ? trimmedSeat : null;

  const [emailDup] = await db
    .select({ id: studentsTable.id })
    .from(studentsTable)
    .where(sql`lower(${studentsTable.email}) = ${normalizedEmail}`)
    .limit(1);
  if (emailDup) {
    res.status(409).json({
      error: "A student with this email already exists.",
      field: "email",
    });
    return;
  }

  if (seatNumber) {
    const [seatDup] = await db
      .select({ id: studentsTable.id })
      .from(studentsTable)
      .where(eq(studentsTable.seatNumber, seatNumber))
      .limit(1);
    if (seatDup) {
      res.status(409).json({
        error: `Seat ${seatNumber} is already assigned to another student.`,
        field: "seatNumber",
      });
      return;
    }
  }

  const year = new Date().getFullYear();
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(studentsTable);
  const cardId = generateCardId(year, Number(count) + 1);

  try {
    const [row] = await db
      .insert(studentsTable)
      .values({
        ...parsed.data,
        email: normalizedEmail,
        seatNumber,
        joinDate: toDateString(parsed.data.joinDate)!,
        validUntil: toDateString(parsed.data.validUntil)!,
        cardId,
      })
      .returning();

    res.status(201).json(GetStudentResponse.parse(withStatus(row)));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("students_email_unique")) {
      res.status(409).json({
        error: "A student with this email already exists.",
        field: "email",
      });
      return;
    }
    if (message.includes("students_seat_number_unique")) {
      res.status(409).json({
        error: `Seat ${seatNumber} is already assigned to another student.`,
        field: "seatNumber",
      });
      return;
    }
    throw err;
  }
});

router.get("/students/verify/:cardId", async (req, res): Promise<void> => {
  const params = VerifyStudentCardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.cardId, params.data.cardId));

  if (!row) {
    res.json(
      VerifyStudentCardResponse.parse({
        valid: false,
        student: null,
        message: "Card not found. Please check the Card ID.",
      }),
    );
    return;
  }

  const student = withStatus(row);
  if (student.status === "expired") {
    res.json(
      VerifyStudentCardResponse.parse({
        valid: false,
        student,
        message: "Membership expired. Please renew at the desk.",
      }),
    );
    return;
  }

  res.json(
    VerifyStudentCardResponse.parse({
      valid: true,
      student,
      message: "Welcome. Entry granted.",
    }),
  );
});

router.get("/students/:id", async (req, res): Promise<void> => {
  const params = GetStudentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Student not found" });
    return;
  }
  res.json(GetStudentResponse.parse(withStatus(row)));
});

router.put("/students/:id", async (req, res): Promise<void> => {
  const params = UpdateStudentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateStudentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const id = params.data.id;
  const normalizedEmail = parsed.data.email
    ? parsed.data.email.trim().toLowerCase()
    : undefined;

  let seatNumber: string | null | undefined = undefined;
  if (parsed.data.seatNumber !== undefined) {
    if (parsed.data.seatNumber === null) {
      seatNumber = null;
    } else {
      const trimmed = parsed.data.seatNumber.trim();
      seatNumber = trimmed.length > 0 ? trimmed : null;
    }
  }

  if (normalizedEmail) {
    const [emailDup] = await db
      .select({ id: studentsTable.id })
      .from(studentsTable)
      .where(
        and(
          sql`lower(${studentsTable.email}) = ${normalizedEmail}`,
          ne(studentsTable.id, id),
        ),
      )
      .limit(1);
    if (emailDup) {
      res.status(409).json({
        error: "A student with this email already exists.",
        field: "email",
      });
      return;
    }
  }

  if (seatNumber) {
    const [seatDup] = await db
      .select({ id: studentsTable.id })
      .from(studentsTable)
      .where(
        and(eq(studentsTable.seatNumber, seatNumber), ne(studentsTable.id, id)),
      )
      .limit(1);
    if (seatDup) {
      res.status(409).json({
        error: `Seat ${seatNumber} is already assigned to another student.`,
        field: "seatNumber",
      });
      return;
    }
  }

  const updateData = {
    ...parsed.data,
    ...(normalizedEmail !== undefined ? { email: normalizedEmail } : {}),
    ...(seatNumber !== undefined ? { seatNumber } : {}),
    joinDate: toDateString(parsed.data.joinDate),
    validUntil: toDateString(parsed.data.validUntil),
  };

  try {
    const [row] = await db
      .update(studentsTable)
      .set(updateData)
      .where(eq(studentsTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Student not found" });
      return;
    }
    res.json(UpdateStudentResponse.parse(withStatus(row)));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("students_email_unique")) {
      res.status(409).json({
        error: "A student with this email already exists.",
        field: "email",
      });
      return;
    }
    if (message.includes("students_seat_number_unique")) {
      res.status(409).json({
        error: `Seat ${seatNumber} is already assigned to another student.`,
        field: "seatNumber",
      });
      return;
    }
    throw err;
  }
});

router.delete("/students/:id", async (req, res): Promise<void> => {
  const params = DeleteStudentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .delete(studentsTable)
    .where(eq(studentsTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Student not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
