import Link from "next/link";
import { redirect } from "next/navigation";

import AdminLayout from "@/components/admin/AdminLayout";
import MarketingPageFrame from "@/components/admin/marketing/MarketingPageFrame";
import { getAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ConversionCentrePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  if (!(await getAdminSession())) redirect("/admin/login");
  const requestedPage = Number((await searchParams).page);
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const pageSize = 50;
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 30);
  const [
    jobs,
    recent,
    total,
    careerExcluded,
    internalExcluded,
    missingGoogleId,
    missingMetaId,
  ] = await Promise.all([
    prisma.marketingConversionJob.groupBy({
      by: ["provider", "eventType", "status"],
      _count: true,
    }),
    prisma.marketingConversionJob.findMany({
      select: {
        id: true,
        provider: true,
        eventType: true,
        status: true,
        attempts: true,
        maxAttempts: true,
        nextAttemptAt: true,
        completedAt: true,
        lastAttemptAt: true,
        lastError: true,
        enquiry: { select: { enquiryNumber: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.marketingConversionJob.count(),
    prisma.careerApplication.count({
      where: { createdAt: { gte: since }, leadType: "recruitment" },
    }),
    prisma.websiteLeadSubmission.count({
      where: {
        receivedAt: { gte: since },
        leadType: "admission",
        OR: [{ isInternal: true }, { isTest: true }, { isBot: true }],
      },
    }),
    prisma.websiteLeadSubmission.count({
      where: {
        receivedAt: { gte: since },
        leadType: "admission",
        marketingConsent: true,
        trafficClass: "GENUINE",
        isInternal: false,
        isTest: false,
        isBot: false,
        gclid: null,
        gbraid: null,
        wbraid: null,
      },
    }),
    prisma.websiteLeadSubmission.count({
      where: {
        receivedAt: { gte: since },
        leadType: "admission",
        marketingConsent: true,
        trafficClass: "GENUINE",
        isInternal: false,
        isTest: false,
        isBot: false,
        fbclid: null,
        fbc: null,
        fbp: null,
      },
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminLayout>
      <MarketingPageFrame
        current="/admin/marketing/conversions"
        eyebrow="Conversion Centre"
        title="Admission feedback delivery"
        description="Google Offline Conversion and Meta Conversions API use the existing idempotent retry queue. This page reports delivery; it does not resend or change provider data outside the scheduled workflow."
      >
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {["PENDING", "PROCESSING", "RETRY", "SUCCEEDED", "DEAD"].map((status) => (
            <article
              key={status}
              className="rounded-2xl border border-[#E7DFEA] bg-white p-4"
            >
              <p className="text-2xl font-black text-[#2D1736]">
                {jobs
                  .filter((row) => row.status === status)
                  .reduce((sum, row) => sum + row._count, 0)}
              </p>
              <p className="text-xs font-bold text-[#817684]">
                {status.replaceAll("_", " ")}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <HealthCard
            label="Career submissions skipped"
            value={careerExcluded}
            helper="Expected: recruitment never enters admission conversions."
          />
          <HealthCard
            label="Internal/test submissions skipped"
            value={internalExcluded}
            helper="Expected: stored raw but excluded from advertising KPIs."
          />
          <HealthCard
            label="Missing Google click ID"
            value={missingGoogleId}
            helper="Not eligible for Google click-based offline delivery."
          />
          <HealthCard
            label="Missing Meta match ID"
            value={missingMetaId}
            helper="Not eligible for Meta admission delivery."
          />
        </section>

        <article className="overflow-hidden rounded-[24px] border border-[#E7DFEA] bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-[#E7DFEA] p-5">
            <div>
              <h2 className="font-black text-[#2D1736]">
                Latest delivery records
              </h2>
              <p className="mt-1 text-xs font-semibold text-[#817684]">
                {total} records / page {Math.min(page, pages)} of {pages}
              </p>
            </div>
            <div className="flex gap-2">
              {page > 1 ? (
                <Link
                  href={`/admin/marketing/conversions?page=${page - 1}`}
                  className="rounded-lg border border-[#D8C9DF] px-3 py-2 text-xs font-black text-[#5B2A86]"
                >
                  Previous
                </Link>
              ) : null}
              {page < pages ? (
                <Link
                  href={`/admin/marketing/conversions?page=${page + 1}`}
                  className="rounded-lg bg-[#5B2A86] px-3 py-2 text-xs font-black text-white"
                >
                  Next
                </Link>
              ) : null}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="bg-[#FAF8FB]">
                <tr>
                  <th className="p-4">Enquiry</th>
                  <th>Provider</th>
                  <th>Event</th>
                  <th>Status</th>
                  <th>Attempts</th>
                  <th>Delivery reason</th>
                  <th>Next / completed</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((row) => (
                  <tr key={row.id} className="border-t border-[#EFEAF1]">
                    <td className="p-4 font-black">
                      {row.enquiry.enquiryNumber}
                    </td>
                    <td>{row.provider}</td>
                    <td>{row.eventType}</td>
                    <td>{row.status}</td>
                    <td>
                      {row.attempts}/{row.maxAttempts}
                    </td>
                    <td>
                      {row.lastError ||
                        (row.status === "SUCCEEDED"
                          ? "Delivered"
                          : "Awaiting scheduled delivery")}
                    </td>
                    <td>
                      {new Date(
                        row.completedAt ?? row.nextAttemptAt,
                      ).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </MarketingPageFrame>
    </AdminLayout>
  );
}

function HealthCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <article className="rounded-2xl border border-[#E7DFEA] bg-white p-4">
      <p className="text-2xl font-black text-[#2D1736]">{value}</p>
      <p className="text-xs font-black text-[#574B5B]">{label}</p>
      <p className="mt-1 text-[11px] font-semibold leading-5 text-[#817684]">
        {helper}
      </p>
    </article>
  );
}
