import type { $Enums } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_PROGRAMME_CAPACITIES,
  evaluateBatchCapacity,
} from "@/lib/admin/teacherWorkflow";

const VALID_PROGRAMMES: $Enums.Programme[] = [
  "PLAYGROUP",
  "NURSERY",
  "JUNIOR_KG",
  "SENIOR_KG",
  "DAYCARE",
];

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorised." }, { status: 401 });
    }

    const batches = await prisma.batch.findMany({
      orderBy: [{ academicYear: "desc" }, { programme: "asc" }, { name: "asc" }],
      include: {
        primaryTeacher: {
          select: { id: true, staffNumber: true, name: true, phone: true, email: true, designation: true },
        },
        assistantTeacher: {
          select: { id: true, staffNumber: true, name: true, phone: true, email: true, designation: true },
        },
        studentAssignments: {
          where: { status: "ACTIVE" },
          select: { id: true },
        },
      },
    });

    const items = batches.map((batch) => {
      const activeCount = batch.studentAssignments.length;
      const evaluation = evaluateBatchCapacity(batch.programme, activeCount, batch.capacity);
      return {
        id: batch.id,
        name: batch.name,
        programme: batch.programme,
        academicYear: batch.academicYear,
        room: batch.room,
        capacity: batch.capacity,
        status: batch.status,
        notes: batch.notes,
        primaryTeacher: batch.primaryTeacher,
        assistantTeacher: batch.assistantTeacher,
        activeStudentCount: activeCount,
        capacityEvaluation: evaluation,
        createdAt: batch.createdAt,
        updatedAt: batch.updatedAt,
      };
    });

    return NextResponse.json({ success: true, batches: items });
  } catch (error) {
    console.error("Failed to load batches:", error);
    return NextResponse.json({ success: false, message: "Unable to load batches." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorised." }, { status: 401 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const programme = typeof body.programme === "string" ? body.programme.trim() : "";
    const academicYear = typeof body.academicYear === "string" && body.academicYear.trim()
      ? body.academicYear.trim()
      : "2026-2027";
    const room = typeof body.room === "string" ? body.room.trim() || null : null;
    const primaryTeacherId = typeof body.primaryTeacherId === "string" ? body.primaryTeacherId.trim() || null : null;
    const assistantTeacherId = typeof body.assistantTeacherId === "string" ? body.assistantTeacherId.trim() || null : null;
    const notes = typeof body.notes === "string" ? body.notes.trim() || null : null;

    if (!name) {
      return NextResponse.json({ success: false, message: "Section name is required." }, { status: 400 });
    }

    if (!VALID_PROGRAMMES.includes(programme as $Enums.Programme)) {
      return NextResponse.json({ success: false, message: "Please select a valid programme." }, { status: 400 });
    }

    const progEnum = programme as $Enums.Programme;
    const defaultCapacity = DEFAULT_PROGRAMME_CAPACITIES[progEnum] ?? 8;
    const capacity = typeof body.capacity === "number" && body.capacity > 0
      ? Math.floor(body.capacity)
      : defaultCapacity;

    const batch = await prisma.batch.create({
      data: {
        name,
        programme: progEnum,
        academicYear,
        room,
        capacity,
        primaryTeacherId,
        assistantTeacherId,
        notes,
        status: "ACTIVE",
      },
      include: {
        primaryTeacher: {
          select: { id: true, staffNumber: true, name: true, designation: true },
        },
        assistantTeacher: {
          select: { id: true, staffNumber: true, name: true, designation: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Batch created successfully.",
      batch,
    });
  } catch (error) {
    console.error("Failed to create batch:", error);
    return NextResponse.json({ success: false, message: "Unable to create batch." }, { status: 500 });
  }
}
