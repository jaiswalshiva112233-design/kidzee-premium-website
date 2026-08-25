"use client";

import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  LoaderCircle,
  MessageSquareText,
  Phone,
  RotateCcw,
  Search,
  Send,
  UserRoundCheck,
  X,
  XCircle,
} from "lucide-react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import EnquiryJourneyPanel from "@/components/admin/enquiries/EnquiryJourneyPanel";

type EnquiryStatus =
  | "NEW"
  | "CONTACTED"
  | "NO_ANSWER"
  | "VISIT_SCHEDULED"
  | "VISIT_BOOKED"
  | "VISIT_COMPLETED"
  | "TRIAL_SCHEDULED"
  | "TRIAL_COMPLETED"
  | "INTERESTED"
  | "FOLLOW_UP"
  | "QUALIFIED"
  | "ADMITTED"
  | "NOT_INTERESTED"
  | "CLOSED";

type FollowUpStatus =
  | "PENDING"
  | "COMPLETED"
  | "CANCELLED";

export type EnquiryWorkspaceItem = {
  id: string;
  enquiryNumber: string;
  parentName: string;
  childName: string | null;
  childAgeText: string | null;
  phone: string;
  alternatePhone: string | null;
  email: string | null;
  programme: string | null;
  source: string;
  status: EnquiryStatus;
  message: string | null;
  notes: string | null;
  preferredVisitDate: string | null;
  trialDate: string | null;
  nextFollowUpAt: string | null;
  admittedAt: string | null;
  lastWebsiteSubmissionAt: string | null;
  websiteSubmissionCount: number;
  latestTrafficChannel?: string | null;
  googleAdmissionSentAt?: string | null;
  googleAdmissionError?: string | null;
  metaAdmissionSentAt?: string | null;
  metaAdmissionError?: string | null;
  createdAt: string;
  updatedAt: string;
};

type WebsiteSubmissionItem = {
  id: string;
  submissionId: string;
  source: string;
  enquiryType: string;
  pageUrl: string | null;
  landingPage: string | null;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  gclid: string | null;
  gbraid?: string | null;
  wbraid?: string | null;
  fbclid: string | null;
  trafficChannel?: string | null;
  marketingConsent?: boolean;
  receivedAt: string;
};

type FollowUpItem = {
  id: string;
  title: string;
  notes: string | null;
  dueAt: string;
  completedAt: string | null;
  status: FollowUpStatus;
  createdAt: string;
  updatedAt: string;
};

type EnquiryDetail = EnquiryWorkspaceItem & {
  followUps: FollowUpItem[];
  websiteSubmissions: WebsiteSubmissionItem[];
};

type EnquiryApiResponse = {
  success?: boolean;
  message?: string;
  enquiry?: EnquiryDetail;
};

type WorkspaceTab =
  | "ACTIVE"
  | "FOLLOW_UP"
  | "ADMITTED"
  | "CLOSED"
  | "ALL";

type EnquiryWorkspaceProps = {
  initialEnquiries: EnquiryWorkspaceItem[];
};

const activeStatuses: EnquiryStatus[] = [
  "NEW",
  "CONTACTED",
  "NO_ANSWER",
  "VISIT_SCHEDULED",
  "VISIT_BOOKED",
  "VISIT_COMPLETED",
  "TRIAL_SCHEDULED",
  "TRIAL_COMPLETED",
  "INTERESTED",
  "FOLLOW_UP",
  "QUALIFIED",
];

const statusOptions: Array<{
  value: Exclude<EnquiryStatus, "CLOSED">;
  label: string;
}> = [
  {
    value: "NEW",
    label: "New",
  },
  {
    value: "CONTACTED",
    label: "Contacted",
  },
  {
    value: "NO_ANSWER",
    label: "No Answer",
  },
  {
    value: "VISIT_SCHEDULED",
    label: "Visit Scheduled",
  },
  { value: "VISIT_BOOKED", label: "Visit Booked" },
  { value: "VISIT_COMPLETED", label: "Visit Completed" },
  {
    value: "TRIAL_SCHEDULED",
    label: "Trial Scheduled",
  },
  { value: "TRIAL_COMPLETED", label: "Trial Completed" },
  {
    value: "INTERESTED",
    label: "Interested",
  },
  {
    value: "FOLLOW_UP",
    label: "Follow-up",
  },
  { value: "QUALIFIED", label: "Qualified Lead" },
  {
    value: "ADMITTED",
    label: "Admitted",
  },
  {
    value: "NOT_INTERESTED",
    label: "Not Interested",
  },
];

const programmeLabels: Record<string, string> = {
  PLAYGROUP: "Playgroup",
  NURSERY: "Nursery",
  JUNIOR_KG: "Junior KG",
  SENIOR_KG: "Senior KG",
  DAYCARE: "Daycare",
};

