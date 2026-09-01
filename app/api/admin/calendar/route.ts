import { createHash } from "node:crypto";

import type { $Enums } from "@/generated/prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin/auth";
import { importKidzeeCalendarPdf } from "@/lib/admin/calendar-import";
import { publicPersistenceError } from "@/lib/admin/public-persistence-error";
import { prisma } from "@/lib/prisma";

const MAX_CALENDAR_SIZE = 12 * 1024 * 1024;

class CalendarRequestError extends Error {}
const SAFE_CALENDAR_IMPORT_MESSAGES = new Set([
  "The uploaded file is not a valid PDF calendar.",
  "The PDF does not contain readable calendar pages.",
  "No Delhi/NCR holiday rows could be read. Upload a text-based Kidzee PDF or add events manually.",
]);
const EVENT_TYPES: readonly $Enums.CalendarEventType[] = [
  "ACADEMIC",
  "ACTIVITY",
  "CELEBRATION",
  "HOLIDAY",
  "MEETING",
  "DEADLINE",
  "OTHER",
];

type CalendarRequestBody = {
  action?: unknown;
  year?: unknown;
  eventId?: unknown;
  title?: unknown;
  eventType?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  allDay?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  programmes?: unknown;
  description?: unknown;
};

type PreschoolTemplateEvent = {
  title: string;
  eventType: $Enums.CalendarEventType;
  startDate: Date;
  description: string;
};

function canViewCalendar(
  session: Awaited<ReturnType<typeof getAdminSession>>,
) {
  return Boolean(
    session &&
      (session.role === "OWNER" ||
        session.permissions.includes("*") ||
        session.permissions.includes("dashboard.view")),
  );
}

function canManageCalendar(
  session: Awaited<ReturnType<typeof getAdminSession>>,
) {
  return Boolean(
    session &&
      (session.role === "OWNER" ||
        session.permissions.includes("*") ||
        session.permissions.includes("centre.settings")),
  );
}

function cleanText(value: unknown, maximumLength = 250) {
  return typeof value === "string"
    ? value.trim().slice(0, maximumLength)
    : "";
}

