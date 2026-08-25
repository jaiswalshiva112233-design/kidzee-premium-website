import type { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { after, NextResponse } from "next/server";

import {
  getAdminSession,
  hasAdminPermission,
  isAdminAuthenticated,
} from "@/lib/admin/auth";
import { safeFirestoreMirror } from "@/lib/firebase/firestoreRest";
import { prisma } from "@/lib/prisma";
import { sanityServerClient } from "@/lib/sanity/serverClient";
import { logServerError } from "@/lib/server/safeLogging";
import { site } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SETTINGS_ID = "website-seo-settings";
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const pageDefinitions = [
  {
    pageKey: "home",
    label: "Homepage",
    path: "/",
    fallbackTitle: "Kidzee Preschool & Daycare in Sector 12 Dwarka",
    fallbackDescription:
      "Explore Playgroup, Nursery, Junior KG, Senior KG and daycare until 7 PM at Kidzee Preschool in Sector 12B, Dwarka. Book a school visit.",
    fallbackKeywords: [
      "preschool in Sector 12 Dwarka",
      "Kidzee Sector 12 Dwarka",
      "daycare in Sector 12 Dwarka",
    ],
    fallbackSocialImage: "/images/hero/hero-main.jpg",
  },
  {
    pageKey: "about",
    label: "About",
    path: "/about",
    fallbackTitle: "About Our Preschool",
    fallbackDescription:
      "Learn about Kidzee Preschool & Daycare in Sector 12B, Dwarka, our learning approach, classroom environment, facilities, safety practices and partnership with parents.",
    fallbackKeywords: [
      "Kidzee Sector 12 Dwarka",
      "preschool in Dwarka",
      "early childhood education Dwarka",
    ],
    fallbackSocialImage: "/images/hero/about-main.jpg",
  },
  {
    pageKey: "programmes",
    label: "Programmes",
    path: "/programmes",
    fallbackTitle: "Preschool Programmes",
    fallbackDescription:
      "Explore Playgroup, Nursery, Junior KG and Senior KG programmes at Kidzee Sector 12, Dwarka, including age groups, learning approach and school readiness.",
    fallbackKeywords: [
      "preschool programmes in Dwarka",
      "Playgroup in Sector 12 Dwarka",
      "Nursery in Sector 12 Dwarka",
      "Junior KG in Dwarka",
      "Senior KG in Dwarka",
    ],
    fallbackSocialImage: "/images/programmes/playgroup.jpg",
  },
  {
    pageKey: "daycare",
    label: "Daycare",
    path: "/daycare",
    fallbackTitle: "Daycare in Dwarka",
    fallbackDescription:
      "Daycare at Kidzee Sector 12B, Dwarka from 12:30 PM to 7:00 PM, with time for lunch, rest, play, creative activities and homework support.",
    fallbackKeywords: [
      "daycare in Sector 12 Dwarka",
      "daycare in Dwarka",
      "daycare till 7 PM Dwarka",
    ],
    fallbackSocialImage: "/images/daycare/daycare-main.jpg",
  },
  {
    pageKey: "gallery",
    label: "Gallery",
    path: "/gallery",
    fallbackTitle: "Preschool Gallery",
    fallbackDescription:
      "Explore real classroom activities, celebrations, creative learning, parent stories and play moments from Kidzee Preschool & Daycare, Sector 12 Dwarka.",
    fallbackKeywords: [
      "Kidzee Sector 12 Dwarka gallery",
      "preschool activities Dwarka",
      "preschool classroom photos Dwarka",
    ],
    fallbackSocialImage: "/images/gallery/gallery-featured.jpg",
  },
  {
    pageKey: "admissions",
    label: "Admissions",
    path: "/admissions",
    fallbackTitle: "Preschool Admissions",
    fallbackDescription:
      "Enquire about Playgroup, Nursery, Junior KG, Senior KG and daycare admissions at Kidzee Sector 12, Dwarka. Book a school visit or three-day trial.",
    fallbackKeywords: [
      "preschool admission Sector 12 Dwarka",
      "Kidzee admission Dwarka",
      "nursery admission Dwarka",
      "playgroup admission Dwarka",
    ],
    fallbackSocialImage: "/images/hero/hero-classroom.jpg",
  },
  {
    pageKey: "contact",
    label: "Contact",
    path: "/contact",
    fallbackTitle: "Contact & School Visits",
    fallbackDescription:
      "Contact Kidzee Preschool & Daycare in Sector 12B, Dwarka. Call or WhatsApp +91 96670 38673 to book a school visit or three-day trial.",
    fallbackKeywords: [
      "contact Kidzee Sector 12 Dwarka",
      "preschool enquiry Dwarka",
      "daycare enquiry Dwarka",
    ],
    fallbackSocialImage: "/images/hero/hero-building.jpg",
  },
  {
    pageKey: "blog",
    label: "Parent Resources",
    path: "/blog",
    fallbackTitle: "Parent Resources",
    fallbackDescription:
      "Explore practical early-years guidance from Kidzee Sector 12, Dwarka, including preschool readiness, routines, play-based learning and child development.",
    fallbackKeywords: [
      "preschool parenting tips",
      "preschool readiness guide",
      "parent resources Dwarka",
    ],
    fallbackSocialImage: "/images/hero/hero-classroom.jpg",
  },
] as const;

type PageKey = (typeof pageDefinitions)[number]["pageKey"];

type ImageReference = {
  _type: "image";
  asset: {
    _type: "reference";
    _ref: string;
  };
};

type StoredSeoPage = {
  _key: string;
  _type: "websiteSeoPage";
  pageKey: PageKey;
  seoTitle: string;
  metaDescription: string;
  keywords: string[];
  socialImage?: ImageReference;
  socialImageAlt: string;
};

type SeoSettingsDocument = {
  _id: string;
  _type: "websiteSeoSettings";
  pages: StoredSeoPage[];
  updatedAt: string | null;
};

type SeoPageResponse = {
  pageKey: PageKey;
  label: string;
  path: string;
  seoTitle: string;
  metaDescription: string;
  keywords: string[];
  socialImageUrl: string;
  socialImageAlt: string;
  hasCustomSocialImage: boolean;
};

type StoredSeoPageProjection = StoredSeoPage & {
  socialImageUrl?: string | null;
};

type SeoDocumentProjection = Omit<SeoSettingsDocument, "pages"> & {
  pages: StoredSeoPageProjection[];
};

type UpdatePageInput = {
  pageKey?: unknown;
  seoTitle?: unknown;
  metaDescription?: unknown;
  keywords?: unknown;
  socialImageAlt?: unknown;
};

function revisionPageSnapshot(page: StoredSeoPage): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify({
      pageKey: page.pageKey,
      seoTitle: page.seoTitle,
      metaDescription: page.metaDescription,
      keywords: page.keywords,
      socialImage: page.socialImage ?? null,
      socialImageAlt: page.socialImageAlt,
    }),
  ) as Prisma.InputJsonValue;
}

