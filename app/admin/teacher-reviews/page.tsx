import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import TeacherReviewsWorkspace, {
  type ObservationItem,
  type ActivityItem,
  type LeaveItem,
} from "@/components/admin/reviews/TeacherReviewsWorkspace";
import { getAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminTeacherReviewsPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const [pendingObservations, pendingActivities, pendingLeaves] = await Promise.all([
    prisma.studentObservationReport.findMany({
      where: { status: "SUBMITTED" },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
        batch: { select: { id: true, name: true, programme: true } },
        teacher: { select: { id: true, name: true, designation: true } },
      },
      orderBy: { reportDate: "desc" },
    }),
    prisma.teacherActivity.findMany({
      where: { status: "SUBMITTED" },
      include: {
        batch: { select: { id: true, name: true, programme: true } },
        teacher: { select: { id: true, name: true, designation: true } },
      },
      orderBy: { activityDate: "desc" },
    }),
    prisma.staffLeaveRequest.findMany({
      where: { status: "PENDING" },
      include: {
        staff: { select: { id: true, staffNumber: true, name: true, designation: true } },
      },
      orderBy: { startDate: "asc" },
    }),
  ]);

  const observations: ObservationItem[] = pendingObservations.map((o) => ({
    id: o.id,
    reportNumber: o.reportNumber,
    term: o.term,
    reportDate: o.reportDate.toISOString(),
    strengths: o.strengths,
    areasOfGrowth: o.areasOfGrowth,
    socialEmotionalDevelopment: o.socialEmotionalDevelopment,
    motorSkillsDevelopment: o.motorSkillsDevelopment,
    languageCommunication: o.languageCommunication,
    cognitiveCuriosity: o.cognitiveCuriosity,
    generalObservations: o.generalObservations,
    status: o.status,
    centreHeadFeedback: o.centreHeadFeedback,
    student: o.student,
    batch: o.batch,
    teacher: o.teacher,
  }));

  const activities: ActivityItem[] = pendingActivities.map((a) => ({
    id: a.id,
    activityDate: a.activityDate.toISOString(),
    weekStartDate: a.weekStartDate.toISOString(),
    domain: a.domain,
    title: a.title,
    description: a.description,
    learningOutcome: a.learningOutcome,
    materialsNeeded: a.materialsNeeded,
    status: a.status,
    reviewNotes: a.reviewNotes,
    batch: a.batch,
    teacher: a.teacher,
  }));

  const leaves: LeaveItem[] = pendingLeaves.map((l) => ({
    id: l.id,
    leaveNumber: l.leaveNumber,
    startDate: l.startDate.toISOString(),
    endDate: l.endDate.toISOString(),
    requestedDays: Number(l.requestedDays),
    paidDays: Number(l.paidDays),
    unpaidDays: Number(l.unpaidDays),
    leaveType: l.leaveType,
    reason: l.reason,
    status: l.status,
    staff: l.staff,
  }));

  return (
    <AdminLayout>
      <TeacherReviewsWorkspace
        initialObservations={observations}
        initialActivities={activities}
        initialLeaves={leaves}
      />
    </AdminLayout>
  );
}
