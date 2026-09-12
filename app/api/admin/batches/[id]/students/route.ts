import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { evaluateBatchCapacity } from "@/lib/admin/teacherWorkflow";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorised." }, { status: 401 });
    }

    const { id: batchId } = await params;
    const body = await request.json();
    const studentId = typeof body.studentId === "string" ? body.studentId.trim() : "";
    const rollNumber = typeof body.rollNumber === "string" ? body.rollNumber.trim() || null : null;
    const notes = typeof body.notes === "string" ? body.notes.trim() || null : null;

    if (!studentId) {
      return NextResponse.json({ success: false, message: "Please select a student to assign." }, { status: 400 });
    }

    const [batch, student] = await Promise.all([
      prisma.batch.findUnique({
        where: { id: batchId },
        include: {
          studentAssignments: { where: { status: "ACTIVE" } },
        },
      }),
      prisma.student.findUnique({
        where: { id: studentId },
        select: { id: true, firstName: true, lastName: true, programme: true },
      }),
    ]);

    if (!batch) {
      return NextResponse.json({ success: false, message: "Batch not found." }, { status: 404 });
    }
    if (!student) {
      return NextResponse.json({ success: false, message: "Student not found." }, { status: 404 });
    }

    // Check if student already assigned to this batch
    const existing = await prisma.studentBatchAssignment.findUnique({
      where: { studentId_batchId: { studentId, batchId } },
    });

    if (existing && existing.status === "ACTIVE") {
      return NextResponse.json(
        { success: false, message: "Student is already actively assigned to this batch." },
        { status: 400 }
      );
    }

    // Deactivate previous active batch assignments for this student if transferring
    await prisma.studentBatchAssignment.updateMany({
      where: { studentId, status: "ACTIVE" },
      data: { status: "TRANSFERRED", removedAt: new Date() },
    });

    // Upsert assignment for this batch
    const assignment = await prisma.studentBatchAssignment.upsert({
      where: { studentId_batchId: { studentId, batchId } },
      create: {
        studentId,
        batchId,
        rollNumber,
        status: "ACTIVE",
        assignedAt: new Date(),
        notes,
      },
      update: {
        status: "ACTIVE",
        rollNumber,
        notes,
        assignedAt: new Date(),
        removedAt: null,
      },
    });

    // Evaluate new capacity with this addition
    const newCount = batch.studentAssignments.length + 1;
    const warning = evaluateBatchCapacity(batch.programme, newCount, batch.capacity);

    return NextResponse.json({
      success: true,
      message: `Assigned ${student.firstName} to ${batch.name}.`,
      assignment,
      warning: warning.message,
      exceeded: warning.exceeded,
    });
  } catch (error) {
    console.error("Failed to assign student to batch:", error);
    return NextResponse.json({ success: false, message: "Unable to assign student." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorised." }, { status: 401 });
    }

    const { id: batchId } = await params;
    const url = new URL(request.url);
    const studentId = url.searchParams.get("studentId")?.trim();

    if (!studentId) {
      return NextResponse.json({ success: false, message: "Student ID is required." }, { status: 400 });
    }

    await prisma.studentBatchAssignment.updateMany({
      where: { studentId, batchId, status: "ACTIVE" },
      data: { status: "TRANSFERRED", removedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: "Student removed from section." });
  } catch (error) {
    console.error("Failed to remove student assignment:", error);
    return NextResponse.json({ success: false, message: "Unable to remove student." }, { status: 500 });
  }
}