function storedPageFromRevision(value: Prisma.JsonValue): StoredSeoPage | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const page = value as Record<string, unknown>;
  if (!isPageKey(page.pageKey)) return null;
  return {
    _key: page.pageKey,
    _type: "websiteSeoPage",
    pageKey: page.pageKey,
    seoTitle: cleanText(page.seoTitle, 70),
    metaDescription: cleanText(page.metaDescription, 180),
    keywords: Array.isArray(page.keywords)
      ? page.keywords.map((item) => cleanText(item, 60)).filter(Boolean).slice(0, 12)
      : [],
    socialImage:
      page.socialImage && typeof page.socialImage === "object" && !Array.isArray(page.socialImage)
        ? (page.socialImage as ImageReference)
        : undefined,
    socialImageAlt: cleanText(page.socialImageAlt, 140),
  };
}

function comparablePage(page: StoredSeoPage) {
  return JSON.stringify(revisionPageSnapshot(page));
}

function serialiseRevision(revision: {
  id: string;
  pageKey: string;
  status: string;
  currentData: Prisma.JsonValue;
  proposedData: Prisma.JsonValue;
  appliedAt: Date;
  undoneAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: revision.id,
    pageKey: revision.pageKey,
    status: revision.status,
    currentData: revision.currentData,
    proposedData: revision.proposedData,
    appliedAt: revision.appliedAt.toISOString(),
    undoneAt: revision.undoneAt?.toISOString() ?? null,
    createdAt: revision.createdAt.toISOString(),
  };
}

