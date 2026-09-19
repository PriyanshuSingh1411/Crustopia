import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const ALLOWED_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Validate and save an uploaded image, returning its public URL.
 * Never trusts the original filename (path traversal risk) — generates
 * a random name and derives the extension from the verified MIME type.
 * Throws with a user-safe message on any validation failure.
 */
export async function saveUploadedImage(file) {
  if (!file || typeof file !== "object") {
    throw new Error("No file provided");
  }

  if (typeof file.size === "number" && file.size > MAX_BYTES) {
    throw new Error("Image must be smaller than 5MB");
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    throw new Error("Only JPG, PNG, WEBP or GIF images are allowed");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });

  const filename = `${crypto.randomUUID()}.${ext}`;
  const filepath = path.join(uploadDir, filename);

  await fs.writeFile(filepath, buffer);

  return `/uploads/${filename}`;
}
