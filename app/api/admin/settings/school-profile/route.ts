import type { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { sanityServerClient } from "@/lib/sanity/serverClient";

const SCHOOL_PROFILE_KEY = "SCHOOL_PROFILE";

const MAX_DOCUMENT_IMAGE_SIZE_BYTES =
  8 * 1024 * 1024;

const ALLOWED_DOCUMENT_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
]);

const DOCUMENT_IMAGE_FIELDS = {
  logoUrl: "Official logo",
  whiteLogoUrl: "White logo",
  stampUrl: "School stamp",
  signatureUrl: "Authorised signature",
  upiQrUrl: "UPI QR code",
} as const;

type DocumentImageField =
  keyof typeof DOCUMENT_IMAGE_FIELDS;

function isDocumentImageField(
  value: unknown,
): value is DocumentImageField {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(
      DOCUMENT_IMAGE_FIELDS,
      value,
    )
  );
}

type SchoolProfile = {
  schoolName: string;
  centreName: string;
  franchiseName: string;
  schoolCode: string;

  addressLine1: string;
  addressLine2: string;
  locality: string;
  city: string;
  state: string;
  postalCode: string;
  googleMapUrl: string;

  phone: string;
  alternatePhone: string;
  whatsapp: string;
  email: string;
  website: string;

  centreHeadName: string;
  centreHeadDesignation: string;
  centreHeadPhone: string;
  centreHeadEmail: string;

  studentCapacity: number;

  gstNumber: string;
  panNumber: string;
  registrationNumber: string;
  udyamNumber: string;

  bankName: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  bankBranch: string;
  upiId: string;

  logoUrl: string;
  whiteLogoUrl: string;
  stampUrl: string;
  signatureUrl: string;
  upiQrUrl: string;

  receiptFooter: string;
  receiptTerms: string[];

  showLogoOnReceipt: boolean;
  showStampOnReceipt: boolean;
  showSignatureOnReceipt: boolean;
  showBankDetailsOnReceipt: boolean;
  showQrOnReceipt: boolean;
};

type SchoolProfileRequestBody = Partial<
  Record<keyof SchoolProfile, unknown>
>;

const defaultSchoolProfile: SchoolProfile = {
  schoolName: "Kidzee Preschool & Daycare",
  centreName: "Kidzee Sector 12, Dwarka",
  franchiseName: "Kidzee",
  schoolCode: "",

  addressLine1: "Plot No. 19, Block B",
  addressLine2: "Sector 12B, Dwarka",
  locality: "Dwarka",
  city: "New Delhi",
  state: "Delhi",
  postalCode: "",
  googleMapUrl: "",

  phone: "9667038673",
  alternatePhone: "",
  whatsapp: "9667038673",
  email: "kidzeepreschoolsector12@gmail.com",
  website: "https://kidzeedwarka.com",

  centreHeadName: "",
  centreHeadDesignation: "Centre Head",
  centreHeadPhone: "",
  centreHeadEmail: "",

  studentCapacity: 60,

  gstNumber: "",
  panNumber: "",
  registrationNumber: "",
  udyamNumber: "",

  bankName: "",
  accountName: "",
  accountNumber: "",
  ifscCode: "",
  bankBranch: "",
  upiId: "",

  logoUrl: "",
  whiteLogoUrl: "",
  stampUrl: "",
  signatureUrl: "",
  upiQrUrl: "",

  receiptFooter:
    "Thank you for choosing Kidzee Sector 12, Dwarka.",

  receiptTerms: [
    "The monthly fee is payable on or before the 5th of every month.",
    "A late fee of ₹50 per day may apply after the due date.",
    "Fees once paid are non-refundable and non-transferable, except where required by law or approved in writing by the centre management.",
    "Late pickup charges may apply according to the centre's current policy.",
    "Emergency daycare must be requested in advance and is subject to availability.",
    "Please retain this receipt for future reference.",
  ],

  showLogoOnReceipt: true,
  showStampOnReceipt: true,
  showSignatureOnReceipt: true,
  showBankDetailsOnReceipt: false,
  showQrOnReceipt: false,
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanBoolean(
  value: unknown,
  fallback: boolean,
) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }
  }

  return fallback;
}

function parseStudentCapacity(value: unknown) {
  const capacity =
    typeof value === "number"
      ? value
      : Number(cleanText(value));

  if (
    !Number.isInteger(capacity) ||
    capacity < 1 ||
    capacity > 10000
  ) {
    return null;
  }

  return capacity;
}

