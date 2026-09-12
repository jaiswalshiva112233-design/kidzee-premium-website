import { prisma } from "@/lib/prisma";

export async function getTeacherAssignedBatchIds(staffId: string): Promise<string[]> {
  const batches = await prisma.batch.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { primaryTeacherId: staffId },
        { assistantTeacherId: staffId },
      ],
    },
    select: { id: true },
  });

  return batches.map((b) => b.id);
}

export async function canTeacherAccessBatch(
  staffId: string,
  batchId: string,
): Promise<boolean> {
  const count = await prisma.batch.count({
    where: {
      id: batchId,
      status: "ACTIVE",
      OR: [
        { primaryTeacherId: staffId },
        { assistantTeacherId: staffId },
      ],
    },
  });

  return count > 0;
}

export async function canTeacherAccessStudent(
  staffId: string,
  studentId: string,
): Promise<boolean> {
  const count = await prisma.studentBatchAssignment.count({
    where: {
      studentId,
      status: "ACTIVE",
      batch: {
        status: "ACTIVE",
        OR: [
          { primaryTeacherId: staffId },
          { assistantTeacherId: staffId },
        ],
      },
    },
  });

  return count > 0;
}
