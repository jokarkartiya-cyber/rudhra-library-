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

const PHONE_RE = /^[0-9]{10,15}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SAFE_TEXT_RE = /^[^<>]*$/;

function validateBusinessRules(input: {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  seatNumber?: string | null;
  feesAmount?: number | null;
  feesPaid?: number | null;
  joinDate?: string | Date | null;
  validUntil?: string | Date | null;
}): { ok: true } | { ok: false; error: string; field?: string } {
  if (input.name != null && !SAFE_TEXT_RE.test(input.name)) {
    return { ok: false, error: "Name contains invalid characters.", field: "name" };
  }
  if (input.address != null && !SAFE_TEXT_RE.test(input.address)) {
    return { ok: false, error: "Address contains invalid characters.", field: "address" };
  }
  if (input.email != null && !EMAIL_RE.test(input.email.trim())) {
    return { ok: false, error: "Please enter a valid email address.", field: "email" };
  }
  if (input.phone != null && !PHONE_RE.test(input.phone.trim())) {
    return { ok: false, error: "Phone must be 10-15 digits with no spaces or symbols.", field: "phone" };
  }
  if (input.seatNumber != null && input.seatNumber.trim().length > 20) {
    return { ok: false, error: "Seat number is too long.", field: "seatNumber" };
  }
  const total = input.feesAmount;
  const paid = input.feesPaid;
  if (total != null) {
    if (!Number.isInteger(total) || total < 0 || total > 1_000_000) {
      return { ok: false, error: "Total fees must be a whole number between 0 and 10,00,000.", field: "feesAmount" };
    }
  }
  if (paid != null) {
    if (!Number.isInteger(paid) || paid < 0 || paid > 1_000_000) {
      return { ok: false, error: "Paid amount must be a whole number between 0 and 10,00,000.", field: "feesPaid" };
    }
  }
  if (total != null && paid != null && paid > total) {
    return {
      ok: false,
      error: `Paid amount (Rs. ${paid}) cannot be more than the total fees (Rs. ${total}).`,
      field: "feesPaid",
    };
  }
  if (input.joinDate != null && input.validUntil != null) {
    const j = new Date(toDateString(input.joinDate as Date | string)!);
    const v = new Date(toDateString(input.validUntil as Date | string)!);
    if (Number.isNaN(j.getTime()) || Number.isNaN(v.getTime())) {
      return { ok: false, error: "Invalid join or valid-until date.", field: "joinDate" };
    }
    if (v < j) {
      return {
        ok: false,
        error: "Valid-Until date cannot be before the Join date.",
        field: "validUntil",
      };
    }
    const tenYears = 10 * 365 * 24 * 60 * 60 * 1000;
    if (v.getTime() - j.getTime() > tenYears) {
      return {
        ok: false,
        error: "Membership length cannot exceed 10 years.",
        field: "validUntil",
      };
    }
  }
  return { ok: true };
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

function firstZodIssue(err: { issues?: Array<{ path?: Array<string | number>; message?: string }> }): {
  field?: string;
  message: string;
} {
  const issue = err.issues?.[0];
  const path = issue?.path?.length ? String(issue.path[issue.path.length - 1]) : undefined;
  return { field: path, message: issue?.message || "Invalid input." };
}

router.post("/students", async (req, res): Promise<void> => {
  const parsed = CreateStudentBody.safeParse(req.body);
  if (!parsed.success) {
    const { field, message } = firstZodIssue(parsed.error);
    res.status(400).json({ error: message, field });
    return;
  }

  const normalizedEmail = parsed.data.email.trim().toLowerCase();
  const trimmedSeat = parsed.data.seatNumber?.trim();
  const seatNumber = trimmedSeat && trimmedSeat.length > 0 ? trimmedSeat : null;

  const businessCheck = validateBusinessRules({
    name: parsed.data.name,
    email: normalizedEmail,
    phone: parsed.data.phone,
    address: parsed.data.address,
    seatNumber,
    feesAmount: parsed.data.feesAmount,
    feesPaid: parsed.data.feesPaid,
    joinDate: parsed.data.joinDate,
    validUntil: parsed.data.validUntil,
  });
  if (!businessCheck.ok) {
    res.status(400).json({ error: businessCheck.error, field: businessCheck.field });
    return;
  }

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
    const { field, message } = firstZodIssue(params.error);
    res.status(400).json({ error: message, field });
    return;
  }
  const parsed = UpdateStudentBody.safeParse(req.body);
  if (!parsed.success) {
    const { field, message } = firstZodIssue(parsed.error);
    res.status(400).json({ error: message, field });
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

  const [existing] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.id, id))
    .limit(1);
  if (!existing) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const merged = {
    name: parsed.data.name ?? existing.name,
    email: normalizedEmail ?? existing.email,
    phone: parsed.data.phone ?? existing.phone,
    address: parsed.data.address ?? existing.address,
    seatNumber: seatNumber !== undefined ? seatNumber : existing.seatNumber,
    feesAmount: parsed.data.feesAmount ?? existing.feesAmount,
    feesPaid: parsed.data.feesPaid ?? existing.feesPaid,
    joinDate: parsed.data.joinDate ?? existing.joinDate,
    validUntil: parsed.data.validUntil ?? existing.validUntil,
  };

  const businessCheck = validateBusinessRules(merged);
  if (!businessCheck.ok) {
    res.status(400).json({ error: businessCheck.error, field: businessCheck.field });
    return;
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