function parseDate(value: unknown, endOfDay = false) {
  const text = cleanText(value, 40);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return null;
  }

  const date = new Date(
    `${text}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}+05:30`,
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatEvent(event: {
  id: string;
  title: string;
  eventType: $Enums.CalendarEventType;
  startDate: Date;
  endDate: Date | null;
  allDay: boolean;
  startTime: string | null;
  endTime: string | null;
  programmes: $Enums.Programme[];
  description: string | null;
  documentId: string | null;
  active: boolean;
}) {
  return {
    ...event,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate?.toISOString() ?? null,
  };
}

function isCalendarEventType(
  value: string,
): value is $Enums.CalendarEventType {
  return EVENT_TYPES.includes(value as $Enums.CalendarEventType);
}

function parseProgrammes(value: unknown) {
  const programmes = Array.isArray(value) ? value : [];
  const allowed: readonly $Enums.Programme[] = [
    "PLAYGROUP",
    "NURSERY",
    "JUNIOR_KG",
    "SENIOR_KG",
    "DAYCARE",
  ];

  return programmes.filter(
    (programme): programme is $Enums.Programme =>
      typeof programme === "string" &&
      allowed.includes(programme as $Enums.Programme),
  );
}

function indiaCalendarDate(year: number, month: number, day: number) {
  return new Date(
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00.000+05:30`,
  );
}

function nthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  occurrence: number,
) {
  const first = indiaCalendarDate(year, month, 1);
  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const firstWeekdayName = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
  }).format(first);
  const firstWeekday = Math.max(0, weekdayNames.indexOf(firstWeekdayName));
  const day = 1 + ((weekday - firstWeekday + 7) % 7) + (occurrence - 1) * 7;
  return indiaCalendarDate(year, month, day);
}

function preschoolYearTemplate(year: number): PreschoolTemplateEvent[] {
  return [
    {
      title: "New Year Celebration",
      eventType: "CELEBRATION",
      startDate: indiaCalendarDate(year, 1, 1),
      description: "Welcome circle, new-year wishes and a simple classroom resolution activity.",
    },
    {
      title: "Lohri Celebration",
      eventType: "CELEBRATION",
      startDate: indiaCalendarDate(year, 1, 13),
      description: "Punjabi folk music, seasonal learning and a child-safe Lohri-themed craft.",
    },
    {
      title: "Makar Sankranti / Pongal",
      eventType: "CELEBRATION",
      startDate: indiaCalendarDate(year, 1, 14),
      description: "Harvest-festival story, kite craft and age-appropriate cultural learning.",
    },
    {
      title: "Republic Day Celebration",
      eventType: "CELEBRATION",
      startDate: indiaCalendarDate(year, 1, 26),
      description: "Tricolour activity, patriotic assembly and an introduction to India and the Constitution.",
    },
    {
      title: "National Science Day",
      eventType: "ACTIVITY",
      startDate: indiaCalendarDate(year, 2, 28),
      description: "Simple supervised experiments, observation games and curiosity-based learning.",
    },
    {
      title: "International Women's Day",
      eventType: "CELEBRATION",
      startDate: indiaCalendarDate(year, 3, 8),
      description: "Celebrate mothers, teachers and women role models through stories and gratitude cards.",
    },
    {
      title: "World Water Day",
      eventType: "ACTIVITY",
      startDate: indiaCalendarDate(year, 3, 22),
      description: "Water-saving habits, a blue-themed activity and an age-appropriate conservation story.",
    },
    {
      title: "World Health Day",
      eventType: "ACTIVITY",
      startDate: indiaCalendarDate(year, 4, 7),
      description: "Healthy food, handwashing, exercise and personal-hygiene activities.",
    },
    {
      title: "Baisakhi Celebration",
      eventType: "CELEBRATION",
      startDate: indiaCalendarDate(year, 4, 14),
      description: "Harvest learning, Punjabi music and a bright traditional-theme celebration.",
    },
    {
      title: "Earth Day",
      eventType: "ACTIVITY",
      startDate: indiaCalendarDate(year, 4, 22),
      description: "Plant care, recycling craft and a promise to keep the Earth clean.",
    },
    {
      title: "Labour Day / Community Helpers Day",
      eventType: "ACTIVITY",
      startDate: indiaCalendarDate(year, 5, 1),
      description: "Recognise helpers at school and in the neighbourhood through role play and thank-you cards.",
    },
    {
      title: "Mother's Day Celebration",
      eventType: "CELEBRATION",
      startDate: nthWeekdayOfMonth(year, 5, 0, 2),
      description: "Mother-child activity, gratitude keepsake and family celebration. Adjust to a working day if required.",
    },
    {
      title: "International Day of Families",
      eventType: "CELEBRATION",
      startDate: indiaCalendarDate(year, 5, 15),
      description: "Family-photo conversation, inclusive family stories and a family-tree craft.",
    },
    {
      title: "World Environment Day",
      eventType: "ACTIVITY",
      startDate: indiaCalendarDate(year, 6, 5),
      description: "Green habits, plantation activity and an age-appropriate environment pledge.",
    },
    {
      title: "Father's Day Celebration",
      eventType: "CELEBRATION",
      startDate: nthWeekdayOfMonth(year, 6, 0, 3),
      description: "Father-child activity and gratitude keepsake. Adjust to a working day if required.",
    },
    {
      title: "International Yoga Day",
      eventType: "ACTIVITY",
      startDate: indiaCalendarDate(year, 6, 21),
      description: "Short child-friendly yoga, breathing and mindfulness session.",
    },
    {
      title: "National Doctors' Day",
      eventType: "ACTIVITY",
      startDate: indiaCalendarDate(year, 7, 1),
      description: "Doctor role play, health-and-safety learning and gratitude for medical professionals.",
    },
    {
      title: "Kargil Vijay Diwas",
      eventType: "CELEBRATION",
      startDate: indiaCalendarDate(year, 7, 26),
      description: "Age-appropriate tribute to courage, service and the Indian Armed Forces.",
    },
    {
      title: "International Tiger Day",
      eventType: "ACTIVITY",
      startDate: indiaCalendarDate(year, 7, 29),
      description: "Wildlife story, tiger craft and simple conservation learning.",
    },
    {
      title: "Friendship Day",
      eventType: "CELEBRATION",
      startDate: nthWeekdayOfMonth(year, 8, 0, 1),
      description: "Friendship bands, sharing activity and kindness circle. Adjust to a working day if required.",
    },
    {
      title: "Independence Day",
      eventType: "HOLIDAY",
      startDate: indiaCalendarDate(year, 8, 15),
      description: "Centre closed for the national holiday. Schedule the flag ceremony, tricolour craft and age-appropriate independence story on the previous working day when required.",
    },
    {
      title: "National Sports Day",
      eventType: "ACTIVITY",
      startDate: indiaCalendarDate(year, 8, 29),
      description: "Mini sports, movement games and learning about teamwork and fair play.",
    },
    {
      title: "Teachers' Day Celebration",
      eventType: "CELEBRATION",
      startDate: indiaCalendarDate(year, 9, 5),
      description: "Teacher appreciation, student performances and gratitude cards.",
    },
    {
      title: "International Literacy Day",
      eventType: "ACTIVITY",
      startDate: indiaCalendarDate(year, 9, 8),
      description: "Storytelling, picture-book exploration and a family reading activity.",
    },
    {
      title: "Hindi Diwas",
      eventType: "ACTIVITY",
      startDate: indiaCalendarDate(year, 9, 14),
      description: "Hindi rhyme, storytelling and age-appropriate vocabulary activities.",
    },
    {
      title: "Grandparents' Day Celebration",
      eventType: "CELEBRATION",
      startDate: nthWeekdayOfMonth(year, 9, 0, 2),
      description: "Grandparent-child activities, family stories and a gratitude keepsake. Adjust to a working day if required.",
    },
    {
      title: "Gandhi Jayanti Celebration",
      eventType: "CELEBRATION",
      startDate: indiaCalendarDate(year, 10, 2),
      description: "Age-appropriate learning about truth, kindness, cleanliness and non-violence.",
    },
    {
      title: "World Animal Day",
      eventType: "ACTIVITY",
      startDate: indiaCalendarDate(year, 10, 4),
      description: "Animal-care story, habitat activity and kindness-to-animals learning.",
    },
    {
      title: "Children's Day Celebration",
      eventType: "CELEBRATION",
      startDate: indiaCalendarDate(year, 11, 14),
      description: "Games, performances, child-choice activities and a joyful centre celebration.",
    },
    {
      title: "Constitution Day",
      eventType: "ACADEMIC",
      startDate: indiaCalendarDate(year, 11, 26),
      description: "Simple classroom conversation about India, equality, rules and respect.",
    },
    {
      title: "International Day of Persons with Disabilities",
      eventType: "ACTIVITY",
      startDate: indiaCalendarDate(year, 12, 3),
      description: "Inclusive stories and activities about empathy, ability, respect and belonging.",
    },
    {
      title: "Christmas Celebration",
      eventType: "CELEBRATION",
      startDate: indiaCalendarDate(year, 12, 25),
      description: "Christmas craft, carols, sharing and a festive classroom celebration.",
    },
  ];
}

function calendarEventKey(title: string, startDate: Date) {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(startDate);

  const comparableTitle = title
    .trim()
    .toLowerCase()
    .replace(/new year[’']?s?(?: day)?/g, "new year")
    .replace(/\bcelebration\b/g, "")
    .replace(/\boptional\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

  return `${date}:${comparableTitle}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();

    if (!canViewCalendar(session)) {
      return NextResponse.json(
        { success: false, message: "You do not have access to the calendar." },
        { status: session ? 403 : 401 },
      );
    }

  const documentId = request.nextUrl.searchParams.get("documentId");

  if (documentId) {
    const document = await prisma.academicCalendarDocument.findUnique({
      where: { id: documentId },
      select: {
        fileName: true,
        mimeType: true,
        fileData: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: "Calendar document was not found." },
        { status: 404 },
      );
    }

    return new NextResponse(Buffer.from(document.fileData), {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(document.fileName)}`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  const from = parseDate(request.nextUrl.searchParams.get("from")) ??
    new Date(new Date().getFullYear(), 0, 1);
  const to = parseDate(request.nextUrl.searchParams.get("to"), true) ??
    new Date(new Date().getFullYear() + 1, 11, 31, 23, 59, 59, 999);

  const [documents, events] = await Promise.all([
    prisma.academicCalendarDocument.findMany({
      orderBy: [{ active: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        academicYear: true,
        sourceRegion: true,
        fileName: true,
        mimeType: true,
        fileSize: true,
        active: true,
        createdAt: true,
        _count: { select: { events: true } },
      },
    }),
    prisma.academicCalendarEvent.findMany({
      where: {
        active: true,
        startDate: { lte: to },
        OR: [{ endDate: null }, { endDate: { gte: from } }],
      },
      orderBy: [{ startDate: "asc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        eventType: true,
        startDate: true,
        endDate: true,
        allDay: true,
        startTime: true,
        endTime: true,
        programmes: true,
        description: true,
        documentId: true,
        active: true,
      },
    }),
  ]);

    return NextResponse.json({
      success: true,
      canManage: canManageCalendar(session),
      documents: documents.map((document) => ({
        ...document,
        createdAt: document.createdAt.toISOString(),
        eventCount: document._count.events,
        _count: undefined,
      })),
      events: events.map(formatEvent),
    });
  } catch (error) {
    console.error("Calendar load failed", error);
    const persistenceError = publicPersistenceError(
      error,
      "The calendar could not be loaded. Please refresh or contact the Owner.",
    );
    return NextResponse.json(
      { success: false, message: persistenceError.message },
      { status: persistenceError.status },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();

  if (!session || !canManageCalendar(session)) {
    return NextResponse.json(
      { success: false, message: "Only authorised users can update the calendar." },
      { status: session ? 403 : 401 },
    );
  }

  const adminUserId = session.userId;

  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      let formData: FormData;
      try {
        formData = await request.formData();
      } catch {
        throw new CalendarRequestError(
          "The calendar upload could not be read. Choose the PDF again and retry.",
        );
      }
      const file = formData.get("file");

      if (!(file instanceof File)) {
        return NextResponse.json(
          { success: false, message: "Please choose the Kidzee calendar PDF." },
          { status: 400 },
        );
      }

      if (file.type !== "application/pdf") {
        return NextResponse.json(
          { success: false, message: "Only PDF calendar files are supported." },
          { status: 400 },
        );
      }

      if (file.size <= 0 || file.size > MAX_CALENDAR_SIZE) {
        return NextResponse.json(
          { success: false, message: "The calendar PDF must be smaller than 12 MB." },
          { status: 400 },
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const region = cleanText(
        formData.get("region"),
        120,
      ) || "Delhi, NCR, UK, Haryana";
      let imported: ReturnType<typeof importKidzeeCalendarPdf>;
      try {
        imported = importKidzeeCalendarPdf(buffer, region);
      } catch (error) {
        console.error("Calendar PDF import failed", error);
        const importMessage = error instanceof Error ? error.message : "";
        throw new CalendarRequestError(
          SAFE_CALENDAR_IMPORT_MESSAGES.has(importMessage)
            ? importMessage
            : "The calendar PDF could not be read. Choose a valid Kidzee calendar PDF and try again.",
        );
      }
      const title = cleanText(formData.get("title"), 180) ||
        `Kidzee Holiday Calendar ${imported.academicYear ?? ""}`.trim();
      const sha256 = createHash("sha256").update(buffer).digest("hex");

      const existing = await prisma.academicCalendarDocument.findFirst({
        where: { sha256 },
        select: { id: true, title: true },
      });

      if (existing) {
        return NextResponse.json(
          {
            success: false,
            message: `${existing.title} has already been uploaded.`,
          },
          { status: 409 },
        );
      }

      const result = await prisma.$transaction(async (transaction) => {
        const activeDocuments = await transaction.academicCalendarDocument.findMany({
          where: { active: true },
          select: { id: true },
        });
        const activeIds = activeDocuments.map((document) => document.id);

        if (activeIds.length > 0) {
          await transaction.academicCalendarEvent.updateMany({
            where: { documentId: { in: activeIds } },
            data: { active: false },
          });
          await transaction.academicCalendarDocument.updateMany({
            where: { id: { in: activeIds } },
            data: { active: false },
          });
        }

        const document = await transaction.academicCalendarDocument.create({
          data: {
            title,
            academicYear: imported.academicYear,
            sourceRegion: imported.region,
            fileName: file.name.slice(0, 240),
            mimeType: file.type,
            fileSize: file.size,
            fileData: buffer,
            sha256,
            active: true,
            uploadedById: adminUserId,
            events: {
              create: imported.events.map((event) => ({
                title: event.title,
                eventType: event.eventType,
                startDate: event.startDate,
                endDate: event.endDate,
                allDay: true,
                programmes: [],
                description: event.description,
                active: true,
                createdById: adminUserId,
              })),
            },
          },
          select: {
            id: true,
            title: true,
            academicYear: true,
            _count: { select: { events: true } },
          },
        });

        await transaction.activityLog.create({
          data: {
            adminUserId,
            action: "CREATED",
            entityType: "AcademicCalendarDocument",
            entityId: document.id,
            description: `${document.title} uploaded with ${document._count.events} calendar events.`,
            newData: {
              academicYear: document.academicYear,
              region: imported.region,
              eventCount: document._count.events,
            },
          },
        });

        return document;
      });

      return NextResponse.json({
        success: true,
        message: `${result._count.events} events imported. The new calendar is now active.`,
        documentId: result.id,
        warnings: imported.warnings,
      });
    }

    const body = (await request.json()) as CalendarRequestBody;
    const action = cleanText(body.action, 30);

    if (action === "create-preschool-template") {
      const year = Number(body.year);

      if (!Number.isInteger(year) || year < 2020 || year > 2100) {
        return NextResponse.json(
          { success: false, message: "Choose a valid planner year." },
          { status: 400 },
        );
      }

      const yearStart = indiaCalendarDate(year, 1, 1);
      const yearEnd = new Date(
        indiaCalendarDate(year + 1, 1, 1).getTime() - 1,
      );
      const existingEvents = await prisma.academicCalendarEvent.findMany({
        where: {
          active: true,
          startDate: {
            gte: yearStart,
            lte: yearEnd,
          },
        },
        select: {
          id: true,
          title: true,
          eventType: true,
          startDate: true,
          description: true,
        },
      });
      const templateEvents = preschoolYearTemplate(year);
      const existingKeys = new Set(
        existingEvents.map((event) =>
          calendarEventKey(event.title, event.startDate),
        ),
      );
      const newEvents = templateEvents.filter(
        (event) =>
          !existingKeys.has(calendarEventKey(event.title, event.startDate)),
      );
      const independenceDay = templateEvents.find(
        (event) => event.title === "Independence Day",
      );
      const existingIndependenceDay = independenceDay
        ? existingEvents.find(
            (event) =>
              calendarEventKey(event.title, event.startDate) ===
              calendarEventKey(independenceDay.title, independenceDay.startDate),
          )
        : null;
      const correctIndependenceDay = Boolean(
        independenceDay &&
          existingIndependenceDay &&
          (existingIndependenceDay.title !== independenceDay.title ||
            existingIndependenceDay.eventType !== independenceDay.eventType ||
            existingIndependenceDay.description !== independenceDay.description),
      );

      if (newEvents.length > 0 || correctIndependenceDay) {
        await prisma.$transaction(async (transaction) => {
          if (newEvents.length > 0) {
            await transaction.academicCalendarEvent.createMany({
              data: newEvents.map((event) => ({
                title: event.title,
                eventType: event.eventType,
                startDate: event.startDate,
                endDate: null,
                allDay: true,
                programmes: [],
                description: event.description,
                active: true,
                createdById: adminUserId,
              })),
            });
          }

          if (
            correctIndependenceDay &&
            independenceDay &&
            existingIndependenceDay
          ) {
            await transaction.academicCalendarEvent.update({
              where: { id: existingIndependenceDay.id },
              data: {
                title: independenceDay.title,
                eventType: independenceDay.eventType,
                description: independenceDay.description,
              },
            });
          }

          await transaction.activityLog.create({
            data: {
              adminUserId,
              action: newEvents.length > 0 ? "CREATED" : "UPDATED",
              entityType: "AcademicCalendarEvent",
              description: `${newEvents.length} preschool planner events added and ${correctIndependenceDay ? 1 : 0} holiday details corrected for ${year}.`,
              newData: {
                year,
                eventCount: newEvents.length,
                correctedHolidayCount: correctIndependenceDay ? 1 : 0,
              },
            },
          });
        });
      }

      return NextResponse.json({
        success: true,
        message:
          newEvents.length > 0
            ? `${newEvents.length} preschool celebrations and important days were added for ${year}.${correctIndependenceDay ? " Independence Day is marked as a holiday." : ""}`
            : correctIndependenceDay
              ? `The ${year} planner was updated. Independence Day is now marked as a holiday.`
            : `The ${year} preschool planner is already up to date.`,
      });
    }

    if (action !== "create-event" && action !== "update-event") {
      return NextResponse.json(
        { success: false, message: "Please choose a valid calendar action." },
        { status: 400 },
      );
    }

    const title = cleanText(body.title, 180);
    const eventType = cleanText(body.eventType, 40);
    const startDate = parseDate(body.startDate);
    const endDate = cleanText(body.endDate, 40)
      ? parseDate(body.endDate, true)
      : null;

    if (!title || !startDate || !isCalendarEventType(eventType)) {
      return NextResponse.json(
        { success: false, message: "Enter the event title, type and start date." },
        { status: 400 },
      );
    }

    if (endDate && endDate < startDate) {
      return NextResponse.json(
        { success: false, message: "The end date cannot be before the start date." },
        { status: 400 },
      );
    }

    const eventData = {
      title,
      eventType,
      startDate,
      endDate,
      allDay: body.allDay !== false,
      startTime: cleanText(body.startTime, 10) || null,
      endTime: cleanText(body.endTime, 10) || null,
      programmes: parseProgrammes(body.programmes),
      description: cleanText(body.description, 2000) || null,
      active: true,
    };

    const event = action === "update-event"
      ? await prisma.academicCalendarEvent.update({
          where: { id: cleanText(body.eventId, 100) },
          data: eventData,
        })
      : await prisma.academicCalendarEvent.create({
          data: { ...eventData, createdById: adminUserId },
        });

    await prisma.activityLog.create({
      data: {
        adminUserId,
        action: action === "update-event" ? "UPDATED" : "CREATED",
        entityType: "AcademicCalendarEvent",
        entityId: event.id,
        description: `${event.title} ${action === "update-event" ? "updated" : "added"} in the centre calendar.`,
        newData: {
          title: event.title,
          eventType: event.eventType,
          startDate: event.startDate.toISOString(),
          endDate: event.endDate?.toISOString() ?? null,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: action === "update-event" ? "Calendar event updated." : "Calendar event added.",
      event: formatEvent(event),
    });
  } catch (error) {
    if (error instanceof CalendarRequestError || error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          message:
            error instanceof CalendarRequestError
              ? error.message
              : "The calendar request could not be read. Refresh and try again.",
        },
        { status: 400 },
      );
    }
    console.error("Calendar update failed", error);
    const persistenceError = publicPersistenceError(
      error,
      "The calendar could not be updated. Please try again or contact the Owner.",
    );

    return NextResponse.json(
      {
        success: false,
        message: persistenceError.message,
      },
      { status: persistenceError.status },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAdminSession();

  if (!session || !canManageCalendar(session)) {
    return NextResponse.json(
      { success: false, message: "Only authorised users can update the calendar." },
      { status: session ? 403 : 401 },
    );
  }

  const adminUserId = session.userId;

  const eventId = request.nextUrl.searchParams.get("eventId")?.trim();

  if (!eventId) {
    return NextResponse.json(
      { success: false, message: "Calendar event was not selected." },
      { status: 400 },
    );
  }

  const event = await prisma.academicCalendarEvent.update({
    where: { id: eventId },
    data: { active: false },
    select: { id: true, title: true },
  });

  await prisma.activityLog.create({
    data: {
      adminUserId,
      action: "CANCELLED",
      entityType: "AcademicCalendarEvent",
      entityId: event.id,
      description: `${event.title} removed from the active centre calendar.`,
    },
  });

    return NextResponse.json({
      success: true,
      message: "Calendar event removed.",
    });
  } catch (error) {
    console.error("Calendar removal failed", error);
    const persistenceError = publicPersistenceError(
      error,
      "The calendar event could not be removed. Please try again or contact the Owner.",
    );
    return NextResponse.json(
      { success: false, message: persistenceError.message },
      { status: persistenceError.status },
    );
  }
}