function cleanTerms(
  value: unknown,
  fallback: string[],
) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const terms = value
    .filter(
      (item): item is string =>
        typeof item === "string",
    )
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);

  return terms.length > 0 ? terms : fallback;
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function normaliseStoredProfile(
  value: Prisma.JsonValue | null,
): SchoolProfile {
  if (!isRecord(value)) {
    return defaultSchoolProfile;
  }

  return {
    schoolName:
      cleanText(value.schoolName) ||
      defaultSchoolProfile.schoolName,

    centreName:
      cleanText(value.centreName) ||
      defaultSchoolProfile.centreName,

    franchiseName:
      cleanText(value.franchiseName) ||
      defaultSchoolProfile.franchiseName,

    schoolCode: cleanText(value.schoolCode),

    addressLine1:
      cleanText(value.addressLine1) ||
      defaultSchoolProfile.addressLine1,

    addressLine2:
      cleanText(value.addressLine2) ||
      defaultSchoolProfile.addressLine2,

    locality:
      cleanText(value.locality) ||
      defaultSchoolProfile.locality,

    city:
      cleanText(value.city) ||
      defaultSchoolProfile.city,

    state:
      cleanText(value.state) ||
      defaultSchoolProfile.state,

    postalCode: cleanText(value.postalCode),

    googleMapUrl: cleanText(value.googleMapUrl),

    phone:
      cleanText(value.phone) ||
      defaultSchoolProfile.phone,

    alternatePhone: cleanText(
      value.alternatePhone,
    ),

    whatsapp:
      cleanText(value.whatsapp) ||
      defaultSchoolProfile.whatsapp,

    email:
      cleanText(value.email) ||
      defaultSchoolProfile.email,

    website:
      cleanText(value.website) ||
      defaultSchoolProfile.website,

    centreHeadName: cleanText(
      value.centreHeadName,
    ),

    centreHeadDesignation:
      cleanText(value.centreHeadDesignation) ||
      defaultSchoolProfile.centreHeadDesignation,

    centreHeadPhone: cleanText(
      value.centreHeadPhone,
    ),

    centreHeadEmail: cleanText(
      value.centreHeadEmail,
    ),

    studentCapacity:
      parseStudentCapacity(
        value.studentCapacity,
      ) ?? defaultSchoolProfile.studentCapacity,

    gstNumber: cleanText(value.gstNumber),
    panNumber: cleanText(value.panNumber),

    registrationNumber: cleanText(
      value.registrationNumber,
    ),

    udyamNumber: cleanText(value.udyamNumber),

    bankName: cleanText(value.bankName),
    accountName: cleanText(value.accountName),
    accountNumber: cleanText(
      value.accountNumber,
    ),
    ifscCode: cleanText(value.ifscCode),
    bankBranch: cleanText(value.bankBranch),
    upiId: cleanText(value.upiId),

    logoUrl: cleanText(value.logoUrl),
    whiteLogoUrl: cleanText(
      value.whiteLogoUrl,
    ),
    stampUrl: cleanText(value.stampUrl),
    signatureUrl: cleanText(value.signatureUrl),
    upiQrUrl: cleanText(value.upiQrUrl),

    receiptFooter:
      cleanText(value.receiptFooter) ||
      defaultSchoolProfile.receiptFooter,

    receiptTerms: cleanTerms(
      value.receiptTerms,
      defaultSchoolProfile.receiptTerms,
    ),

    showLogoOnReceipt: cleanBoolean(
      value.showLogoOnReceipt,
      defaultSchoolProfile.showLogoOnReceipt,
    ),

    showStampOnReceipt: cleanBoolean(
      value.showStampOnReceipt,
      defaultSchoolProfile.showStampOnReceipt,
    ),

    showSignatureOnReceipt: cleanBoolean(
      value.showSignatureOnReceipt,
      defaultSchoolProfile.showSignatureOnReceipt,
    ),

    showBankDetailsOnReceipt: cleanBoolean(
      value.showBankDetailsOnReceipt,
      defaultSchoolProfile.showBankDetailsOnReceipt,
    ),

    showQrOnReceipt: cleanBoolean(
      value.showQrOnReceipt,
      defaultSchoolProfile.showQrOnReceipt,
    ),
  };
}