const sourceLabels: Record<string, string> = {
  WEBSITE: "Website",
  FORMSPREE: "Formspree",
  GOOGLE_ADS: "Google Ads",
  META_ADS: "Meta Ads",
  WHATSAPP: "WhatsApp",
  PHONE_CALL: "Phone Call",
  WALK_IN: "Walk-in",
  REFERRAL: "Referral",
  OTHER: "Other",
};

const trafficChannelLabels: Record<string, string> = {
  GOOGLE_ADS: "Google Ads",
  META_ADS: "Meta Ads",
  ORGANIC_SEARCH: "Organic search",
  REFERRAL: "Referral website",
  CAMPAIGN_OTHER: "Other campaign",
  DIRECT: "Direct visit",
};

const sourceStyles: Record<string, string> = {
  WEBSITE: "border-green-200 bg-green-50 text-green-700",
  FORMSPREE: "border-green-200 bg-green-50 text-green-700",
  GOOGLE_ADS: "border-blue-200 bg-blue-50 text-blue-700",
  META_ADS: "border-indigo-200 bg-indigo-50 text-indigo-700",
  WHATSAPP: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PHONE_CALL: "border-sky-200 bg-sky-50 text-sky-700",
  WALK_IN: "border-amber-200 bg-amber-50 text-amber-700",
  REFERRAL: "border-violet-200 bg-violet-50 text-violet-700",
  OTHER: "border-slate-200 bg-slate-50 text-slate-600",
};

const statusLabels: Record<EnquiryStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  NO_ANSWER: "No Answer",
  VISIT_SCHEDULED: "Visit Scheduled",
  VISIT_BOOKED: "Visit Booked",
  VISIT_COMPLETED: "Visit Completed",
  TRIAL_SCHEDULED: "Trial Scheduled",
  TRIAL_COMPLETED: "Trial Completed",
  INTERESTED: "Interested",
  FOLLOW_UP: "Follow-up",
  QUALIFIED: "Qualified Lead",
  ADMITTED: "Admitted",
  NOT_INTERESTED: "Not Interested",
  CLOSED: "Closed",
};

