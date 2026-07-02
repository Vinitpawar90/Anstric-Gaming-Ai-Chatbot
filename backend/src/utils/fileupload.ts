import fs from "fs";
import path from "path";
import { extractText } from "../features/source/services/textExtractor";

// Resolve uploads directory relative to the backend root
const UPLOADS_ROOT = path.resolve(
  process.env.UPLOADS_DIR || path.join(__dirname, "../../uploads")
);

// Ensure uploads root exists on startup
if (!fs.existsSync(UPLOADS_ROOT)) {
  fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
}

// Helper to extract inserted ID from knex returning result
export function extractInsertedId(result: any): number {
  if (!result || result.length === 0)
    throw new Error("Failed to create source record");
  const rec = result[0];
  return typeof rec === "object" && rec !== null
    ? rec.id || Number(rec)
    : Number(rec);
}

// Define allowed file types and max size
const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_UPLOAD = 10;

export interface FileUploadResult {
  /** Relative URL path, e.g. /files/users/john/agents/3/files/1234_doc.pdf */
  Location: string;
  /** Relative file path on disk, e.g. users/john/agents/3/files/1234_doc.pdf */
  Key: string;
  /** Always "local" for local storage */
  Bucket: string;
  ETag: string;
  ContentType?: string;
  size?: number;
  textContent?: string;
  /** Absolute path on disk — used for direct file reads */
  absolutePath?: string;
}

/**
 * Save a multer file to local disk and return a FileUploadResult.
 */
export const uploadMulterFile = async (
  file: Express.Multer.File,
  folderPath: string = "uploads"
): Promise<FileUploadResult> => {
  if (!file) {
    throw new Error("No file provided");
  }

  // Sanitize filename and folder path to prevent path traversal
  const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
  const sanitizedFolder = folderPath
    .replace(/[^a-zA-Z0-9\/_-]/g, "_")
    .replace(/^\/+|\/+$/g, "");

  const timestamp = Date.now();
  const uniqueFilename = `${timestamp}_${sanitizedName}`;
  const relativeKey = `${sanitizedFolder}/${uniqueFilename}`;
  const absolutePath = path.join(UPLOADS_ROOT, relativeKey);
  const absoluteDir = path.dirname(absolutePath);

  // Ensure target directory exists
  if (!fs.existsSync(absoluteDir)) {
    fs.mkdirSync(absoluteDir, { recursive: true });
  }

  // Write buffer to disk
  fs.writeFileSync(absolutePath, file.buffer);

  // Extract text content from the buffer
  let textContent = "";
  try {
    textContent = await extractText(file.buffer, file.mimetype);
  } catch (err: any) {
    console.warn(`Text extraction failed: ${err.message}`);
  }

  // Public URL served by Express static middleware at /files/
  const publicUrl = `/files/${relativeKey}`;

  // Simple ETag based on size + timestamp
  const etag = `"${file.size}-${timestamp}"`;

  return {
    Location: publicUrl,
    Key: relativeKey,
    Bucket: "local",
    ETag: etag,
    ContentType: file.mimetype,
    size: file.size,
    textContent,
    absolutePath,
  };
};

/**
 * Upload multiple files to local disk.
 */
export const uploadMultipleFilesMulter = async (
  files: Express.Multer.File[],
  folderPath: string = "uploads"
): Promise<FileUploadResult[]> => {
  if (!files || files.length === 0) {
    throw new Error("No files provided");
  }

  if (files.length > MAX_FILES_PER_UPLOAD) {
    throw new Error(`Too many files. Maximum allowed: ${MAX_FILES_PER_UPLOAD}`);
  }

  const uploadPromises = files.map((file) => uploadMulterFile(file, folderPath));
  return Promise.all(uploadPromises);
};

/** Get the absolute path on disk for a given public URL (e.g. /files/users/...) */
export const getAbsolutePathFromUrl = (publicUrl: string): string => {
  // Strip the /files/ prefix to get the relative key
  const relativeKey = publicUrl.replace(/^\/files\//, "");
  return path.join(UPLOADS_ROOT, relativeKey);
};

export { ALLOWED_DOCUMENT_TYPES, MAX_FILE_SIZE, MAX_FILES_PER_UPLOAD, UPLOADS_ROOT };