function buildUpdatedProfile(
  current: SchoolProfile,
  body: SchoolProfileRequestBody,
): SchoolProfile {
  return {
    schoolName:
      cleanText(body.schoolName) ||
      current.schoolName,

    centreName:
      cleanText(body.centreName) ||
      current.centreName,

    franchiseName:
      cleanText(body.franchiseName) ||
      current.franchiseName,

    schoolCode: cleanText(body.schoolCode),

    addressLine1:
      cleanText(body.addressLine1) ||
      current.addressLine1,

    addressLine2: cleanText(
      body.addressLine2,
    ),

    locality:
      cleanText(body.locality) ||
      current.locality,

    city:
      cleanText(body.city) ||
      current.city,

    state:
      cleanText(body.state) ||
      current.state,

    postalCode: cleanText(body.postalCode),

    googleMapUrl: cleanText(
      body.googleMapUrl,
    ),

    phone:
      cleanText(body.phone) ||
      current.phone,

    alternatePhone: cleanText(
      body.alternatePhone,
    ),

    whatsapp:
      cleanText(body.whatsapp) ||
      current.whatsapp,

    email:
      cleanText(body.email) ||
      current.email,

    website:
      cleanText(body.website) ||
      current.website,

    centreHeadName: cleanText(
      body.centreHeadName,
    ),

    centreHeadDesignation:
      cleanText(body.centreHeadDesignation) ||
      current.centreHeadDesignation,

    centreHeadPhone: cleanText(
      body.centreHeadPhone,
    ),

    centreHeadEmail: cleanText(
      body.centreHeadEmail,
    ),

    studentCapacity:
      parseStudentCapacity(
        body.studentCapacity,
      ) ?? current.studentCapacity,

    gstNumber: cleanText(body.gstNumber),
    panNumber: cleanText(body.panNumber),

    registrationNumber: cleanText(
      body.registrationNumber,
    ),

    udyamNumber: cleanText(body.udyamNumber),

    bankName: cleanText(body.bankName),
    accountName: cleanText(body.accountName),
    accountNumber: cleanText(
      body.accountNumber,
    ),
    ifscCode: cleanText(body.ifscCode),
    bankBranch: cleanText(body.bankBranch),
    upiId: cleanText(body.upiId),

    logoUrl: cleanText(body.logoUrl),
    whiteLogoUrl: cleanText(
      body.whiteLogoUrl,
    ),
    stampUrl: cleanText(body.stampUrl),
    signatureUrl: cleanText(
      body.signatureUrl,
    ),
    upiQrUrl: cleanText(body.upiQrUrl),

    receiptFooter:
      cleanText(body.receiptFooter) ||
      current.receiptFooter,

    receiptTerms: cleanTerms(
      body.receiptTerms,
      current.receiptTerms,
    ),

    showLogoOnReceipt: cleanBoolean(
      body.showLogoOnReceipt,
      current.showLogoOnReceipt,
    ),

    showStampOnReceipt: cleanBoolean(
      body.showStampOnReceipt,
      current.showStampOnReceipt,
    ),

    showSignatureOnReceipt: cleanBoolean(
      body.showSignatureOnReceipt,
      current.showSignatureOnReceipt,
    ),

    showBankDetailsOnReceipt: cleanBoolean(
      body.showBankDetailsOnReceipt,
      current.showBankDetailsOnReceipt,
    ),

    showQrOnReceipt: cleanBoolean(
      body.showQrOnReceipt,
      current.showQrOnReceipt,
    ),
  };
}

function validateProfile(profile: SchoolProfile) {
  if (!profile.schoolName) {
    return "School name is required.";
  }

  if (!profile.centreName) {
    return "Centre name is required.";
  }

  if (!profile.phone) {
    return "Contact number is required.";
  }

  if (!profile.email) {
    return "Email address is required.";
  }

  if (
    profile.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      profile.email,
    )
  ) {
    return "Please enter a valid school email address.";
  }

  if (
    profile.centreHeadEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      profile.centreHeadEmail,
    )
  ) {
    return "Please enter a valid centre-head email address.";
  }

  if (
    !Number.isInteger(profile.studentCapacity) ||
    profile.studentCapacity < 1 ||
    profile.studentCapacity > 10000
  ) {
    return "Student capacity must be a whole number between 1 and 10,000.";
  }

  if (
    profile.gstNumber &&
    profile.gstNumber.length > 30
  ) {
    return "GST number is too long.";
  }

  if (
    profile.panNumber &&
    profile.panNumber.length > 20
  ) {
    return "PAN number is too long.";
  }

  if (profile.receiptTerms.length > 20) {
    return "A maximum of 20 receipt terms is allowed.";
  }

  return "";
}