async function loadRecentRevisions() {
  const revisions = await prisma.aiSeoRevision.findMany({
    where: { status: { in: ["APPLIED", "UNDONE"] } },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: {
      id: true,
      pageKey: true,
      status: true,
      currentData: true,
      proposedData: true,
      appliedAt: true,
      undoneAt: true,
      createdAt: true,
    },
  });

  return revisions.map(serialiseRevision);
}

const pageKeySet = new Set<string>(
  pageDefinitions.map((page) => page.pageKey),
);

function noStoreJson(
  body: Record<string, unknown>,
  status = 200,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}

function cleanText(value: unknown, maximumLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximumLength);
}

function isPageKey(value: unknown): value is PageKey {
  return typeof value === "string" && pageKeySet.has(value);
}

function hasAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  const allowedOrigins = new Set<string>([new URL(request.url).origin]);

  try {
    allowedOrigins.add(new URL(site.url).origin);
  } catch {
    // The current request origin is still checked.
  }

  return allowedOrigins.has(origin);
}

async function requireWebsiteManager() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return {
      allowed: false as const,
      response: noStoreJson(
        {
          success: false,
          message: "You are not authorised.",
        },
        401,
      ),
    };
  }

  const allowed = await hasAdminPermission("website.manage");

  if (!allowed) {
    return {
      allowed: false as const,
      response: noStoreJson(
        {
          success: false,
          message:
            "You do not have permission to manage website SEO settings.",
        },
        403,
      ),
    };
  }

  return {
    allowed: true as const,
  };
}

function createDefaultStoredPage(
  page: (typeof pageDefinitions)[number],
): StoredSeoPage {
  return {
    _key: page.pageKey,
    _type: "websiteSeoPage",
    pageKey: page.pageKey,
    seoTitle: page.fallbackTitle,
    metaDescription: page.fallbackDescription,
    keywords: [...page.fallbackKeywords],
    socialImageAlt: `${page.label} at ${site.shortName}`,
  };
}

function createDefaultDocument(): SeoSettingsDocument {
  return {
    _id: SETTINGS_ID,
    _type: "websiteSeoSettings",
    pages: pageDefinitions.map(createDefaultStoredPage),
    updatedAt: null,
  };
}

async function loadStoredDocument(): Promise<SeoSettingsDocument> {
  const document = await sanityServerClient.fetch<
    SeoSettingsDocument | null
  >(
    `*[
      _id == $settingsId &&
      _type == "websiteSeoSettings"
    ][0] {
      _id,
      _type,
      pages,
      updatedAt
    }`,
    {
      settingsId: SETTINGS_ID,
    },
  );

  if (!document) {
    return createDefaultDocument();
  }

  const storedByKey = new Map(
    (Array.isArray(document.pages) ? document.pages : [])
      .filter((page) => isPageKey(page.pageKey))
      .map((page) => [page.pageKey, page]),
  );

  return {
    _id: SETTINGS_ID,
    _type: "websiteSeoSettings",
    pages: pageDefinitions.map((definition) => {
      const fallback = createDefaultStoredPage(definition);
      const stored = storedByKey.get(definition.pageKey);

      if (!stored) {
        return fallback;
      }

      return {
        ...fallback,
        ...stored,
        _key: definition.pageKey,
        _type: "websiteSeoPage",
        pageKey: definition.pageKey,
        keywords: Array.isArray(stored.keywords)
          ? stored.keywords
          : fallback.keywords,
      };
    }),
    updatedAt: document.updatedAt ?? null,
  };
}

