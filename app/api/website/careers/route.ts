import { randomBytes } from "node:crypto";

import type { Prisma } from "@/generated/prisma/client";

import { NextRequest, NextResponse } from "next/server";

import { safeFirestoreMirror } from "@/lib/firebase/firestoreRest";
import { uploadPrivateFile } from "@/lib/firebase/storageRest";
import { classifyWebsiteRequest } from "@/lib/marketing/internalTraffic";
import { prisma } from "@/lib/prisma";
import {
  consumeDistributedRateLimit,
  requestIp,
} from "@/lib/server/distributedRateLimit";
import { logServerError } from "@/lib/server/safeLogging";
import { createAdminNotification } from "@/lib/admin/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const allowedTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function text(form: FormData, key: string, max = 500) {
  const value = form.get(key);
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max)
    : "";
}

function phone(value: string) {
  const digits = value.replace(/\D/g, "");
  const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  return /^[6-9]\d{9}$/.test(local) ? `+91${local}` : "";
}

function applicationNumber() {
  return `JOB-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function jsonField(form: FormData, key: string): Prisma.InputJsonValue | undefined {
  const value = form.get(key);
  if (typeof value !== "string" || !value.trim()) return undefined;
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object"
      ? (parsed as Prisma.InputJsonValue)
      : undefined;
  } catch {
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json({ success: false, message: "This application is not allowed." }, { status: 403 });
    }

    if (Number(request.headers.get("content-length") ?? 0) > MAX_RESUME_BYTES + 100_000) {
      return NextResponse.json({ success: false, message: "This application is too large." }, { status: 413 });
    }

    const ipLimit = await consumeDistributedRateLimit({
      scope: "website_career_ip",
      identifier: requestIp(request),
      limit: 8,
      windowMs: 60 * 60 * 1000,
    });
    if (!ipLimit.allowed) {
      return NextResponse.json({ success: false, message: "Please wait before submitting another application." }, { status: 429 });
    }

    const form = await request.formData();
    if (text(form, "website", 100)) return NextResponse.json({ success: true });

    const name = text(form, "name", 120);
    const mobile = phone(text(form, "mobile", 30));
    const email = text(form, "email", 180).toLowerCase();
    const position = text(form, "position", 100);
    const consent = form.get("consent") === "true";
    const resume = form.get("resume");

    if (name.length < 2 || !mobile || !position || !consent) {
      return NextResponse.json(
        { success: false, message: "Please complete your name, valid mobile number, position and consent." },
        { status: 400 },
      );
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, message: "Please enter a valid email address." }, { status: 400 });
    }

    const applicantLimit = await consumeDistributedRateLimit({
      scope: "website_career_phone",
      identifier: mobile,
      limit: 3,
      windowMs: 24 * 60 * 60 * 1000,
    });
    if (!applicantLimit.allowed) {
      return NextResponse.json({ success: false, message: "We already received your application. Please wait for our team to respond." }, { status: 429 });
    }

    let resumeData: Uint8Array<ArrayBuffer> | null = null;
    let resumeStoragePath: string | null = null;
    let resumeFileName: string | null = null;
    let resumeMimeType: string | null = null;
    let resumeSize: number | null = null;
    const number = applicationNumber();

    if (resume instanceof File && resume.size > 0) {
      if (resume.size > MAX_RESUME_BYTES || !allowedTypes.has(resume.type)) {
        return NextResponse.json(
          { success: false, message: "Resume must be a PDF, DOC or DOCX file no larger than 5 MB." },
          { status: 400 },
        );
      }
      resumeFileName = resume.name.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 120);
      resumeMimeType = resume.type;
      resumeSize = resume.size;
      resumeData = new Uint8Array(await resume.arrayBuffer());

      if (process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT) {
        resumeStoragePath = `private/careers/${number}/${resumeFileName}`;
        await uploadPrivateFile(resumeStoragePath, resumeData, resumeMimeType);
        resumeData = null;
      }
    }

    const classification = classifyWebsiteRequest(request);
    const application = await prisma.careerApplication.create({
      data: {
        applicationNumber: number,
        name,
        phone: mobile,
        email: email || null,
        location: text(form, "location", 180) || null,
        position,
        leadType: "recruitment",
        qualification: text(form, "qualification", 250) || null,
        experience: text(form, "experience", 120) || null,
        currentRole: text(form, "currentRole", 180) || null,
        expectedSalary: text(form, "expectedSalary", 100) || null,
        joiningAvailability: text(form, "joiningAvailability", 120) || null,
        message: text(form, "message", 1500) || null,
        consent,
        resumeFileName,
        resumeMimeType,
        resumeSize,
        resumeStoragePath,
        resumeData,
        trafficClass: classification.trafficClass,
        source: text(form, "utmSource", 100) || null,
        medium: text(form, "utmMedium", 100) || null,
        campaign: text(form, "utmCampaign", 150) || null,
        content: text(form, "utmContent", 150) || null,
        term: text(form, "utmTerm", 150) || null,
        referrer: text(form, "referrer", 500) || null,
        landingPage: text(form, "landingPage", 500) || request.nextUrl.href,
        gclid: text(form, "gclid", 200) || null,
        gbraid: text(form, "gbraid", 200) || null,
        wbraid: text(form, "wbraid", 200) || null,
        fbclid: text(form, "fbclid", 200) || null,
        fbc: text(form, "fbc", 250) || null,
        fbp: text(form, "fbp", 250) || null,
        firstTouch: jsonField(form, "firstTouch"),
        lastTouch: jsonField(form, "lastTouch"),
      },
    });

    await prisma.activityLog.create({
      data: {
        action: "CREATED",
        entityType: "MARKETING_EVENT",
        entityId: application.id,
        description: "Career application submitted from the public website.",
        newData: {
          eventName: "career_application_submitted",
          eventScope: "RECRUITMENT",
          leadType: "recruitment",
          applicationNumber: number,
          trafficClass: classification.trafficClass,
          isInternal: classification.isInternal,
          isTest: classification.isTest,
          source: application.source,
          campaign: application.campaign,
          landingPage: application.landingPage,
        },
      },
    });

    await safeFirestoreMirror("careerApplications", application.id, {
      applicationNumber: number,
      name,
      phone: mobile,
      email: email || null,
      position,
      leadType: "recruitment",
      status: "NEW",
      resumeStoragePath,
      trafficClass: classification.trafficClass,
      source: application.source,
      campaign: application.campaign,
      landingPage: application.landingPage,
      createdAt: application.createdAt,
    });

    if (classification.trafficClass === "GENUINE") {
      await createAdminNotification({
        category: "CAREERS",
        type: "NEW_CAREER_APPLICATION",
        title: "New career application received",
        body: "A new recruitment application is ready for review.",
        href: `/admin/careers?applicationId=${application.id}`,
        entityType: "CAREER_APPLICATION",
        entityId: application.id,
        eventKey: application.id,
      }).catch((error) => logServerError("Career notification could not be queued.", error));
    }

    return NextResponse.json(
      { success: true, applicationNumber: number, message: "Thank you. Your application has been received." },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    logServerError("Career application failed.", error);
    return NextResponse.json(
      { success: false, message: "The application could not be submitted. Please try again." },
      { status: 500 },
    );
  }
}
