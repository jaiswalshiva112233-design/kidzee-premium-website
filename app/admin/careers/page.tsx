import { redirect } from "next/navigation";
import { BriefcaseBusiness } from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import CareersWorkspace from "@/components/admin/careers/CareersWorkspace";
import { getAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminCareersPage() {
  if (!(await getAdminSession())) redirect("/admin/login");
  const applications = await prisma.careerApplication.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return <AdminLayout><div className="space-y-6"><section className="rounded-[30px] bg-[#2D1736] px-6 py-8 text-white"><div className="flex items-start gap-4"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2D1736]"><BriefcaseBusiness size={27} /></span><div><p className="text-xs font-black uppercase tracking-[0.17em] text-[#F6C84B]">Team hiring</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">Careers</h1><p className="mt-2 text-sm font-semibold text-white/70">Review applicants and their recruitment sources without mixing them with parent enquiries or admission marketing.</p></div></div></section><CareersWorkspace initialApplicants={applications.map((item) => ({ id: item.id, applicationNumber: item.applicationNumber, name: item.name, phone: item.phone, email: item.email, location: item.location, position: item.position, qualification: item.qualification, experience: item.experience, currentRole: item.currentRole, expectedSalary: item.expectedSalary, joiningAvailability: item.joiningAvailability, message: item.message, notes: item.notes, status: item.status, hasResume: Boolean(item.resumeData || item.resumeStoragePath), createdAt: item.createdAt.toISOString(), source: item.source, medium: item.medium, campaign: item.campaign, landingPage: item.landingPage, trafficClass: item.trafficClass }))} /></div></AdminLayout>;
}