const statusStyles: Record<EnquiryStatus, string> = {
  NEW: "border-[#D9C5E3] bg-[#F3EAF8] text-[#5B2A86]",
  CONTACTED: "border-blue-200 bg-blue-50 text-blue-700",
  NO_ANSWER:
    "border-slate-200 bg-slate-50 text-slate-600",
  VISIT_SCHEDULED:
    "border-amber-200 bg-amber-50 text-amber-700",
  VISIT_BOOKED:
    "border-amber-200 bg-amber-50 text-amber-700",
  VISIT_COMPLETED:
    "border-cyan-200 bg-cyan-50 text-cyan-700",
  TRIAL_SCHEDULED:
    "border-orange-200 bg-orange-50 text-orange-700",
  TRIAL_COMPLETED:
    "border-orange-200 bg-orange-50 text-orange-700",
  INTERESTED:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  FOLLOW_UP:
    "border-yellow-200 bg-yellow-50 text-yellow-700",
  QUALIFIED:
    "border-violet-200 bg-violet-50 text-violet-700",
  ADMITTED:
    "border-green-200 bg-green-50 text-green-700",
  NOT_INTERESTED:
    "border-red-200 bg-red-50 text-red-700",
  CLOSED:
    "border-slate-300 bg-slate-100 text-slate-600",
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function createWhatsAppLink(
  phone: string,
  parentName: string,
) {
  const digits = phone.replace(/\D/g, "");

  const number =
    digits.length === 10
      ? `91${digits}`
      : digits;

  const message = encodeURIComponent(
    `Hello ${parentName}, this is Kidzee Sector 12, Dwarka regarding your preschool enquiry.`,
  );

  return `https://wa.me/${number}?text=${message}`;
}

function getMinimumDateTime() {
  const now = new Date();
  const localTime = new Date(
    now.getTime() -
      now.getTimezoneOffset() * 60_000,
  );

  return localTime.toISOString().slice(0, 16);
}

function isFollowUpDue(enquiry: EnquiryWorkspaceItem) {
  if (!enquiry.nextFollowUpAt) {
    return false;
  }

  const followUpTime = new Date(
    enquiry.nextFollowUpAt,
  ).getTime();

  return (
    activeStatuses.includes(enquiry.status) &&
    followUpTime <= Date.now()
  );
}

function matchesTab(
  enquiry: EnquiryWorkspaceItem,
  tab: WorkspaceTab,
) {
  if (tab === "ACTIVE") {
    return activeStatuses.includes(enquiry.status);
  }

  if (tab === "FOLLOW_UP") {
    return isFollowUpDue(enquiry);
  }

  if (tab === "ADMITTED") {
    return enquiry.status === "ADMITTED";
  }

  if (tab === "CLOSED") {
    return (
      enquiry.status === "CLOSED" ||
      enquiry.status === "NOT_INTERESTED"
    );
  }

  return true;
}

function toWorkspaceItem(
  enquiry: EnquiryDetail,
): EnquiryWorkspaceItem {
  return {
    id: enquiry.id,
    enquiryNumber: enquiry.enquiryNumber,
    parentName: enquiry.parentName,
    childName: enquiry.childName,
    childAgeText: enquiry.childAgeText,
    phone: enquiry.phone,
    alternatePhone: enquiry.alternatePhone,
    email: enquiry.email,
    programme: enquiry.programme,
    source: enquiry.source,
    status: enquiry.status,
    message: enquiry.message,
    notes: enquiry.notes,
    preferredVisitDate:
      enquiry.preferredVisitDate,
    trialDate: enquiry.trialDate,
    nextFollowUpAt: enquiry.nextFollowUpAt,
    admittedAt: enquiry.admittedAt,
    lastWebsiteSubmissionAt:
      enquiry.lastWebsiteSubmissionAt,
    websiteSubmissionCount:
      enquiry.websiteSubmissionCount,
    createdAt: enquiry.createdAt,
    updatedAt: enquiry.updatedAt,
  };
}

export default function EnquiryWorkspace({
  initialEnquiries,
}: EnquiryWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [enquiries, setEnquiries] =
    useState(initialEnquiries);

  const [activeTab, setActiveTab] =
    useState<WorkspaceTab>("ACTIVE");

  const [search, setSearch] = useState(
    () => searchParams.get("search") ?? "",
  );

  const [sourceFilter, setSourceFilter] =
    useState(
      () => searchParams.get("source") ?? "ALL",
    );

  const [activeEnquiryId, setActiveEnquiryId] =
    useState<string | null>(null);

  const [selectedEnquiry, setSelectedEnquiry] =
    useState<EnquiryDetail | null>(null);

  const [loadingEnquiry, setLoadingEnquiry] =
    useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const [nextFollowUpAt, setNextFollowUpAt] =
    useState("");

  const [followUpNote, setFollowUpNote] =
    useState("");

  const [selectedStatus, setSelectedStatus] =
    useState<Exclude<EnquiryStatus, "CLOSED">>(
      "NEW",
    );

  const [closeReason, setCloseReason] =
    useState("");

  useEffect(() => {
    if (!activeEnquiryId) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveEnquiryId(null);
        setSelectedEnquiry(null);
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [activeEnquiryId]);

  const tabCounts = useMemo(
    () => ({
      ACTIVE: enquiries.filter((enquiry) =>
        matchesTab(enquiry, "ACTIVE"),
      ).length,

      FOLLOW_UP: enquiries.filter((enquiry) =>
        matchesTab(enquiry, "FOLLOW_UP"),
      ).length,

      ADMITTED: enquiries.filter((enquiry) =>
        matchesTab(enquiry, "ADMITTED"),
      ).length,

      CLOSED: enquiries.filter((enquiry) =>
        matchesTab(enquiry, "CLOSED"),
      ).length,

      ALL: enquiries.length,
    }),
    [enquiries],
  );

  const visibleEnquiries = useMemo(() => {
    const searchText = search
      .trim()
      .toLowerCase();

    return enquiries.filter((enquiry) => {
      if (!matchesTab(enquiry, activeTab)) {
        return false;
      }

      if (
        sourceFilter !== "ALL" &&
        enquiry.source !== sourceFilter
      ) {
        return false;
      }

      if (!searchText) {
        return true;
      }

      return [
        enquiry.enquiryNumber,
        enquiry.parentName,
        enquiry.childName,
        enquiry.phone,
        enquiry.email,
        sourceLabels[enquiry.source],
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(searchText),
        );
    });
  }, [activeTab, enquiries, search, sourceFilter]);

  function closeDrawer() {
    if (saving) {
      return;
    }

    setActiveEnquiryId(null);
    setSelectedEnquiry(null);
    setError("");
    setSuccessMessage("");
    setNextFollowUpAt("");
    setFollowUpNote("");
    setCloseReason("");
  }

    const openEnquiry = useCallback(
    async (id: string) => {
      setActiveEnquiryId(id);
      setSelectedEnquiry(null);
      setLoadingEnquiry(true);
      setError("");
      setSuccessMessage("");

      try {
        const response = await fetch(
          `/api/admin/enquiries/${encodeURIComponent(
            id,
          )}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const result =
          (await response.json()) as EnquiryApiResponse;

        if (
          !response.ok ||
          !result.success ||
          !result.enquiry
        ) {
          throw new Error(
            result.message ??
              "Unable to open this enquiry.",
          );
        }

        const enquiry = result.enquiry;
        const workspaceItem =
          toWorkspaceItem(enquiry);

        setSelectedEnquiry(enquiry);

        setSelectedStatus(
          enquiry.status === "CLOSED"
            ? "NEW"
            : enquiry.status,
        );

        setEnquiries((current) =>
          current.some(
            (item) => item.id === workspaceItem.id,
          )
            ? current.map((item) =>
                item.id === workspaceItem.id
                  ? workspaceItem
                  : item,
              )
            : [workspaceItem, ...current],
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to open this enquiry.",
        );
      } finally {
        setLoadingEnquiry(false);
      }
    },
    [],
  );

  useEffect(() => {
    function handleOpenEnquiry(event: Event) {
      const detail = (
        event as CustomEvent<{
          id?: string;
          refresh?: boolean;
        }>
      ).detail;

      if (!detail?.id) {
        return;
      }

      void openEnquiry(detail.id);

      if (detail.refresh) {
        router.refresh();
      }
    }

    window.addEventListener(
      "centreos:open-enquiry",
      handleOpenEnquiry,
    );

    return () => {
      window.removeEventListener(
        "centreos:open-enquiry",
        handleOpenEnquiry,
      );
    };
  }, [openEnquiry, router]);

  async function updateEnquiry(
    body: Record<string, unknown>,
  ) {
    if (!activeEnquiryId) {
      return null;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `/api/admin/enquiries/${encodeURIComponent(
          activeEnquiryId,
        )}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      const result =
        (await response.json()) as EnquiryApiResponse;

      if (
        !response.ok ||
        !result.success ||
        !result.enquiry
      ) {
        throw new Error(
          result.message ??
            "Unable to update this enquiry.",
        );
      }

      setSelectedEnquiry(result.enquiry);

      setSelectedStatus(
        result.enquiry.status === "CLOSED"
          ? "NEW"
          : result.enquiry.status,
      );

      setEnquiries((current) =>
        current.map((enquiry) =>
          enquiry.id === result.enquiry?.id
            ? toWorkspaceItem(result.enquiry)
            : enquiry,
        ),
      );

      setSuccessMessage(
        result.message ??
          "Enquiry updated successfully.",
      );

      router.refresh();

      return result.enquiry;
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update this enquiry.",
      );

      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleScheduleFollowUp(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!nextFollowUpAt) {
      setError(
        "Please select the next follow-up date and time.",
      );
      return;
    }

    const date = new Date(nextFollowUpAt);

    if (Number.isNaN(date.getTime())) {
      setError(
        "Please select a valid follow-up date and time.",
      );
      return;
    }

    const updated = await updateEnquiry({
      action: "SCHEDULE_FOLLOW_UP",
      nextFollowUpAt: date.toISOString(),
      followUpNote,
    });

    if (updated) {
      setNextFollowUpAt("");
      setFollowUpNote("");
    }
  }

  async function handleStatusUpdate() {
    await updateEnquiry({
      action: "UPDATE_STATUS",
      status: selectedStatus,
      followUpNote,
    });
  }

  async function handleCloseEnquiry() {
    await updateEnquiry({
      action: "CLOSE",
      reason: closeReason,
    });

    setCloseReason("");
  }

  async function handleReopenEnquiry() {
    await updateEnquiry({
      action: "REOPEN",
      reason:
        "Parent enquiry returned to the active list.",
    });
  }

  const tabs: Array<{
    value: WorkspaceTab;
    label: string;
  }> = [
    {
      value: "ACTIVE",
      label: "Active",
    },
    {
      value: "FOLLOW_UP",
      label: "Follow-ups Due",
    },
    {
      value: "ADMITTED",
      label: "Admitted",
    },
    {
      value: "CLOSED",
      label: "Closed",
    },
    {
      value: "ALL",
      label: "All",
    },
  ];

  return (
    <>
      <section className="overflow-hidden rounded-[28px] border border-[#E9E2ED] bg-white shadow-[0_18px_50px_rgba(45,23,54,0.07)]">
        <div className="border-b border-[#EEE8F1] bg-[#FAF8FC] p-5 sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7A459C]">
                Enquiry workspace
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#2D1736] sm:text-3xl">
                Parent enquiry register
              </h2>

              <p className="mt-2 text-sm font-semibold leading-6 text-[#817684]">
                Open any enquiry to manage its complete
                journey and follow-up history.
              </p>
            </div>

                        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center xl:w-auto">
              <label className="relative block w-full sm:min-w-[320px] xl:w-[360px]">
                <span className="sr-only">
                  Search enquiries
                </span>

                <Search
                  aria-hidden="true"
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8C7F91]"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search parent, child, phone or ID"
                  className="min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white py-3 pl-11 pr-4 text-sm font-semibold text-[#2D1736] outline-none transition placeholder:text-[#A89FAB] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
                />
              </label>

              <label className="block shrink-0">
                <span className="sr-only">
                  Filter by lead source
                </span>
                <select
                  value={sourceFilter}
                  onChange={(event) =>
                    setSourceFilter(event.target.value)
                  }
                  className="min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-black text-[#4F4354] outline-none transition focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 sm:w-[170px]"
                >
                  <option value="ALL">All sources</option>
                  {Object.entries(sourceLabels).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <a
                href="/api/admin/enquiries?format=csv"
                download
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#2D1736] px-5 text-sm font-black text-white shadow-[0_10px_25px_rgba(45,23,54,0.18)] transition hover:-translate-y-0.5 hover:bg-[#5B2A86]"
              >
                <Download
                  aria-hidden="true"
                  size={18}
                />
                Export All Data
              </a>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto border-b border-[#EEE8F1] px-4 py-3 sm:px-6">
          <div className="flex min-w-max gap-2">
            {tabs.map((tab) => {
              const active =
                activeTab === tab.value;

              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() =>
                    setActiveTab(tab.value)
                  }
                  className={[
                    "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-black transition",
                    active
                      ? "bg-[#5B2A86] text-white shadow-[0_8px_20px_rgba(91,42,134,0.18)]"
                      : "border border-[#E5DCE9] bg-white text-[#625768] hover:bg-[#F4ECF8] hover:text-[#5B2A86]",
                  ].join(" ")}
                >
                  {tab.label}

                  <span
                    className={[
                      "rounded-full px-2 py-0.5 text-[10px]",
                      active
                        ? "bg-white/15 text-white"
                        : "bg-[#F1E8F5] text-[#6A328F]",
                    ].join(" ")}
                  >
                    {tabCounts[tab.value]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {visibleEnquiries.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[#DCCFE3] bg-[#FCFAFD] px-5 py-10 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#F1E7F5] text-[#5B2A86]">
                <MessageSquareText
                  aria-hidden="true"
                  size={28}
                />
              </span>

              <h3 className="mt-5 text-xl font-black text-[#2D1736]">
                No matching enquiries
              </h3>

              <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-[#817684]">
                Change the selected tab or clear the search
                to view other enquiries.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {visibleEnquiries.map((enquiry) => {
                const followUpDue =
                  isFollowUpDue(enquiry);

                return (
                  <article
                    key={enquiry.id}
                    className={[
                      "rounded-[24px] border bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(45,23,54,0.09)]",
                      followUpDue
                        ? "border-amber-300 shadow-[0_12px_35px_rgba(180,120,0,0.08)]"
                        : "border-[#E9E2ED]",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-[0.1em] text-[#7A459C]">
                          {enquiry.enquiryNumber}
                        </p>

                        <h3 className="mt-2 truncate text-xl font-black text-[#2D1736]">
                          {enquiry.parentName}
                        </h3>

                        <p className="mt-1 truncate text-sm font-semibold text-[#817684]">
                          {enquiry.childName
                            ? `Child: ${enquiry.childName}`
                            : "Child name not entered"}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span
                          className={[
                            "rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.07em]",
                            statusStyles[enquiry.status],
                          ].join(" ")}
                        >
                          {statusLabels[enquiry.status]}
                        </span>
                        <span
                          className={[
                            "rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.06em]",
                            sourceStyles[enquiry.source] ??
                              sourceStyles.OTHER,
                          ].join(" ")}
                        >
                          {sourceLabels[enquiry.source] ??
                            enquiry.source}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-[#FAF8FC] p-3.5">
                        <p className="text-[10px] font-black uppercase tracking-[0.09em] text-[#8B808F]">
                          Programme
                        </p>

                        <p className="mt-1 text-sm font-black text-[#2D1736]">
                          {enquiry.programme
                            ? programmeLabels[
                                enquiry.programme
                              ] ?? enquiry.programme
                            : "Not selected"}
                        </p>
                      </div>

                      <div
                        className={[
                          "rounded-2xl p-3.5",
                          followUpDue
                            ? "bg-amber-50"
                            : "bg-[#FAF8FC]",
                        ].join(" ")}
                      >
                        <p className="text-[10px] font-black uppercase tracking-[0.09em] text-[#8B808F]">
                          Next follow-up
                        </p>

                        <p
                          className={[
                            "mt-1 text-sm font-black",
                            followUpDue
                              ? "text-amber-700"
                              : "text-[#2D1736]",
                          ].join(" ")}
                        >
                          {formatDateTime(
                            enquiry.nextFollowUpAt,
                          )}
                        </p>
                      </div>
                    </div>

                    {enquiry.lastWebsiteSubmissionAt ? (
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-green-100 bg-green-50 px-3.5 py-3 text-xs font-bold text-green-800">
                        <span>
                          Website lead received {formatDateTime(enquiry.lastWebsiteSubmissionAt)}
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.06em] text-green-700">
                          {enquiry.websiteSubmissionCount} submission{enquiry.websiteSubmissionCount === 1 ? "" : "s"}
                        </span>
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={() =>
                        void openEnquiry(enquiry.id)
                      }
                      className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-4 text-sm font-black text-white transition hover:bg-[#4B206F]"
                    >
                      Manage Enquiry
                      <ChevronRight
                        aria-hidden="true"
                        size={17}
                      />
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {activeEnquiryId ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Manage enquiry"
          className="fixed inset-0 z-[100] flex justify-end bg-[#1F1028]/55 backdrop-blur-sm"
        >
          <button
            type="button"
            aria-label="Close enquiry window"
            onClick={closeDrawer}
            className="absolute inset-0 cursor-default"
          />

          <aside className="relative z-10 h-full w-full max-w-2xl overflow-y-auto bg-[#F8F5FA] shadow-[-24px_0_70px_rgba(31,16,40,0.24)]">
            <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-[#E6DDE9] bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7A459C]">
                  Enquiry details
                </p>

                <h2 className="mt-1 text-xl font-black text-[#2D1736]">
                  {selectedEnquiry?.parentName ??
                    "Loading enquiry…"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeDrawer}
                disabled={saving}
                aria-label="Close enquiry window"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#E5DCE9] bg-white text-[#625768] transition hover:bg-[#F3EAF8] hover:text-[#5B2A86] disabled:opacity-50"
              >
                <X aria-hidden="true" size={20} />
              </button>
            </header>

            {loadingEnquiry ? (
              <div className="flex min-h-[500px] items-center justify-center">
                <LoaderCircle
                  aria-hidden="true"
                  size={30}
                  className="animate-spin text-[#5B2A86]"
                />
              </div>
            ) : selectedEnquiry ? (
              <div className="space-y-5 p-5 sm:p-6">
                <section className="rounded-[24px] bg-[#2D1736] p-5 text-white">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.1em] text-[#F6C84B]">
                        {selectedEnquiry.enquiryNumber}
                      </p>

                      <h3 className="mt-2 text-2xl font-black">
                        {selectedEnquiry.parentName}
                      </h3>

                      <p className="mt-1 text-sm font-semibold text-white/70">
                        {selectedEnquiry.childName
                          ? `Child: ${selectedEnquiry.childName}`
                          : "Child name not entered"}
                      </p>
                    </div>

                    <span
                      className={[
                        "w-fit rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.07em]",
                        statusStyles[
                          selectedEnquiry.status
                        ],
                      ].join(" ")}
                    >
                      {
                        statusLabels[
                          selectedEnquiry.status
                        ]
                      }
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <a
                      href={`tel:${selectedEnquiry.phone}`}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-[#5B2A86]"
                    >
                      <Phone
                        aria-hidden="true"
                        size={17}
                      />
                      Call
                    </a>

                    <a
                      href={createWhatsAppLink(
                        selectedEnquiry.phone,
                        selectedEnquiry.parentName,
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 text-sm font-black text-white"
                    >
                      <MessageSquareText
                        aria-hidden="true"
                        size={17}
                      />
                      WhatsApp
                    </a>
                  </div>
                </section>

                {error ? (
                  <div
                    role="alert"
                    className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700"
                  >
                    {error}
                  </div>
                ) : null}

                {successMessage ? (
                  <div
                    role="status"
                    className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold leading-6 text-green-700"
                  >
                    <CheckCircle2
                      aria-hidden="true"
                      size={19}
                      className="mt-0.5 shrink-0"
                    />

                    {successMessage}
                  </div>
                ) : null}

                <section className="grid gap-3 sm:grid-cols-2">
                  <DetailValue
                    label="Phone"
                    value={selectedEnquiry.phone}
                  />

                  <DetailValue
                    label="Programme"
                    value={
                      selectedEnquiry.programme
                        ? programmeLabels[
                            selectedEnquiry.programme
                          ] ??
                          selectedEnquiry.programme
                        : "Not selected"
                    }
                  />

                  <DetailValue
                    label="Source"
                    value={
                      sourceLabels[
                        selectedEnquiry.source
                      ] ?? selectedEnquiry.source
                    }
                  />

                  <DetailValue
                    label="Actual lead channel"
                    value={
                      selectedEnquiry.latestTrafficChannel
                        ? trafficChannelLabels[selectedEnquiry.latestTrafficChannel] ??
                          selectedEnquiry.latestTrafficChannel
                        : "Not yet identified"
                    }
                  />

                  <DetailValue
                    label="Website submissions"
                    value={
                      selectedEnquiry.websiteSubmissionCount > 0
                        ? selectedEnquiry.websiteSubmissionCount.toString()
                        : "None"
                    }
                  />

                  <DetailValue
                    label="Latest website lead"
                    value={formatDateTime(
                      selectedEnquiry.lastWebsiteSubmissionAt,
                    )}
                  />

                  <DetailValue
                    label="Next follow-up"
                    value={formatDateTime(
                      selectedEnquiry.nextFollowUpAt,
                    )}
                  />
                </section>

                {selectedEnquiry.websiteSubmissions.length > 0 ? (
                  <section className="rounded-[24px] border border-[#DDEBDD] bg-[#F7FCF8] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-green-700">
                          Digital lead history
                        </p>
                        <h3 className="mt-1 text-lg font-black text-[#2D1736]">
                          Website and advertising submissions
                        </h3>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.07em] text-green-700">
                        {selectedEnquiry.websiteSubmissions.length} shown
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {selectedEnquiry.websiteSubmissions.map(
                        (submission) => (
                          <article
                            key={submission.id}
                            className="rounded-2xl border border-[#DDEBDD] bg-white p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span
                                className={[
                                  "rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.06em]",
                                  sourceStyles[submission.source] ??
                                    sourceStyles.OTHER,
                                ].join(" ")}
                              >
                                {sourceLabels[submission.source] ??
                                  submission.source}
                              </span>
                              <time className="text-[11px] font-bold text-[#817684]">
                                {formatDateTime(submission.receivedAt)}
                              </time>
                            </div>

                            <p className="mt-3 text-sm font-black text-[#2D1736]">
                              {submission.enquiryType
                                .toLowerCase()
                                .replaceAll("_", " ")}
                            </p>

                            <div className="mt-2 space-y-1 text-xs font-semibold leading-5 text-[#716675]">
                              <p>
                                Channel: {submission.trafficChannel
                                  ? trafficChannelLabels[submission.trafficChannel] ??
                                    submission.trafficChannel
                                  : sourceLabels[submission.source] ?? submission.source}
                              </p>
                              <p>
                                Campaign: {submission.utmCampaign ?? "Organic / direct"}
                              </p>
                              <p>
                                Medium: {submission.utmMedium ?? "Not supplied"}
                              </p>
                              <p className="break-all">
                                Landing page: {submission.landingPage ?? submission.pageUrl ?? "Not supplied"}
                              </p>
                              <p>
                                Marketing consent: {submission.marketingConsent ? "Yes" : "No"}
                              </p>
                            </div>
                          </article>
                        ),
                      )}
                    </div>
                  </section>
                ) : null}

                {selectedEnquiry.status === "ADMITTED" &&
                (selectedEnquiry.latestTrafficChannel === "GOOGLE_ADS" ||
                  selectedEnquiry.latestTrafficChannel === "META_ADS") ? (
                  <section className="grid gap-3 rounded-[24px] border border-[#E5DCF0] bg-[#FAF7FC] p-5 sm:grid-cols-2">
                    <DetailValue
                      label="Google Ads admission signal"
                      value={selectedEnquiry.googleAdmissionSentAt
                        ? `Sent ${formatDateTime(selectedEnquiry.googleAdmissionSentAt)}`
                        : selectedEnquiry.googleAdmissionError
                          ? "Waiting for automatic retry"
                          : "Not applicable or pending"}
                    />
                    <DetailValue
                      label="Meta admission signal"
                      value={selectedEnquiry.metaAdmissionSentAt
                        ? `Sent ${formatDateTime(selectedEnquiry.metaAdmissionSentAt)}`
                        : selectedEnquiry.metaAdmissionError
                          ? "Waiting for automatic retry"
                          : "Not applicable or pending"}
                    />
                  </section>
                ) : null}

                <EnquiryJourneyPanel enquiryId={selectedEnquiry.id} />

                {selectedEnquiry.status !== "CLOSED" ? (
                  <>
                    <form
                      onSubmit={
                        handleScheduleFollowUp
                      }
                      className="rounded-[24px] border border-[#E7DCEB] bg-white p-5"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
                          <CalendarClock
                            aria-hidden="true"
                            size={20}
                          />
                        </span>

                        <div>
                          <h3 className="text-lg font-black text-[#2D1736]">
                            Schedule next follow-up
                          </h3>

                          <p className="mt-1 text-sm font-semibold leading-6 text-[#817684]">
                            The previous pending follow-up
                            will move into the history.
                          </p>
                        </div>
                      </div>

                      <label className="mt-5 block">
                        <span className="text-sm font-black text-[#35243E]">
                          Follow-up date and time *
                        </span>

                        <input
                          type="datetime-local"
                          min={getMinimumDateTime()}
                          value={nextFollowUpAt}
                          disabled={saving}
                          onChange={(event) =>
                            setNextFollowUpAt(
                              event.target.value,
                            )
                          }
                          className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-semibold text-[#2D1736] outline-none focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
                        />
                      </label>

                      <label className="mt-4 block">
                        <span className="text-sm font-black text-[#35243E]">
                          Conversation note
                        </span>

                        <textarea
                          value={followUpNote}
                          disabled={saving}
                          onChange={(event) =>
                            setFollowUpNote(
                              event.target.value,
                            )
                          }
                          placeholder="Example: Parent will discuss with family and confirm next week."
                          className="mt-2 min-h-24 w-full resize-y rounded-2xl border border-[#DCCFE4] bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#2D1736] outline-none focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
                        />
                      </label>

                      <button
                        type="submit"
                        disabled={saving}
                        className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-5 text-sm font-black text-white transition hover:bg-[#4B206F] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? (
                          <LoaderCircle
                            aria-hidden="true"
                            size={18}
                            className="animate-spin"
                          />
                        ) : (
                          <Send
                            aria-hidden="true"
                            size={18}
                          />
                        )}

                        Schedule Follow-up
                      </button>
                    </form>

                    <section className="rounded-[24px] border border-[#E7DCEB] bg-white p-5">
                      <h3 className="text-lg font-black text-[#2D1736]">
                        Update enquiry stage
                      </h3>

                      <select
                        value={selectedStatus}
                        disabled={saving}
                        onChange={(event) =>
                          setSelectedStatus(
                            event.target
                              .value as Exclude<
                              EnquiryStatus,
                              "CLOSED"
                            >,
                          )
                        }
                        className="mt-4 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-semibold text-[#2D1736] outline-none focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
                      >
                        {statusOptions.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          void handleStatusUpdate()
                        }
                        disabled={saving}
                        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#DCCFE4] bg-[#F7F1FA] px-4 text-sm font-black text-[#5B2A86] transition hover:bg-[#EFE3F5] disabled:opacity-60"
                      >
                        <UserRoundCheck
                          aria-hidden="true"
                          size={17}
                        />
                        Save Stage
                      </button>
                    </section>

                    <section className="rounded-[24px] border border-red-200 bg-red-50 p-5">
                      <h3 className="text-lg font-black text-red-800">
                        Close enquiry
                      </h3>

                      <p className="mt-1 text-sm font-semibold leading-6 text-red-700">
                        Closed enquiries remain searchable
                        and can be reopened later.
                      </p>

                      <textarea
                        value={closeReason}
                        disabled={saving}
                        onChange={(event) =>
                          setCloseReason(
                            event.target.value,
                          )
                        }
                        placeholder="Reason for closing the enquiry"
                        className="mt-4 min-h-20 w-full resize-y rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-[#2D1736] outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          void handleCloseEnquiry()
                        }
                        disabled={saving}
                        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-60"
                      >
                        <XCircle
                          aria-hidden="true"
                          size={17}
                        />
                        Close Enquiry
                      </button>
                    </section>
                  </>
                ) : (
                  <section className="rounded-[24px] border border-green-200 bg-green-50 p-5">
                    <h3 className="text-lg font-black text-green-800">
                      This enquiry is closed
                    </h3>

                    <p className="mt-1 text-sm font-semibold leading-6 text-green-700">
                      Reopen it if the parent contacts the
                      centre again.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        void handleReopenEnquiry()
                      }
                      disabled={saving}
                      className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-green-700 px-4 text-sm font-black text-white transition hover:bg-green-800 disabled:opacity-60"
                    >
                      <RotateCcw
                        aria-hidden="true"
                        size={17}
                      />
                      Reopen Enquiry
                    </button>
                  </section>
                )}

                <section className="rounded-[24px] border border-[#E7DCEB] bg-white p-5">
                  <div className="flex items-center gap-3">
                    <Clock3
                      aria-hidden="true"
                      size={20}
                      className="text-[#5B2A86]"
                    />

                    <h3 className="text-lg font-black text-[#2D1736]">
                      Follow-up history
                    </h3>
                  </div>

                  {selectedEnquiry.followUps.length ===
                  0 ? (
                    <p className="mt-4 rounded-2xl bg-[#FAF8FC] p-4 text-sm font-semibold text-[#817684]">
                      No follow-up activity has been
                      recorded.
                    </p>
                  ) : (
                    <div className="mt-5 space-y-4">
                      {selectedEnquiry.followUps.map(
                        (followUp) => (
                          <article
                            key={followUp.id}
                            className="relative border-l-2 border-[#D8C6E2] pl-5"
                          >
                            <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-[#5B2A86]" />

                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <h4 className="text-sm font-black text-[#2D1736]">
                                {followUp.title}
                              </h4>

                              <span className="rounded-full bg-[#F3EAF8] px-2.5 py-1 text-[10px] font-black uppercase text-[#5B2A86]">
                                {followUp.status}
                              </span>
                            </div>

                            <p className="mt-1 text-xs font-bold text-[#817684]">
                              {formatDateTime(
                                followUp.dueAt,
                              )}
                            </p>

                            {followUp.notes ? (
                              <p className="mt-2 text-sm font-semibold leading-6 text-[#625768]">
                                {followUp.notes}
                              </p>
                            ) : null}
                          </article>
                        ),
                      )}
                    </div>
                  )}
                </section>
              </div>
            ) : (
              <div className="p-6">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                  {error ||
                    "The enquiry could not be loaded."}
                </div>
              </div>
            )}
          </aside>
        </div>
      ) : null}
    </>
  );
}

function DetailValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-2xl border border-[#E9E2ED] bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8B808F]">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-black text-[#2D1736]">
        {value}
      </p>
    </article>
  );
}
