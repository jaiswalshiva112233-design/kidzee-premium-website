import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import BatchesWorkspace from "@/components/admin/batches/BatchesWorkspace";
import { getAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { evaluateBatchCapacity } from "@/lib/admin/teacherWorkflow";

export const dynamic = "force-dynamic";

export default async function AdminBatchesPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const [rawBatches, staffList, studentList] = await Promise.all([
    prisma.batch.findMany({
      orderBy: [{ academicYear: "desc" }, { programme: "asc" }, { name: "asc" }],
      include: {
        primaryTeacher: {
          select: { id: true, staffNumber: true, name: true, designation: true, phone: true },
        },
        assistantTeacher: {
          select: { id: true, staffNumber: true, name: true, designation: true, phone: true },
        },
        studentAssignments: {
          where: { status: "ACTIVE" },
          select: { id: true },
        },
      },
    }),
    prisma.staff.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, staffNumber: true, name: true, designation: true, phone: true },
      orderBy: { name: "asc" },
    }),
    prisma.student.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, studentNumber: true, firstName: true, lastName: true, programme: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
  ]);

  const batches = rawBatches.map((b) => {
    const count = b.studentAssignments.length;
    const capacityEval = evaluateBatchCapacity(b.programme, count, b.capacity);
    return {
      id: b.id,
      name: b.name,
      programme: b.programme,
      academicYear: b.academicYear,
      room: b.room,
      capacity: b.capacity,
      status: b.status,
      notes: b.notes,
      primaryTeacher: b.primaryTeacher,
      assistantTeacher: b.assistantTeacher,
      activeStudentCount: count,
      capacityEvaluation: capacityEval,
    };
  });

  return (
    <AdminLayout>
      <BatchesWorkspace
        initialBatches={batches}
        staffMembers={staffList}
        students={studentList}
      />
    </AdminLayout>
  );
}
