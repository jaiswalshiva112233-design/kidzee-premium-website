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

    const cleanExt = path.extname(fileName) || (mimeType.includes("video") ? ".mp4" : ".jpg");
    const safeName = `${randomUUID()}${cleanExt}`;
    const storagePath = `public/landing/media/${safeName}`;

    let finalUrl = "";

    // 1. Try Firebase Storage first
    try {
      await uploadStoredFile(storagePath, new Uint8Array(fileBuffer), mimeType);
      finalUrl = firebasePublicFileUrl(storagePath);
    } catch (fbErr) {
      console.warn("Firebase Storage upload skipped/failed, using local public fallback:", fbErr);
      // 2. Local public fallback
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const localFilePath = path.join(uploadDir, safeName);
      fs.writeFileSync(localFilePath, fileBuffer);
      finalUrl = `/uploads/${safeName}`;
    }

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
