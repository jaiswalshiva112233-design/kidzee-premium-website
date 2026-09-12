import type { $Enums } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { evaluateBatchCapacity } from "@/lib/admin/teacherWorkflow";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorised." }, { status: 401 });
    }

    const { id } = await params;
    const batch = await prisma.batch.findUnique({
      where: { id },
      include: {
        primaryTeacher: {
          select: { id: true, staffNumber: true, name: true, phone: true, email: true, designation: true },
        },
        assistantTeacher: {
          select: { id: true, staffNumber: true, name: true, phone: true, email: true, designation: true },
        },
        studentAssignments: {
          where: { status: "ACTIVE" },
          include: {
            student: {
              select: {
                id: true,
                studentNumber: true,
                firstName: true,
                middleName: true,
                lastName: true,
                preferredName: true,
                dateOfBirth: true,
                gender: true,
                profilePhotoUrl: true,
                bloodGroup: true,
                medicalNotes: true,
                allergies: true,
                guardians: {
                  where: { isPrimary: true },
                  select: { name: true, phone: true, relationship: true },
                  take: 1,
                },
              },
            },
          },
          orderBy: [{ rollNumber: "asc" }, { assignedAt: "asc" }],
        },
      },
    });

    if (!batch) {
      return NextResponse.json({ success: false, message: "Batch not found." }, { status: 404 });
    }

    const activeStudents = batch.studentAssignments.map((assignment) => {
      const s = assignment.student;
      const fullName = [s.firstName, s.middleName, s.lastName].filter(Boolean).join(" ");
      return {
        assignmentId: assignment.id,
        rollNumber: assignment.rollNumber,
        assignedAt: assignment.assignedAt,
        studentId: s.id,
        studentNumber: s.studentNumber,
        name: s.preferredName ? `${s.preferredName} (${fullName})` : fullName,
        dateOfBirth: s.dateOfBirth,
        gender: s.gender,
        profilePhotoUrl: s.profilePhotoUrl,
        bloodGroup: s.bloodGroup,
        medicalNotes: s.medicalNotes,
        allergies: s.allergies,
        primaryGuardian: s.guardians[0] ?? null,
      };
    });

    const capacityEvaluation = evaluateBatchCapacity(
      batch.programme,
      activeStudents.length,
      batch.capacity
    );

    return NextResponse.json({
      success: true,
      batch: {
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
        students: activeStudents,
        capacityEvaluation,
        createdAt: batch.createdAt,
        updatedAt: batch.updatedAt,
      },
    });
  } catch (error) {
    console.error("Failed to load batch:", error);
    return NextResponse.json({ success: false, message: "Unable to load batch details." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorised." }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const data: Record<string, unknown> = {};
    if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
    if (typeof body.academicYear === "string" && body.academicYear.trim()) data.academicYear = body.academicYear.trim();
    if (typeof body.room === "string") data.room = body.room.trim() || null;
    if (typeof body.capacity === "number" && body.capacity > 0) data.capacity = Math.floor(body.capacity);
    if ("primaryTeacherId" in body) data.primaryTeacherId = body.primaryTeacherId ? String(body.primaryTeacherId).trim() : null;
    if ("assistantTeacherId" in body) data.assistantTeacherId = body.assistantTeacherId ? String(body.assistantTeacherId).trim() : null;
    if ("notes" in body) data.notes = body.notes ? String(body.notes).trim() : null;
    if (typeof body.status === "string" && (body.status === "ACTIVE" || body.status === "INACTIVE")) data.status = body.status;

    const updated = await prisma.batch.update({
      where: { id },
      data,
      include: {
        primaryTeacher: { select: { id: true, name: true } },
        assistantTeacher: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, message: "Batch updated successfully.", batch: updated });
  } catch (error) {
    console.error("Failed to update batch:", error);
    return NextResponse.json({ success: false, message: "Unable to update batch." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorised." }, { status: 401 });
    }

    const { id } = await params;
    const activeAssignments = await prisma.studentBatchAssignment.count({
      where: { batchId: id, status: "ACTIVE" },
    });

    if (activeAssignments > 0) {
      return NextResponse.json(
        { success: false, message: `Cannot delete section with ${activeAssignments} active students. Please reassign students first.` },
        { status: 400 }
      );
    }

    await prisma.batch.update({
      where: { id },
      data: { status: "INACTIVE" },
    });

    return NextResponse.json({ success: true, message: "Section deactivated successfully." });
  } catch (error) {
    console.error("Failed to delete batch:", error);
    return NextResponse.json({ success: false, message: "Unable to deactivate batch." }, { status: 500 });
  }
}
