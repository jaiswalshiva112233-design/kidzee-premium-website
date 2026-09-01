import { createHash, randomUUID } from "node:crypto";

import type {
  $Enums,
  Prisma,
} from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { getCurrentAdminUser } from "@/lib/admin/auth";
import { deleteStoredFile, downloadPrivateFile } from "@/lib/firebase/storageRest";
import { storePrivateStudentFile } from "@/lib/media/storedFiles";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server/safeLogging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_PROFILE_PHOTO_SIZE = 5 * 1024 * 1024;

const DOCUMENT_TYPES = [
  "BIRTH_CERTIFICATE",
  "CHILD_AADHAAR_CARD",
  "PARENT_ID_PROOF",
  "ADDRESS_PROOF",
  "IMMUNISATION_RECORD",
  "MEDICAL_CERTIFICATE",
  "PASSPORT_PHOTO",
  "TRANSFER_CERTIFICATE",
  "OTHER",
] as const;

const REQUIRED_DOCUMENT_TYPES:
  $Enums.StudentDocumentType[] = [
    "BIRTH_CERTIFICATE",
    "CHILD_AADHAAR_CARD",
    "PARENT_ID_PROOF",
    "ADDRESS_PROOF",
    "IMMUNISATION_RECORD",
    "PASSPORT_PHOTO",
  ];

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type DocumentAction =
  | "VERIFY"
  | "REJECT"
  | "RESET";

type UpdateDocumentBody = {
  documentId?: unknown;
  action?: unknown;
  rejectionReason?: unknown;
};