export async function GET() {
  try {
    const authenticated =
      await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorised.",
        },
        {
          status: 401,
        },
      );
    }

    const setting =
      await prisma.centreSetting.findUnique({
        where: {
          key: SCHOOL_PROFILE_KEY,
        },
      });

    const profile = normaliseStoredProfile(
      setting?.value ?? null,
    );

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error(
      "Unable to load school profile:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load the school profile.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const authenticated =
      await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorised.",
        },
        {
          status: 401,
        },
      );
    }

    let body: SchoolProfileRequestBody;

    try {
      body =
        (await request.json()) as SchoolProfileRequestBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid school-profile request.",
        },
        {
          status: 400,
        },
      );
    }

    if (!isRecord(body)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid school-profile request.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "studentCapacity",
      ) &&
      parseStudentCapacity(
        body.studentCapacity,
      ) === null
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Student capacity must be a whole number between 1 and 10,000.",
        },
        {
          status: 400,
        },
      );
    }

    const existing =
      await prisma.centreSetting.findUnique({
        where: {
          key: SCHOOL_PROFILE_KEY,
        },
      });

    const currentProfile =
      normaliseStoredProfile(
        existing?.value ?? null,
      );

    const updatedProfile = buildUpdatedProfile(
      currentProfile,
      body,
    );

    const validationMessage =
      validateProfile(updatedProfile);

    if (validationMessage) {
      return NextResponse.json(
        {
          success: false,
          message: validationMessage,
        },
        {
          status: 400,
        },
      );
    }

    const setting =
      await prisma.centreSetting.upsert({
        where: {
          key: SCHOOL_PROFILE_KEY,
        },

        create: {
          key: SCHOOL_PROFILE_KEY,

          value:
            updatedProfile as unknown as Prisma.InputJsonValue,

          description:
            "Master school, branding, contact, banking and receipt settings.",
        },

        update: {
          value:
            updatedProfile as unknown as Prisma.InputJsonValue,

          description:
            "Master school, branding, contact, banking and receipt settings.",
        },
      });

    return NextResponse.json({
      success: true,

      message:
        "School information saved successfully.",

      profile: normaliseStoredProfile(
        setting.value,
      ),
    });
  } catch (error) {
    console.error(
      "Unable to update school profile:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to save the school profile. Check the server terminal.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
  try {
    const authenticated =
      await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorised.",
        },
        {
          status: 401,
        },
      );
    }

    const formData = await request.formData();
    const fieldValue = formData.get("field");
    const fileValue = formData.get("file");

    if (!isDocumentImageField(fieldValue)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please choose a valid document image position.",
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
          message: "Please select a JPG or PNG image.",
        },
        {
          status: 400,
        },
      );
    }

    if (!ALLOWED_DOCUMENT_IMAGE_TYPES.has(fileValue.type)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only JPG and PNG images can be used on receipts and official documents.",
        },
        {
          status: 400,
        },
      );
    }

    if (fileValue.size === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "The selected image is empty.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      fileValue.size >
      MAX_DOCUMENT_IMAGE_SIZE_BYTES
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The image is too large. Please use a JPG or PNG smaller than 8 MB.",
        },
        {
          status: 400,
        },
      );
    }

    const uploadedAsset =
      await sanityServerClient.assets.upload(
        "image",
        Buffer.from(
          await fileValue.arrayBuffer(),
        ),
        {
          filename:
            fileValue.name.trim() ||
            `${fieldValue}.png`,
          contentType: fileValue.type,
        },
      );

    const existing =
      await prisma.centreSetting.findUnique({
        where: {
          key: SCHOOL_PROFILE_KEY,
        },
      });

    const currentProfile =
      normaliseStoredProfile(
        existing?.value ?? null,
      );

    const updatedProfile: SchoolProfile = {
      ...currentProfile,
      [fieldValue]: uploadedAsset.url,
    };

    const setting =
      await prisma.centreSetting.upsert({
        where: {
          key: SCHOOL_PROFILE_KEY,
        },

        create: {
          key: SCHOOL_PROFILE_KEY,
          value:
            updatedProfile as unknown as Prisma.InputJsonValue,
          description:
            "Master school, branding, contact, banking and receipt settings.",
        },

        update: {
          value:
            updatedProfile as unknown as Prisma.InputJsonValue,
          description:
            "Master school, branding, contact, banking and receipt settings.",
        },
      });

    return NextResponse.json({
      success: true,
      message: `${DOCUMENT_IMAGE_FIELDS[fieldValue]} uploaded and saved.`,
      field: fieldValue,
      imageUrl: uploadedAsset.url,
      profile: normaliseStoredProfile(
        setting.value,
      ),
    });
  } catch (error) {
    console.error(
      "Unable to upload school document image:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "The image could not be uploaded. Check the server terminal.",
      },
      {
        status: 500,
      },
    );
  }
}
