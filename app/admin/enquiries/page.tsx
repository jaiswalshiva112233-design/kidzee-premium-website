import { redirect } from "next/navigation";
import {
  CalendarClock,
  Clock3,
  MessageSquareText,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import AddEnquiryForm from "@/components/admin/enquiries/AddEnquiryForm";
import EnquiryWorkspace from "@/components/admin/enquiries/EnquiryWorkspace";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

function startOfToday() {
  const date = new Date();

  date.setHours(0, 0, 0, 0);

  return date;
}

function endOfToday() {
  const date = new Date();

  date.setHours(23, 59, 59, 999);

  return date;
}

export const dynamic = "force-dynamic";

export default async function AdminEnquiriesPage() {
  const authenticated =
    await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  const todayStart = startOfToday();
  const todayEnd = endOfToday();

  const [
    enquiries,
    totalEnquiries,
    newEnquiries,
    visitsScheduled,
    admittedEnquiries,
    pendingFollowUps,
    enquiriesToday,
  ] = await Promise.all([
    prisma.enquiry.findMany({
      orderBy: {
        updatedAt: "desc",
      },

      take: 250,
    }),

    prisma.enquiry.count(),

    prisma.enquiry.count({
      where: {
        status: "NEW",
      },
    }),

    prisma.enquiry.count({
      where: {
        status: "VISIT_SCHEDULED",
      },
    }),

    prisma.enquiry.count({
      where: {
        status: "ADMITTED",
      },
    }),

    prisma.followUp.count({
      where: {
        status: "PENDING",

        dueAt: {
          lte: todayEnd,
        },
      },
    }),

    prisma.enquiry.count({
      where: {
        OR: [
          {
            createdAt: {
              gte: todayStart,
              lte: todayEnd,
            },
          },
          {
            lastWebsiteSubmissionAt: {
              gte: todayStart,
              lte: todayEnd,
            },
          },
        ],
      },
    }),
  ]);

  const summaryCards = [
    {
      title: "Total Enquiries",
      value: totalEnquiries.toString(),
      description: `${enquiriesToday} received today`,
      icon: UsersRound,
      accent:
        "bg-[#F3EAF8] text-[#5B2A86]",
    },
    {
      title: "New Enquiries",
      value: newEnquiries.toString(),
      description:
        "Awaiting the first response",
      icon: MessageSquareText,
      accent:
        "bg-[#E8F4FF] text-[#1769AA]",
    },
    {
      title: "Follow-ups Due",
      value: pendingFollowUps.toString(),
      description:
        "Due today or overdue",
      icon: CalendarClock,
      accent:
        "bg-[#FFF3D5] text-[#8A6100]",
    },
    {
      title: "Visits Scheduled",
      value: visitsScheduled.toString(),
      description:
        "Parents expected to visit",
      icon: Clock3,
      accent:
        "bg-[#FFF0E8] text-[#A65325]",
    },
    {
      title: "Admissions",
      value: admittedEnquiries.toString(),
      description:
        "Converted from enquiries",
      icon: UserRoundCheck,
      accent:
        "bg-[#E9F8F2] text-[#28755D]",
    },
  ] as const;

  const workspaceEnquiries =
    enquiries.map((enquiry) => ({
      id: enquiry.id,

      enquiryNumber:
        enquiry.enquiryNumber,

      parentName:
        enquiry.parentName,

      childName:
        enquiry.childName,

      childAgeText:
        enquiry.childAgeText,

      phone:
        enquiry.phone,

      alternatePhone:
        enquiry.alternatePhone,

      email:
        enquiry.email,

      programme:
        enquiry.programme,

      source:
        enquiry.source,

      status:
        enquiry.status,

      message:
        enquiry.message,

      notes:
        enquiry.notes,

      preferredVisitDate:
        enquiry.preferredVisitDate
          ?.toISOString() ?? null,

      trialDate:
        enquiry.trialDate
          ?.toISOString() ?? null,

      nextFollowUpAt:
        enquiry.nextFollowUpAt
          ?.toISOString() ?? null,

      admittedAt:
        enquiry.admittedAt
          ?.toISOString() ?? null,

      lastWebsiteSubmissionAt:
        enquiry.lastWebsiteSubmissionAt
          ?.toISOString() ?? null,

      websiteSubmissionCount:
        enquiry.websiteSubmissionCount,

      createdAt:
        enquiry.createdAt.toISOString(),

      updatedAt:
        enquiry.updatedAt.toISOString(),
    }));

  return (
    <AdminLayout>
      <div className="space-y-8">
        <section className="overflow-hidden rounded-[30px] bg-[#2D1736] px-5 py-7 text-white shadow-[0_22px_65px_rgba(45,23,54,0.18)] sm:px-7 lg:px-9 lg:py-9">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2D1736]">
                  <MessageSquareText
                    aria-hidden="true"
                    size={23}
                  />
                </span>

                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#F6C84B] sm:text-sm">
                  Admissions CRM
                </p>
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                Enquiries & Follow-ups
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 sm:text-base">
                Keep every parent enquiry in one
                permanent record, schedule follow-ups,
                track conversations and manage the
                journey through admission or closure.
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#F6C84B]">
                Live database
              </p>

              <p className="mt-1 text-sm font-black text-white">
                {totalEnquiries} enquiries saved
              </p>
            </div>
          </div>
        </section>

        <section>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7A459C]">
              Live overview
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#2D1736] sm:text-3xl">
              Parent enquiry activity
            </h2>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#817684]">
              Important enquiry and follow-up
              information at a glance.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {summaryCards.map((card) => {
              const Icon = card.icon;

              return (
                <article
                  key={card.title}
                  className="rounded-[26px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)]"
                >
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.accent}`}
                  >
                    <Icon
                      aria-hidden="true"
                      size={22}
                    />
                  </span>

                  <p className="mt-5 text-sm font-bold text-[#746A78]">
                    {card.title}
                  </p>

                  <p className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#2D1736]">
                    {card.value}
                  </p>

                  <p className="mt-2 text-xs font-semibold leading-5 text-[#928896]">
                    {card.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7A459C]">
              New parent lead
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#2D1736] sm:text-3xl">
              Add an enquiry
            </h2>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#817684]">
              Create the enquiry only once. Every
              future call, follow-up and status change
              will remain connected to the same record.
            </p>
          </div>

          <div className="mt-6">
            <AddEnquiryForm />
          </div>
        </section>

        <EnquiryWorkspace
          initialEnquiries={
            workspaceEnquiries
          }
        />
      </div>
    </AdminLayout>
  );
}