function cleanText(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function cleanOptionalText(
  value: unknown,
  maximumLength = 1000,
) {
  const text = cleanText(value);

  return text
    ? text.slice(0, maximumLength)
    : null;
}

function isDocumentType(
  value: string,
): value is $Enums.StudentDocumentType {
  return DOCUMENT_TYPES.includes(
    value as $Enums.StudentDocumentType,
  );
}

function isDocumentAction(
  value: string,
): value is DocumentAction {
  return [
    "VERIFY",
    "REJECT",
    "RESET",
  ].includes(value);
}

function parseOptionalDate(value: unknown) {
  const text = cleanText(value);

  if (!text) {
    return null;
  }

  const date = new Date(
    `${text}T23:59:59.999Z`,
  );

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function sanitiseFileName(value: string) {
  const cleaned = value
    .replace(/[\\/\u0000-\u001f\u007f]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);

  return cleaned || "student-document";
}

function getStudentName(student: {
  firstName: string;
  middleName: string | null;
  lastName: string | null;
}) {
  return [
    student.firstName,
    student.middleName,
    student.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function canManageStudents(session: {
  role: string;
  permissions: string[];
}) {
  return (
    session.role === "OWNER" ||
    session.permissions.includes("*") ||
    session.permissions.includes(
      "students.manage",
    )
  );
}

function serialiseDocument(document: {
  id: string;
  studentId: string;
  documentType: $Enums.StudentDocumentType;
  title: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  status: $Enums.StudentDocumentStatus;
  notes: string | null;
  rejectionReason: string | null;
  expiresAt: Date | null;
  uploadedById: string | null;
  verifiedById: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  uploadedBy?: {
    name: string;
  } | null;
  verifiedBy?: {
    name: string;
  } | null;
}) {
  return {
    id: document.id,
    studentId: document.studentId,
    documentType:
      document.documentType,
    title: document.title,
    fileName: document.fileName,
    mimeType: document.mimeType,
    fileSize: document.fileSize,
    status: document.status,
    notes: document.notes,
    rejectionReason:
      document.rejectionReason,
    expiresAt: document.expiresAt,
    uploadedById: document.uploadedById,
    uploadedByName:
      document.uploadedBy?.name ?? null,
    verifiedById: document.verifiedById,
    verifiedByName:
      document.verifiedBy?.name ?? null,
    verifiedAt: document.verifiedAt,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    viewUrl: `/api/admin/student-documents?documentId=${encodeURIComponent(
      document.id,
    )}`,
    downloadUrl: `/api/admin/student-documents?documentId=${encodeURIComponent(
      document.id,
    )}&download=1`,
  };
}

async function updateAdmissionDocumentState(
  transaction: Prisma.TransactionClient,
  studentId: string,
) {
  const verifiedDocuments =
    await transaction.studentDocument.findMany({
      where: {
        studentId,
        status: "VERIFIED",
        documentType: {
          in: REQUIRED_DOCUMENT_TYPES,
        },
      },
      select: {
        documentType: true,
      },
    });

  const verifiedTypes = new Set(
    verifiedDocuments.map(
      (document) => document.documentType,
    ),
  );

  const documentsComplete =
    REQUIRED_DOCUMENT_TYPES.every(
      (documentType) =>
        verifiedTypes.has(documentType),
    );

  await transaction.admission.updateMany({
    where: {
      studentId,
    },
    data: {
      documentsComplete,
    },
  });

  return documentsComplete;
}

function unauthorisedResponse() {
  return NextResponse.json(
    {
      success: false,
      message:
        "Please sign in to manage student documents.",
    },
    {
      status: 401,
    },
  );
}

function forbiddenResponse() {
  return NextResponse.json(
    {
      success: false,
      message:
        "You do not have permission to manage student documents.",
    },
    {
      status: 403,
    },
  );
}

export async function GET(request: Request) {
  try {
    const session =
      await getCurrentAdminUser();

    if (!session) {
      return unauthorisedResponse();
    }

    if (!canManageStudents(session)) {
      return forbiddenResponse();
    }

    const url = new URL(request.url);
    const documentId = cleanText(
      url.searchParams.get("documentId"),
    );
    const studentId = cleanText(
      url.searchParams.get("studentId"),
    );

    if (documentId) {
      const document =
        await prisma.studentDocument.findUnique({
          where: {
            id: documentId,
          },
          select: {
            id: true,
            studentId: true,
            fileName: true,
            mimeType: true,
            fileSize: true,
            fileData: true,
            storedFile: {
              select: {
                provider: true,
                storagePath: true,
                visibility: true,
                status: true,
              },
            },
          },
        });

      if (!document) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Student document was not found.",
          },
          {
            status: 404,
          },
        );
      }

      if (document.storedFile?.visibility === "PUBLIC") {
        return NextResponse.json(
          { success: false, message: "Private document protection is invalid for this file." },
          { status: 409 },
        );
      }
      const fileBytes = document.storedFile?.storagePath
        ? await downloadPrivateFile(document.storedFile.storagePath)
        : document.fileData
          ? new Uint8Array(document.fileData)
          : null;
      if (!fileBytes) {
        return NextResponse.json(
          { success: false, message: "The private document file is unavailable." },
          { status: 410 },
        );
      }
      const fileBody = fileBytes.buffer.slice(
        fileBytes.byteOffset,
        fileBytes.byteOffset +
          fileBytes.byteLength,
      ) as ArrayBuffer;
      const download =
        url.searchParams.get("download") ===
        "1";
      const safeFileName = sanitiseFileName(
        document.fileName,
      ).replace(/["\\]/g, "-");

      await prisma.activityLog.create({
        data: {
          adminUserId: session.userId,
          action: download ? "DOWNLOADED" : "VIEWED",
          entityType: "StudentDocument",
          entityId: document.id,
          description: `${download ? "Downloaded" : "Viewed"} a protected student document.`,
          newData: { studentId: document.studentId, private: true },
        },
      });

      return new NextResponse(fileBody, {
        status: 200,
        headers: {
          "Content-Type": document.mimeType,
          "Content-Length":
            document.fileSize.toString(),
          "Content-Disposition": `${
            download ? "attachment" : "inline"
          }; filename="${safeFileName}"`,
          "Cache-Control":
            "private, no-store, max-age=0",
          "X-Content-Type-Options":
            "nosniff",
        },
      });
    }

    if (!studentId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A student ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const student =
      await prisma.student.findUnique({
        where: {
          id: studentId,
        },
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          studentNumber: true,
          admission: {
            select: {
              documentsComplete: true,
            },
          },
        },
      });

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message: "Student was not found.",
        },
        {
          status: 404,
        },
      );
    }

    const documents =
      await prisma.studentDocument.findMany({
        where: {
          studentId,
        },
        select: {
          id: true,
          studentId: true,
          documentType: true,
          title: true,
          fileName: true,
          mimeType: true,
          fileSize: true,
          status: true,
          notes: true,
          rejectionReason: true,
          expiresAt: true,
          uploadedById: true,
          verifiedById: true,
          verifiedAt: true,
          createdAt: true,
          updatedAt: true,
          uploadedBy: {
            select: {
              name: true,
            },
          },
          verifiedBy: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        studentNumber:
          student.studentNumber,
        name: getStudentName(student),
      },
      documentsComplete:
        student.admission
          ?.documentsComplete ?? false,
      requiredDocumentTypes:
        REQUIRED_DOCUMENT_TYPES,
      documents: documents.map(
        serialiseDocument,
      ),
    });
  } catch (error) {
    logServerError(
      "Unable to load student documents:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Student documents could not be loaded. Please try again. If the problem continues, contact the Owner.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session =
      await getCurrentAdminUser();

    if (!session) {
      return unauthorisedResponse();
    }

    if (!canManageStudents(session)) {
      return forbiddenResponse();
    }

    const formData = await request.formData();
    const studentId = cleanText(
      formData.get("studentId"),
    );
    const documentTypeValue = cleanText(
      formData.get("documentType"),
    );
    const title = cleanText(
      formData.get("title"),
    ).slice(0, 120);
    const notes = cleanOptionalText(
      formData.get("notes"),
      1000,
    );
    const expiresAt = parseOptionalDate(
      formData.get("expiresAt"),
    );
    const fileValue = formData.get("file");

    if (!studentId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select a student.",
        },
        {
          status: 400,
        },
      );
    }

    if (!isDocumentType(documentTypeValue)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select a valid document type.",
        },
        {
          status: 400,
        },
      );
    }

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a document title.",
        },
        {
          status: 400,
        },
      );
    }

    if (!(fileValue instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please choose a document file.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      fileValue.size <= 0 ||
      fileValue.size > MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The file must be between 1 byte and 10 MB.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      documentTypeValue === "PASSPORT_PHOTO" &&
      fileValue.size > MAX_PROFILE_PHOTO_SIZE
    ) {
      return NextResponse.json(
        { success: false, message: "Student profile photographs must be 5 MB or smaller." },
        { status: 400 },
      );
    }

    if (
      !ALLOWED_MIME_TYPES.has(fileValue.type)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Upload a PDF, JPG, PNG or WebP file.",
        },
        {
          status: 400,
        },
      );
    }

    const student =
      await prisma.student.findUnique({
        where: {
          id: studentId,
        },
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          studentNumber: true,
        },
      });

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message: "Student was not found.",
        },
        {
          status: 404,
        },
      );
    }

    const fileData = new Uint8Array(
      await fileValue.arrayBuffer(),
    );
    const sha256 = createHash("sha256")
      .update(fileData)
      .digest("hex");
    const fileName = sanitiseFileName(
      fileValue.name,
    );
    const documentId = randomUUID();
    const storedFile = await storePrivateStudentFile({
      bytes: fileData,
      fileName,
      mimeType: fileValue.type,
      studentId,
      linkedRecordId: documentId,
      uploadedById: session.userId,
      compressImage: documentTypeValue === "PASSPORT_PHOTO",
    });
    const storedFileName = storedFile.mimeType === "image/webp"
      ? `${fileName.replace(/\.[^.]+$/, "")}.webp`
      : fileName;

    const result =
      await prisma.$transaction(
        async (transaction) => {
          const document =
            await transaction.studentDocument.create({
              data: {
                id: documentId,
                studentId,
                documentType:
                  documentTypeValue,
                title,
                fileName: storedFileName,
                mimeType: storedFile.mimeType,
                fileSize: storedFile.optimizedSize ?? storedFile.originalSize,
                fileData: null,
                storedFileId: storedFile.id,
                sha256,
                status: "UPLOADED",
                notes,
                expiresAt,
                uploadedById:
                  session.userId,
              },
              select: {
                id: true,
                studentId: true,
                documentType: true,
                title: true,
                fileName: true,
                mimeType: true,
                fileSize: true,
                status: true,
                notes: true,
                rejectionReason: true,
                expiresAt: true,
                uploadedById: true,
                verifiedById: true,
                verifiedAt: true,
                createdAt: true,
                updatedAt: true,
                uploadedBy: {
                  select: {
                    name: true,
                  },
                },
                verifiedBy: {
                  select: {
                    name: true,
                  },
                },
              },
            });

          await transaction.admission.updateMany({
            where: {
              studentId,
            },
            data: {
              documentsComplete: false,
            },
          });

          await transaction.activityLog.create({
            data: {
              adminUserId:
                session.userId,
              action: "CREATED",
              entityType:
                "StudentDocument",
              entityId: document.id,
              description: `${title} uploaded for ${getStudentName(
                student,
              )} (${student.studentNumber}).`,
              newData: {
                studentId,
                documentType:
                  documentTypeValue,
                fileName: storedFileName,
                fileSize: storedFile.optimizedSize ?? storedFile.originalSize,
                originalFileSize: fileValue.size,
                mimeType: storedFile.mimeType,
                sha256,
                status: "UPLOADED",
                storageProvider: storedFile.provider,
                private: true,
              },
            },
          });

          return document;
        },
      );

    return NextResponse.json(
      {
        success: true,
        message:
          "Document uploaded securely and sent for verification.",
        document:
          serialiseDocument(result),
        documentsComplete: false,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    logServerError(
      "Unable to upload student document:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "The document could not be uploaded. Please try again. If the problem continues, contact the Owner.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session =
      await getCurrentAdminUser();

    if (!session) {
      return unauthorisedResponse();
    }

    if (!canManageStudents(session)) {
      return forbiddenResponse();
    }

    const body =
      (await request.json()) as UpdateDocumentBody;
    const documentId = cleanText(
      body.documentId,
    );
    const actionValue = cleanText(
      body.action,
    ).toUpperCase();
    const rejectionReason =
      cleanOptionalText(
        body.rejectionReason,
        500,
      );

    if (!documentId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A document ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!isDocumentAction(actionValue)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Choose Verify, Reject or Reset.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      actionValue === "REJECT" &&
      (!rejectionReason ||
        rejectionReason.length < 3)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a clear rejection reason.",
        },
        {
          status: 400,
        },
      );
    }

    const existingDocument =
      await prisma.studentDocument.findUnique({
        where: {
          id: documentId,
        },
        select: {
          id: true,
          studentId: true,
          documentType: true,
          title: true,
          status: true,
          student: {
            select: {
              firstName: true,
              middleName: true,
              lastName: true,
              studentNumber: true,
            },
          },
        },
      });

    if (!existingDocument) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Student document was not found.",
        },
        {
          status: 404,
        },
      );
    }

    const nextStatus:
      $Enums.StudentDocumentStatus =
        actionValue === "VERIFY"
          ? "VERIFIED"
          : actionValue === "REJECT"
            ? "REJECTED"
            : "UPLOADED";

    const result =
      await prisma.$transaction(
        async (transaction) => {
          const document =
            await transaction.studentDocument.update({
              where: {
                id: documentId,
              },
              data: {
                status: nextStatus,
                rejectionReason:
                  nextStatus === "REJECTED"
                    ? rejectionReason
                    : null,
                verifiedById:
                  nextStatus === "UPLOADED"
                    ? null
                    : session.userId,
                verifiedAt:
                  nextStatus === "UPLOADED"
                    ? null
                    : new Date(),
              },
              select: {
                id: true,
                studentId: true,
                documentType: true,
                title: true,
                fileName: true,
                mimeType: true,
                fileSize: true,
                status: true,
                notes: true,
                rejectionReason: true,
                expiresAt: true,
                uploadedById: true,
                verifiedById: true,
                verifiedAt: true,
                createdAt: true,
                updatedAt: true,
                uploadedBy: {
                  select: {
                    name: true,
                  },
                },
                verifiedBy: {
                  select: {
                    name: true,
                  },
                },
              },
            });

          const documentsComplete =
            await updateAdmissionDocumentState(
              transaction,
              existingDocument.studentId,
            );

          await transaction.activityLog.create({
            data: {
              adminUserId:
                session.userId,
              action: "UPDATED",
              entityType:
                "StudentDocument",
              entityId: documentId,
              description: `${existingDocument.title} marked ${nextStatus.toLowerCase()} for ${getStudentName(
                existingDocument.student,
              )} (${existingDocument.student.studentNumber}).`,
              previousData: {
                status:
                  existingDocument.status,
              },
              newData: {
                status: nextStatus,
                rejectionReason:
                  nextStatus === "REJECTED"
                    ? rejectionReason
                    : null,
                documentsComplete,
              },
            },
          });

          return {
            document,
            documentsComplete,
          };
        },
      );

    return NextResponse.json({
      success: true,
      message:
        nextStatus === "VERIFIED"
          ? "Document verified successfully."
          : nextStatus === "REJECTED"
            ? "Document rejected with the reason saved."
            : "Document returned to pending verification.",
      document: serialiseDocument(
        result.document,
      ),
      documentsComplete:
        result.documentsComplete,
    });
  } catch (error) {
    logServerError(
      "Unable to update student document:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "The document status could not be updated. Please try again. If the problem continues, contact the Owner.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session =
      await getCurrentAdminUser();

    if (!session) {
      return unauthorisedResponse();
    }

    if (session.role !== "OWNER") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only the Owner can permanently delete student documents.",
        },
        {
          status: 403,
        },
      );
    }

    const url = new URL(request.url);
    const documentId = cleanText(
      url.searchParams.get("documentId"),
    );

    if (!documentId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A document ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const existingDocument =
      await prisma.studentDocument.findUnique({
        where: {
          id: documentId,
        },
        select: {
          id: true,
          studentId: true,
          title: true,
          documentType: true,
          fileName: true,
          status: true,
          storedFileId: true,
          storedFile: {
            select: {
              storagePath: true,
              provider: true,
            },
          },
          student: {
            select: {
              firstName: true,
              middleName: true,
              lastName: true,
              studentNumber: true,
            },
          },
        },
      });

    if (!existingDocument) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Student document was not found.",
        },
        {
          status: 404,
        },
      );
    }

    const documentsComplete =
      await prisma.$transaction(
        async (transaction) => {
          await transaction.studentDocument.delete({
            where: {
              id: documentId,
            },
          });

          if (existingDocument.storedFileId) {
            await transaction.storedFile.update({
              where: { id: existingDocument.storedFileId },
              data: { status: "DELETED", deletedAt: new Date() },
            });
          }

          const completionState =
            await updateAdmissionDocumentState(
              transaction,
              existingDocument.studentId,
            );

          await transaction.activityLog.create({
            data: {
              adminUserId:
                session.userId,
              action: "DELETED",
              entityType:
                "StudentDocument",
              entityId: documentId,
              description: `${existingDocument.title} permanently deleted for ${getStudentName(
                existingDocument.student,
              )} (${existingDocument.student.studentNumber}).`,
              previousData: {
                documentType:
                  existingDocument.documentType,
                fileName:
                  existingDocument.fileName,
                status:
                  existingDocument.status,
              },
              newData: {
                documentsComplete:
                  completionState,
              },
            },
          });

          return completionState;
        },
      );

    let cleanupWarning = false;
    if (existingDocument.storedFile?.storagePath) {
      try {
        await deleteStoredFile(existingDocument.storedFile.storagePath);
      } catch (storageError) {
        cleanupWarning = true;
        if (existingDocument.storedFileId) {
          await prisma.storedFile.update({
            where: { id: existingDocument.storedFileId },
            data: {
              status: "FAILED",
              processingError: storageError instanceof Error ? storageError.name : "StorageDeletionError",
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: cleanupWarning
        ? "The document record was deleted, but storage cleanup needs attention in Storage & Media Health."
        : "Student document deleted permanently.",
      documentId,
      documentsComplete,
    });
  } catch (error) {
    logServerError(
      "Unable to delete student document:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "The document could not be deleted. Please try again. If the problem continues, contact the Owner.",
      },
      {
        status: 500,
      },
    );
  }
}
