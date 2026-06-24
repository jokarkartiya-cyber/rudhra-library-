import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const ROOT = path.resolve(__dirname, "..", "..", "..");
const UPLOADS_DIR = path.resolve(ROOT, "data", "uploads");
const OBJECTS_DIR = path.resolve(ROOT, "data", "objects");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function saveFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
): { fileName: string; filePath: string } {
  ensureDir(UPLOADS_DIR);

  const ext = path.extname(originalName);
  const fileName = `${randomUUID()}${ext}`;
  const filePath = path.join(UPLOADS_DIR, fileName);

  fs.writeFileSync(filePath, buffer);

  return { fileName, filePath };
}

export function getFilePath(fileName: string): string {
  return path.join(UPLOADS_DIR, fileName);
}

export function deleteFile(fileName: string): void {
  const filePath = getFilePath(fileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export function fileExists(fileName: string): boolean {
  return fs.existsSync(getFilePath(fileName));
}

export function saveObject(data: Buffer, objectId: string, ext: string): string {
  ensureDir(OBJECTS_DIR);
  const fileName = `${objectId}${ext}`;
  const filePath = path.join(OBJECTS_DIR, fileName);
  fs.writeFileSync(filePath, data);
  return fileName;
}

export function getObjectPath(fileName: string): string {
  return path.join(OBJECTS_DIR, fileName);
}

export function objectExists(fileName: string): boolean {
  return fs.existsSync(getObjectPath(fileName));
}

export function deleteObject(fileName: string): void {
  const filePath = getObjectPath(fileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