async function loadResponsePages(): Promise<{
  pages: SeoPageResponse[];
  updatedAt: string | null;
}> {
  const document = await sanityServerClient.fetch<
    SeoDocumentProjection | null
  >(
    `*[
      _id == $settingsId &&
      _type == "websiteSeoSettings"
    ][0] {
      _id,
      _type,
      pages[] {
        _key,
        _type,
        pageKey,
        seoTitle,
        metaDescription,
        keywords,
        socialImage,
        socialImageAlt,
        "socialImageUrl": socialImage.asset->url
      },
      updatedAt
    }`,
    {
      settingsId: SETTINGS_ID,
    },
  );

  const storedByKey = new Map(
    (Array.isArray(document?.pages) ? document.pages : [])
      .filter((page) => isPageKey(page.pageKey))
      .map((page) => [page.pageKey, page]),
  );

  const pages = pageDefinitions.map((definition): SeoPageResponse => {
    const stored = storedByKey.get(definition.pageKey);

    return {
      pageKey: definition.pageKey,
      label: definition.label,
      path: definition.path,
      seoTitle:
        cleanText(stored?.seoTitle, 70) || definition.fallbackTitle,
      metaDescription:
        cleanText(stored?.metaDescription, 180) ||
        definition.fallbackDescription,
      keywords:
        Array.isArray(stored?.keywords) && stored.keywords.length > 0
          ? stored.keywords
              .map((keyword) => cleanText(keyword, 60))
              .filter(Boolean)
              .slice(0, 12)
          : [...definition.fallbackKeywords],
      socialImageUrl:
        stored?.socialImageUrl || definition.fallbackSocialImage,
      socialImageAlt:
        cleanText(stored?.socialImageAlt, 140) ||
        `${definition.label} at ${site.shortName}`,
      hasCustomSocialImage: Boolean(stored?.socialImageUrl),
    };
  });

  return {
    pages,
    updatedAt: document?.updatedAt ?? null,
  };
}

