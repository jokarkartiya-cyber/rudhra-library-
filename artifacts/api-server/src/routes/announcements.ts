import { Router, type IRouter } from "express";
import { eq, desc, and, or, isNull, gt } from "drizzle-orm";
import { db, announcementsTable } from "@workspace/db";
import { requireAdmin } from "../middleware/auth";
import rateLimit from "express-rate-limit";

const router: IRouter = Router();

const announcementLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Too many requests" },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/announcements", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(announcementsTable)
    .orderBy(desc(announcementsTable.createdAt));
  res.json(rows);
});

router.get("/announcements/active", async (_req, res): Promise<void> => {
  const now = new Date();
  const rows = await db
    .select()
    .from(announcementsTable)
    .where(
      and(
        eq(announcementsTable.isActive, true),
        or(
          isNull(announcementsTable.expiresAt),
            gt(announcementsTable.expiresAt, now),
        ),
      ),
    )
    .orderBy(desc(announcementsTable.createdAt));
  res.json(rows);
});

router.post("/announcements", requireAdmin, announcementLimiter, async (req, res): Promise<void> => {
  const { title, message, type, expiresAt } = req.body;
  if (!title || !message || typeof title !== "string" || typeof message !== "string") {
    res.status(400).json({ error: "Title and message are required" });
    return;
  }
  const trimmedTitle = title.trim().slice(0, 200);
  const trimmedMessage = message.trim().slice(0, 5000);
  if (!trimmedTitle || !trimmedMessage) {
    res.status(400).json({ error: "Title and message cannot be empty" });
    return;
  }

  const [row] = await db
    .insert(announcementsTable)
    .values({
      title: trimmedTitle,
      message: trimmedMessage,
      type: (typeof type === "string" && ["info", "warning", "event", "notice"].includes(type)) ? type : "info",
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    })
    .returning();

  res.status(201).json(row);
});

router.put("/announcements/:id", requireAdmin, announcementLimiter, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const { title, message, type, isActive, expiresAt } = req.body;
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (title !== undefined) {
    if (typeof title !== "string") { res.status(400).json({ error: "Invalid title" }); return; }
    updateData.title = title.trim().slice(0, 200);
  }
  if (message !== undefined) {
    if (typeof message !== "string") { res.status(400).json({ error: "Invalid message" }); return; }
    updateData.message = message.trim().slice(0, 5000);
  }
  if (type !== undefined) {
    if (typeof type !== "string" || !["info", "warning", "event", "notice"].includes(type)) { res.status(400).json({ error: "Invalid type" }); return; }
    updateData.type = type;
  }
  if (isActive !== undefined) updateData.isActive = Boolean(isActive);
  if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;

  const [row] = await db
    .update(announcementsTable)
    .set(updateData)
    .where(eq(announcementsTable.id, id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Announcement not found" });
    return;
  }
  res.json(row);
});

router.delete("/announcements/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [row] = await db
    .delete(announcementsTable)
    .where(eq(announcementsTable.id, id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Announcement not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
