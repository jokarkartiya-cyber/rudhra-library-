import { Router, type IRouter, type Request, type Response } from "express";
import express from "express";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { RequestUploadUrlBody, RequestUploadUrlResponse } from "@workspace/api-zod";
import { saveObject } from "../lib/localFileStorage";
import { requireAdmin } from "../middleware/auth";

const router: IRouter = Router();
const OBJECTS_DIR = path.resolve(__dirname, "..", "..", "..", "data", "objects");
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "application/pdf",
]);
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function sanitizePath(p: string): string {
  const resolved = path.resolve(OBJECTS_DIR, p);
  if (!resolved.startsWith(OBJECTS_DIR)) {
    throw new Error("Invalid path");
  }
  return resolved;
}

router.post("/storage/uploads/request-url", requireAdmin, async (req: Request, res: Response) => {
  const parsed = RequestUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing or invalid required fields" });
    return;
  }

  try {
    const { name, size, contentType } = parsed.data;

    if (!ALLOWED_MIME_TYPES.has(contentType)) {
      res.status(400).json({ error: `File type ${contentType} is not allowed` });
      return;
    }
    if (size > MAX_FILE_SIZE) {
      res.status(400).json({ error: "File exceeds maximum allowed size" });
      return;
    }
    const objectId = randomUUID();
    const ext = path.extname(name);
    const publicOrigin = req.headers["origin"];
    let uploadURL: string;
    if (publicOrigin) {
      uploadURL = `${publicOrigin}/api/storage/uploads/object/${objectId}${ext}`;
    } else {
      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.headers["x-forwarded-host"] || req.get("host");
      uploadURL = `${protocol}://${host}/api/storage/uploads/object/${objectId}${ext}`;
    }
    const objectPath = `/objects/${objectId}${ext}`;

    res.json(
      RequestUploadUrlResponse.parse({
        uploadURL,
        objectPath,
        metadata: { name, size, contentType },
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Error generating upload URL");
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

router.put(
  "/storage/uploads/object/:fileId",
  requireAdmin,
  express.raw({ type: "*/*", limit: "50mb" }),
  async (req: Request, res: Response) => {
    try {
      const fileId = String(req.params.fileId);
      const ext = path.extname(fileId);
      const objectId = path.basename(fileId, ext);
      const data = req.body as Buffer;

      if (!data || data.length === 0) {
        res.status(400).json({ error: "No data received" });
        return;
      }

      saveObject(data, objectId, ext);
      res.status(200).json({ success: true, objectPath: `/objects/${fileId}` });
    } catch (error) {
      req.log.error({ err: error }, "Error saving uploaded object");
      res.status(500).json({ error: "Failed to save uploaded file" });
    }
  },
);

router.get("/storage/public-objects/*filePath", async (req: Request, res: Response) => {
  try {
    const raw = req.params.filePath;
    const filePath = sanitizePath(Array.isArray(raw) ? raw.join("/") : raw);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    res.sendFile(filePath);
  } catch (error) {
    req.log.error({ err: error }, "Error serving public object");
    res.status(500).json({ error: "Failed to serve public object" });
  }
});

router.get("/storage/objects/*path", async (req: Request, res: Response) => {
  try {
    const raw = req.params.path;
    const resolvedPath = sanitizePath(Array.isArray(raw) ? raw.join("/") : raw);

    if (!fs.existsSync(resolvedPath)) {
      res.status(404).json({ error: "Object not found" });
      return;
    }

    res.sendFile(resolvedPath);
  } catch (error) {
    req.log.error({ err: error }, "Error serving object");
    res.status(500).json({ error: "Failed to serve object" });
  }
});

export default router;