function revalidatePublicPages() {
  for (const page of pageDefinitions) {
    revalidatePath(page.path);
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/website/seo");
}

function validatePageInput(
  input: UpdatePageInput,
  existing: StoredSeoPage,
) {
  if (!isPageKey(input.pageKey)) {
    return {
      page: null,
      error: "A website page selection is invalid.",
    };
  }

  const definition = pageDefinitions.find(
    (page) => page.pageKey === input.pageKey,
  );

  if (!definition) {
    return {
      page: null,
      error: "A website page selection is invalid.",
    };
  }

  const seoTitle = cleanText(input.seoTitle, 70);
  const metaDescription = cleanText(input.metaDescription, 180);

  if (seoTitle.length < 20) {
    return {
      page: null,
      error: `${definition.label}: the search title must contain at least 20 characters.`,
    };
  }

  if (metaDescription.length < 70) {
    return {
      page: null,
      error: `${definition.label}: the search description must contain at least 70 characters.`,
    };
  }

  const keywordValues = Array.isArray(input.keywords)
    ? input.keywords
    : typeof input.keywords === "string"
      ? input.keywords.split(",")
      : [];

  const keywords = Array.from(
    new Set(
      keywordValues
        .map((keyword) => cleanText(keyword, 60).toLowerCase())
        .filter((keyword) => keyword.length >= 2),
    ),
  ).slice(0, 12);

  if (keywords.length === 0) {
    return {
      page: null,
      error: `${definition.label}: add at least one relevant search topic.`,
    };
  }

  const socialImageAlt = cleanText(input.socialImageAlt, 140);

  return {
    page: {
      ...existing,
      _key: definition.pageKey,
      _type: "websiteSeoPage" as const,
      pageKey: definition.pageKey,
      seoTitle,
      metaDescription,
      keywords,
      socialImageAlt:
        socialImageAlt || `${definition.label} at ${site.shortName}`,
    },
    error: "",
  };
}

export async function GET() {
  try {
    const access = await requireWebsiteManager();

    if (!access.allowed) {
      return access.response;
    }

    const [settings, revisions] = await Promise.all([
      loadResponsePages(),
      loadRecentRevisions(),
    ]);

    return noStoreJson({
      success: true,
      ...settings,
      websiteUrl: site.url,
      revisions,
    });
  } catch (error) {
    logServerError("Unable to load website SEO settings.", error);

    return noStoreJson(
      {
        success: false,
        message:
          "Website SEO settings could not be loaded. Check the server terminal.",
      },
      500,
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const access = await requireWebsiteManager();

    if (!access.allowed) {
      return access.response;
    }

    const session = await getAdminSession();

    if (!hasAllowedOrigin(request)) {
      return noStoreJson(
        {
          success: false,
          message: "This SEO settings request is not allowed.",
        },
        403,
      );
    }

    const body = (await request.json()) as {
      pages?: unknown;
    };

    if (!Array.isArray(body.pages) || body.pages.length === 0) {
      return noStoreJson(
        {
          success: false,
          message: "No website SEO changes were supplied.",
        },
        400,
      );
    }

    const document = await loadStoredDocument();
    const currentByKey = new Map(
      document.pages.map((page) => [page.pageKey, page]),
    );
    const updates = new Map<PageKey, StoredSeoPage>();

    for (const rawInput of body.pages) {
      if (!rawInput || typeof rawInput !== "object") {
        return noStoreJson(
          {
            success: false,
            message: "A website SEO entry is invalid.",
          },
          400,
        );
      }

      const input = rawInput as UpdatePageInput;

      if (!isPageKey(input.pageKey)) {
        return noStoreJson(
          {
            success: false,
            message: "A website page selection is invalid.",
          },
          400,
        );
      }

      if (updates.has(input.pageKey)) {
        return noStoreJson(
          {
            success: false,
            message: "The same website page was supplied more than once.",
          },
          400,
        );
      }

      const existing = currentByKey.get(input.pageKey);

      if (!existing) {
        return noStoreJson(
          {
            success: false,
            message: "A website SEO entry could not be found.",
          },
          400,
        );
      }

      const validated = validatePageInput(input, existing);

      if (!validated.page) {
        return noStoreJson(
          {
            success: false,
            message: validated.error,
          },
          400,
        );
      }

      updates.set(input.pageKey, validated.page);
    }

    const updatedAt = new Date().toISOString();
    const pendingRevisions = await prisma.$transaction(
      [...updates.entries()].map(([pageKey, proposedPage]) =>
        prisma.aiSeoRevision.create({
          data: {
            pageKey,
            status: "PENDING",
            currentData: revisionPageSnapshot(currentByKey.get(pageKey)!),
            proposedData: revisionPageSnapshot(proposedPage),
            evidence: {
              source: "website-seo-manager",
              note: "The current and proposed search preview was available before Save.",
            },
            createdById: session?.userId ?? null,
          },
        }),
      ),
    );

    try {
      await sanityServerClient.createOrReplace({
        ...document,
        pages: document.pages.map(
          (page) => updates.get(page.pageKey) ?? page,
        ),
        updatedAt,
      });
    } catch (error) {
      await prisma.aiSeoRevision.updateMany({
        where: { id: { in: pendingRevisions.map((revision) => revision.id) } },
        data: { status: "FAILED" },
      });
      throw error;
    }

    await prisma.aiSeoRevision.updateMany({
      where: { id: { in: pendingRevisions.map((revision) => revision.id) } },
      data: { status: "APPLIED", appliedAt: new Date() },
    });

    after(async () => {
      await Promise.all(
        pendingRevisions.map((revision) =>
          safeFirestoreMirror("aiRevisionHistory", revision.id, {
            ...revision,
            status: "APPLIED",
            appliedAt: new Date(),
          }),
        ),
      );
    });

    revalidatePublicPages();

    const [settings, revisions] = await Promise.all([
      loadResponsePages(),
      loadRecentRevisions(),
    ]);

    return noStoreJson({
      success: true,
      message: "Website SEO details have been saved.",
      ...settings,
      revisions,
    });
  } catch (error) {
    logServerError("Unable to save website SEO settings.", error);

    return noStoreJson(
      {
        success: false,
        message:
          "Website SEO settings could not be saved. Check the server terminal.",
      },
      500,
    );
  }
}

export async function PUT(request: Request) {
  try {
    const access = await requireWebsiteManager();
    if (!access.allowed) return access.response;
    if (!hasAllowedOrigin(request)) {
      return noStoreJson(
        { success: false, message: "This SEO revision request is not allowed." },
        403,
      );
    }

    const body = (await request.json()) as { revisionId?: unknown };
    const revisionId = cleanText(body.revisionId, 100);
    if (!revisionId) {
      return noStoreJson(
        { success: false, message: "Select an SEO revision to undo." },
        400,
      );
    }

    const revision = await prisma.aiSeoRevision.findUnique({
      where: { id: revisionId },
    });
    if (!revision || revision.status !== "APPLIED") {
      return noStoreJson(
        { success: false, message: "This SEO revision cannot be undone." },
        409,
      );
    }

    const previousPage = storedPageFromRevision(revision.currentData);
    const proposedPage = storedPageFromRevision(revision.proposedData);
    if (!previousPage || !proposedPage || previousPage.pageKey !== proposedPage.pageKey) {
      return noStoreJson(
        { success: false, message: "The saved SEO revision is incomplete." },
        409,
      );
    }

    const document = await loadStoredDocument();
    const currentPage = document.pages.find((page) => page.pageKey === revision.pageKey);
    if (!currentPage) {
      return noStoreJson(
        { success: false, message: "The website page no longer exists." },
        409,
      );
    }
    if (comparablePage(currentPage) !== comparablePage(proposedPage)) {
      return noStoreJson(
        {
          success: false,
          message:
            "This page changed after the selected revision. Undo was stopped to protect the newer content.",
        },
        409,
      );
    }

    const updatedAt = new Date().toISOString();
    await sanityServerClient.createOrReplace({
      ...document,
      pages: document.pages.map((page) =>
        page.pageKey === previousPage.pageKey ? previousPage : page,
      ),
      updatedAt,
    });
    const updatedRevision = await prisma.aiSeoRevision.update({
      where: { id: revision.id },
      data: { status: "UNDONE", undoneAt: new Date() },
    });
    after(async () => {
      await safeFirestoreMirror("aiRevisionHistory", updatedRevision.id, updatedRevision);
    });
    revalidatePublicPages();
    const [settings, revisions] = await Promise.all([
      loadResponsePages(),
      loadRecentRevisions(),
    ]);
    return noStoreJson({
      success: true,
      message: "The SEO change was undone safely.",
      ...settings,
      revision: serialiseRevision(updatedRevision),
      revisions,
    });
  } catch (error) {
    logServerError("Unable to undo website SEO revision.", error);
    return noStoreJson(
      {
        success: false,
        message: "The SEO change could not be undone. Check the server terminal.",
      },
      500,
    );
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireWebsiteManager();

    if (!access.allowed) {
      return access.response;
    }

    if (!hasAllowedOrigin(request)) {
      return noStoreJson(
        {
          success: false,
          message: "This social-image request is not allowed.",
        },
        403,
      );
    }

    const formData = await request.formData();
    const pageKeyValue = formData.get("pageKey");
    const fileValue = formData.get("file");
    const altTextValue = formData.get("altText");

    if (!isPageKey(pageKeyValue)) {
      return noStoreJson(
        {
          success: false,
          message: "Select a valid website page.",
        },
        400,
      );
    }

    if (!(fileValue instanceof File)) {
      return noStoreJson(
        {
          success: false,
          message: "Select a social-sharing image.",
        },
        400,
      );
    }

    if (!ALLOWED_IMAGE_TYPES.has(fileValue.type)) {
      return noStoreJson(
        {
          success: false,
          message: "Upload a JPG, PNG or WebP image.",
        },
        400,
      );
    }

    if (fileValue.size === 0 || fileValue.size > MAX_IMAGE_SIZE_BYTES) {
      return noStoreJson(
        {
          success: false,
          message: "The image must be larger than 0 bytes and no more than 8 MB.",
        },
        400,
      );
    }

    const definition = pageDefinitions.find(
      (page) => page.pageKey === pageKeyValue,
    );

    if (!definition) {
      return noStoreJson(
        {
          success: false,
          message: "Select a valid website page.",
        },
        400,
      );
    }

    const arrayBuffer = await fileValue.arrayBuffer();
    const uploadedAsset = await sanityServerClient.assets.upload(
      "image",
      Buffer.from(arrayBuffer),
      {
        filename: fileValue.name,
        contentType: fileValue.type,
      },
    );

    const document = await loadStoredDocument();
    const updatedAt = new Date().toISOString();
    const socialImageAlt =
      cleanText(altTextValue, 140) ||
      `${definition.label} at ${site.shortName}`;

    await sanityServerClient.createOrReplace({
      ...document,
      pages: document.pages.map((page) =>
        page.pageKey === pageKeyValue
          ? {
              ...page,
              socialImage: {
                _type: "image" as const,
                asset: {
                  _type: "reference" as const,
                  _ref: uploadedAsset._id,
                },
              },
              socialImageAlt,
            }
          : page,
      ),
      updatedAt,
    });

    revalidatePublicPages();

    const settings = await loadResponsePages();

    return noStoreJson({
      success: true,
      message: `${definition.label} sharing image has been updated.`,
      ...settings,
    });
  } catch (error) {
    logServerError("Unable to upload the website sharing image.", error);

    return noStoreJson(
      {
        success: false,
        message:
          "The sharing image could not be uploaded. Check the server terminal.",
      },
      500,
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const access = await requireWebsiteManager();

    if (!access.allowed) {
      return access.response;
    }

    if (!hasAllowedOrigin(request)) {
      return noStoreJson(
        {
          success: false,
          message: "This social-image request is not allowed.",
        },
        403,
      );
    }

    const pageKey = new URL(request.url).searchParams.get("pageKey");

    if (!isPageKey(pageKey)) {
      return noStoreJson(
        {
          success: false,
          message: "Select a valid website page.",
        },
        400,
      );
    }

    const definition = pageDefinitions.find(
      (page) => page.pageKey === pageKey,
    );
    const document = await loadStoredDocument();
    const updatedAt = new Date().toISOString();

    await sanityServerClient.createOrReplace({
      ...document,
      pages: document.pages.map((page) => {
        if (page.pageKey !== pageKey) {
          return page;
        }

        const { socialImage: _removedImage, ...pageWithoutImage } = page;

        return pageWithoutImage;
      }),
      updatedAt,
    });

    revalidatePublicPages();

    const settings = await loadResponsePages();

    return noStoreJson({
      success: true,
      message: `${definition?.label ?? "Page"} now uses its default sharing image.`,
      ...settings,
    });
  } catch (error) {
    logServerError("Unable to remove the website sharing image.", error);

    return noStoreJson(
      {
        success: false,
        message:
          "The sharing image could not be removed. Check the server terminal.",
      },
      500,
    );
  }
}
