import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin/auth";
import {
  firebasePublicFileUrl,
  uploadStoredFile,
} from "@/lib/firebase/storageRest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB

export async function POST(request: Request) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json(
        { success: false, message: "Not authorized" },
        { status: 401 },
      );
    }

    const contentType = request.headers.get("content-type") || "";
    let fileBuffer: Buffer | null = null;
    let fileName = `upload-${Date.now()}`;
    let mimeType = "application/octet-stream";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json(
          { success: false, message: "No file provided" },
          { status: 400 },
        );
      }
      fileBuffer = Buffer.from(await file.arrayBuffer());
      fileName = file.name || fileName;
      mimeType = file.type || mimeType;
    } else {
      fileBuffer = Buffer.from(await request.arrayBuffer());
      const headerFilename = request.headers.get("x-filename");
      if (headerFilename) {
        fileName = decodeURIComponent(headerFilename);
      }
      mimeType = contentType.split(";")[0] || mimeType;
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return NextResponse.json(
        { success: false, message: "Empty file provided" },
        { status: 400 },
      );
    }

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unsupported file type. Only JPEG, PNG, WebP, GIF, and MP4/WebM videos are allowed.",
        },
        { status: 400 },
      );
    }

    const isVideo = mimeType.startsWith("video/");
    const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (fileBuffer.length > maxBytes) {
      return NextResponse.json(
        {
          success: false,
          message: `File exceeds maximum allowed size of ${isVideo ? "50MB" : "10MB"}.`,
        },
        { status: 400 },
      );
    }

    const cleanExt =
      path.extname(fileName) || (mimeType.includes("video") ? ".mp4" : ".jpg");
    const safeName = `${randomUUID()}${cleanExt}`;
    const storagePath = `public/landing/media/${safeName}`;

    await uploadStoredFile(storagePath, new Uint8Array(fileBuffer), mimeType);
    const finalUrl = firebasePublicFileUrl(storagePath);

    return NextResponse.json({
      success: true,
      url: finalUrl,
      fileName,
      mimeType,
    });
  } catch (error) {
    console.error("Direct upload error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 },
    );
  }
}
