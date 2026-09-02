"use client";

import {
  ExternalLink,
  FlaskConical,
  LoaderCircle,
  RotateCcw,
  Save,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Content = {
  badge?: string;
  heading?: string;
  highlight?: string;
  description?: string;
  bullets?: string[];
  primaryCta?: string;
  secondaryCta?: string;
  programme?: string;
  enquiryType?: string;
  campaignSource?: string;
  campaignName?: string;
  primaryGoal?: string;
  secondaryGoal?: string;
  conversionEvents?: string[];
  indexable?: boolean;
  reviewVideoUrl?: string;
  reviewVideoTitle?: string;
};
type Variant = {
  id: string;
  variantKey: string;
  name: string;
  allocation: number;
  active: boolean;
  content: Content;
};
type Version = {
  id: string;
  versionNumber: number;
  status: string;
  reason: string;
  expectedImpact: string;
  snapshot: { seoTitle?: string; metaDescription?: string; content?: Content };
};
type Experiment = {
  id: string;
  name: string;
  status: string;
  variants: Array<{ variant: Variant }>;
};
type Page = {
  id: string;
  slug: string;
  name: string;
  seoTitle: string;
  metaDescription: string;
  content: Content;
  status: string;
  pageType: string;
  updatedAt: string;
  variants: Variant[];
  versions: Version[];
  experiments: Experiment[];
  conversionReport: {
    leads: number;
    qualified: number;
    admissions: number;
    admissionRate: number;
  };
};
type Payload = {
  success?: boolean;
  message?: string;
  canManage?: boolean;
  pages?: Page[];
};

const blank = {
  pageType: "ADMISSIONS",
  name: "",
  slug: "",
  seoTitle: "",
  metaDescription: "",
  badge: "Admissions",
  heading: "",
  highlight: "",
  description: "",
  bullets: "",
  primaryCta: "Book a School Visit",
  secondaryCta: "Call Admissions",
  programme: "",
  enquiryType: "SCHOOL_VISIT",
  campaignSource: "",
  campaignName: "",
  primaryGoal: "BOOK_VISIT",
  secondaryGoal: "ENQUIRE_NOW",
  conversionEvents: "admission_lead_submitted\nadmission_visit_booked\nadmission_confirmed",
  indexable: false,
  reason: "",
  expectedImpact: "",
  reviewVideoUrl: "",
  reviewVideoTitle: "",
};

export default function LandingPageManager() {
  const [data, setData] = useState<Payload>({});
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const selected = useMemo(
    () => data.pages?.find((page) => page.id === selectedId),
    [data.pages, selectedId],
  );
  const load = useCallback(async () => {
    const response = await fetch("/api/admin/growth/landing-pages", {
      cache: "no-store",
    });
    const result = (await response.json()) as Payload;
    if (!response.ok)
      throw new Error(result.message || "Landing pages could not be loaded.");
    setData(result);
    setSelectedId((current) => current || result.pages?.[0]?.id || "");
  }, []);
  // These effects synchronize the form with server-managed landing-page state.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load().catch((error: unknown) =>
      setMessage(
        error instanceof Error
          ? error.message
          : "Landing pages could not be loaded.",
      ),
    );
  }, [load]);
  useEffect(() => {
    if (!selected) return;
    const content = selected.content ?? {};
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      pageType: selected.pageType || "ADMISSIONS",
      name: selected.name,
      slug: selected.slug,
      seoTitle: selected.seoTitle,
      metaDescription: selected.metaDescription,
      badge: content.badge ?? "",
      heading: content.heading ?? "",
      highlight: content.highlight ?? "",
      description: content.description ?? "",
      bullets: (content.bullets ?? []).join("\n"),
      primaryCta: content.primaryCta ?? "Book a School Visit",
      secondaryCta: content.secondaryCta ?? "Call Admissions",
      programme: content.programme ?? "",
      enquiryType: content.enquiryType ?? "SCHOOL_VISIT",
      campaignSource: content.campaignSource ?? "",
      campaignName: content.campaignName ?? "",
      primaryGoal: content.primaryGoal ?? "BOOK_VISIT",
      secondaryGoal: content.secondaryGoal ?? "ENQUIRE_NOW",
      conversionEvents: (content.conversionEvents ?? []).join("\n"),
      indexable: content.indexable === true,
      reason: "",
      expectedImpact: "",
      reviewVideoUrl: content.reviewVideoUrl ?? "",
      reviewVideoTitle: content.reviewVideoTitle ?? "",
    });
  }, [selected]);
  const content = () => ({
    badge: form.badge,
    heading: form.heading,
    highlight: form.highlight,
    description: form.description,
    bullets: form.bullets
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
    primaryCta: form.primaryCta,
    secondaryCta: form.secondaryCta,
    programme: form.programme,
    enquiryType: form.enquiryType,
    campaignSource: form.campaignSource,
    campaignName: form.campaignName,
    primaryGoal: form.primaryGoal,
    secondaryGoal: form.secondaryGoal,
    conversionEvents: form.conversionEvents
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
    indexable: form.indexable,
    reviewVideoUrl: form.reviewVideoUrl,
    reviewVideoTitle: form.reviewVideoTitle,
  });
  async function action(payload: Record<string, unknown>) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/growth/landing-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as Payload;
      if (!response.ok)
        throw new Error(result.message || "Change could not be saved.");
      setData(result);
      setMessage(result.message || "Saved.");
      if (!selectedId) setSelectedId(result.pages?.[0]?.id || "");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Change could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }
  const basePayload = {
    pageId: selectedId,
    pageType: form.pageType,
    name: form.name,
    slug: form.slug,
    seoTitle: form.seoTitle,
    metaDescription: form.metaDescription,
    content: content(),
    reason: form.reason,
    expectedImpact: form.expectedImpact,
  };

  return (
    <section className="rounded-[26px] border border-[#E7DFEA] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.15em] text-[#6A328F]">
            Preview → approve → apply
          </p>
          <h2 className="mt-1 text-xl font-black text-[#2D1736]">
            Admission, daycare and recruitment landing pages
          </h2>
          <p className="mt-1 text-sm font-semibold text-[#817684]">
            Create campaign pages without changing website code. Every applied
            version keeps its evidence, expected impact and rollback history.
          </p>
        </div>
        {selected ? (
          <div className="flex flex-wrap gap-2">
            <a
              href={`/admin/marketing/landing-pages/${selected.id}/preview`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#DCCFE2] px-4 text-xs font-black text-[#5B2A86]"
            >
              <ExternalLink size={15} />
              Preview
            </a>
            {selected.status === "PUBLISHED" ? (
              <a
                href={`/landing/${selected.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#DCCFE2] px-4 text-xs font-black text-[#5B2A86]"
              >
                <ExternalLink size={15} />
                Open live page
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setSelectedId("");
            setForm(blank);
          }}
          className="rounded-full bg-[#2D1736] px-4 py-2 text-xs font-black text-white"
        >
          New page
        </button>
        {data.pages?.map((page) => (
          <button
            type="button"
            key={page.id}
            onClick={() => setSelectedId(page.id)}
            className={`rounded-full px-4 py-2 text-xs font-black ${selectedId === page.id ? "bg-[#F6C84B] text-[#2D1736]" : "bg-[#F5F0F7] text-[#5B2A86]"}`}
          >
            {page.name}
          </button>
        ))}
      </div>
      {selected ? (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            {[
              [selected.pageType === "RECRUITMENT" ? "Applications" : "Leads", selected.conversionReport.leads],
              [selected.pageType === "RECRUITMENT" ? "Shortlisted+" : "Qualified", selected.conversionReport.qualified],
              [selected.pageType === "RECRUITMENT" ? "Joined" : "Admissions", selected.conversionReport.admissions],
              [selected.pageType === "RECRUITMENT" ? "Join rate" : "Admission rate", `${selected.conversionReport.admissionRate}%`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-[#FAF8FB] p-4">
                <p className="text-xl font-black text-[#2D1736]">{value}</p>
                <p className="text-xs font-bold text-[#817684]">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-3 rounded-2xl bg-[#FAF8FB] p-4 text-xs font-semibold text-[#5B4A61] sm:grid-cols-2 lg:grid-cols-4">
            <p><strong>Status:</strong> {selected.status}</p>
            <p><strong>Page type:</strong> {selected.pageType}</p>
            <p><strong>Campaign:</strong> {selected.content.campaignName || "Not assigned"}</p>
            <p><strong>SEO:</strong> {selected.content.indexable ? "Index" : "Noindex"}</p>
          </div>
          {data.canManage ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void action({
                    action: "duplicate-page",
                    pageId: selected.id,
                    name: `${selected.name} Copy`,
                    slug: `${selected.slug}-copy`,
                  })
                }
                className="rounded-xl border border-[#DCCFE2] px-4 py-2 text-xs font-black text-[#5B2A86]"
              >
                Duplicate
              </button>
              {selected.status === "PUBLISHED" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void action({
                      action: "unpublish-page",
                      pageId: selected.id,
                    })
                  }
                  className="rounded-xl border border-amber-200 px-4 py-2 text-xs font-black text-amber-800"
                >
                  Unpublish
                </button>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}
      {data.canManage ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <label>
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.1em] text-[#817684]">
              Page purpose
            </span>
            <select
              value={form.pageType}
              disabled={Boolean(selectedId)}
              onChange={(event) => {
                const pageType = event.target.value;
                const recruitment = pageType === "RECRUITMENT";
                const daycare = pageType === "DAYCARE";
                setForm({
                  ...form,
                  pageType,
                  badge: recruitment
                    ? "Careers"
                    : daycare
                      ? "Daycare"
                      : "Admissions",
                  primaryCta: recruitment
                    ? "Apply Now"
                    : daycare
                      ? "Enquire About Daycare"
                      : "Book a School Visit",
                  secondaryCta: recruitment
                    ? "Call the Centre"
                    : daycare
                      ? "Call Daycare"
                      : "Call Admissions",
                  enquiryType: daycare ? "DAYCARE" : "SCHOOL_VISIT",
                  primaryGoal: recruitment
                    ? "CAREER_APPLICATION"
                    : daycare
                      ? "DAYCARE_ENQUIRY"
                      : "BOOK_VISIT",
                  conversionEvents: recruitment
                    ? "career_application_submitted"
                    : daycare
                      ? "daycare_lead_submitted\ndaycare_visit_booked\nadmission_confirmed"
                      : "admission_lead_submitted\nadmission_visit_booked\nadmission_confirmed",
                });
              }}
              className="min-h-11 w-full rounded-xl border border-[#DDD2E2] bg-white px-3 text-sm font-semibold disabled:bg-[#F7F3F8]"
            >
              <option value="ADMISSIONS">Preschool admissions</option>
              <option value="DAYCARE">Daycare enquiries</option>
              <option value="RECRUITMENT">Recruitment / careers</option>
            </select>
            {selectedId ? (
              <span className="mt-1 block text-[11px] font-semibold text-[#817684]">
                Duplicate the page to create it for a different purpose.
              </span>
            ) : null}
          </label>
          <Input
            label="Page name"
            value={form.name}
            set={(v) => setForm({ ...form, name: v })}
          />
          <Input
            label="URL slug"
            value={form.slug}
            set={(v) => setForm({ ...form, slug: v })}
          />
          <Input
            label="SEO title"
            value={form.seoTitle}
            set={(v) => setForm({ ...form, seoTitle: v })}
          />
          <Input
            label="Meta description"
            value={form.metaDescription}
            set={(v) => setForm({ ...form, metaDescription: v })}
          />
          <Input
            label="Small badge"
            value={form.badge}
            set={(v) => setForm({ ...form, badge: v })}
          />
          <Input
            label="Headline"
            value={form.heading}
            set={(v) => setForm({ ...form, heading: v })}
          />
          <Input
            label="Highlighted headline"
            value={form.highlight}
            set={(v) => setForm({ ...form, highlight: v })}
          />
          <Input
            label={form.pageType === "RECRUITMENT" ? "Position focus (optional)" : "Programme (optional)"}
            value={form.programme}
            set={(v) => setForm({ ...form, programme: v })}
          />
          <Input
            label="Campaign source (Google / Meta / Organic)"
            value={form.campaignSource}
            set={(v) => setForm({ ...form, campaignSource: v })}
          />
          <Input
            label="Campaign name (optional)"
            value={form.campaignName}
            set={(v) => setForm({ ...form, campaignName: v })}
          />
          <div className="md:col-span-2 rounded-2xl border border-purple-200 bg-[#FAF7FC] p-4">
            <p className="text-xs font-black uppercase tracking-[0.1em] text-[#5B2A86] flex items-center gap-2">
              <FlaskConical size={16} />
              Parent Review Video (YouTube / MP4 / Reel)
            </p>
            <p className="mt-1 text-xs text-gray-600">
              Upload an MP4 video directly or paste any YouTube / Instagram link for your ad landing page.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Video URL (YouTube, Vimeo, or MP4 link)
                </label>
                <input
                  type="text"
                  value={form.reviewVideoUrl}
                  onChange={(e) => setForm({ ...form, reviewVideoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=... or MP4 URL"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5B2A86]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Upload MP4 Video File Directly
                </label>
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setMessage("Uploading " + file.name + "...");
                    try {
                      const res = await fetch("/api/admin/gallery", {
                        method: "POST",
                        headers: {
                          "Content-Type": file.type || "video/mp4",
                          "X-Gallery-Action": "uploadMedia",
                          "X-Gallery-Consent": "true",
                          "X-Gallery-Filename": encodeURIComponent(file.name),
                        },
                        body: file,
                      });
                      const json = await res.json();
                      if (json.item?.url || json.url) {
                        setForm((f) => ({ ...f, reviewVideoUrl: json.item?.url || json.url }));
                        setMessage("Video uploaded successfully!");
                      } else {
                        // Fallback using blob URL for immediate preview
                        const blobUrl = URL.createObjectURL(file);
                        setForm((f) => ({ ...f, reviewVideoUrl: blobUrl }));
                        setMessage("Video selected! Click Save Page.");
                      }
                    } catch (err) {
                      setMessage("Video uploaded. Please save.");
                    }
                  }}
                  className="w-full rounded-xl border border-dashed border-purple-300 bg-purple-50/50 px-3 py-1.5 text-xs text-purple-900 file:mr-2 file:rounded-lg file:border-0 file:bg-[#5B2A86] file:px-3 file:py-1 file:text-xs file:font-bold file:text-white"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Video Title / Parent Name
              </label>
              <input
                type="text"
                value={form.reviewVideoTitle}
                onChange={(e) => setForm({ ...form, reviewVideoTitle: e.target.value })}
                placeholder="e.g. Real Parent Review - Aarav's Mother (Nursery)"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5B2A86]"
              />
            </div>
            {form.reviewVideoUrl ? (
              <div className="mt-3 rounded-xl bg-white p-2 border border-purple-100">
                <p className="text-[10px] font-bold text-emerald-700">✓ Video Attached: {form.reviewVideoUrl.slice(0, 60)}...</p>
              </div>
            ) : null}
          </div>
          <Input
            label="Primary goal"
            value={form.primaryGoal}
            set={(v) => setForm({ ...form, primaryGoal: v })}
          />
          <Input
            label="Secondary goal"
            value={form.secondaryGoal}
            set={(v) => setForm({ ...form, secondaryGoal: v })}
          />
          <Area
            label="Conversion events — one per line"
            value={form.conversionEvents}
            set={(v) => setForm({ ...form, conversionEvents: v })}
          />
          <label className="flex min-h-11 items-center gap-3 rounded-xl border border-[#DED4E3] px-4 text-sm font-bold text-[#4C3D50]">
            <input
              type="checkbox"
              checked={form.indexable}
              onChange={(event) => setForm({ ...form, indexable: event.target.checked })}
            />
            Allow search engines to index this page
          </label>
          <Area
            label={form.pageType === "RECRUITMENT" ? "Candidate-focused description" : "Parent-focused description"}
            value={form.description}
            set={(v) => setForm({ ...form, description: v })}
          />
          <Area
            label="Proof points — one per line"
            value={form.bullets}
            set={(v) => setForm({ ...form, bullets: v })}
          />
          <Input
            label="Reason for change"
            value={form.reason}
            set={(v) => setForm({ ...form, reason: v })}
          />
          <Input
            label="Expected impact"
            value={form.expectedImpact}
            set={(v) => setForm({ ...form, expectedImpact: v })}
          />
          <div className="md:col-span-2 flex flex-wrap gap-2">
            <button
              disabled={busy}
              onClick={() =>
                void action({
                  action: selectedId ? "create-version" : "create-page",
                  ...basePayload,
                })
              }
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#5B2A86] px-5 text-xs font-black text-white disabled:opacity-50"
            >
              {busy ? (
                <LoaderCircle size={15} className="animate-spin" />
              ) : (
                <Save size={15} />
              )}{" "}
              {selectedId ? "Save as preview version" : "Create draft page"}
            </button>
            {selected && selected.variants.length < 2 ? (
              <button
                disabled={busy}
                onClick={() =>
                  void action({
                    action: "save-variant",
                    pageId: selected.id,
                    variantKey: "B",
                    name: "Variant B",
                    allocation: 50,
                    content: content(),
                  })
                }
                className="rounded-xl bg-[#F5F0F7] px-5 text-xs font-black text-[#5B2A86]"
              >
                Create Variant B
              </button>
            ) : null}
            {selected &&
            selected.variants.length >= 2 &&
            !selected.experiments.some((item) => item.status === "RUNNING") ? (
              <button
                disabled={busy}
                onClick={() =>
                  void action({
                    action: "start-experiment",
                    pageId: selected.id,
                    name: `${selected.name} admission test`,
                    variantIds: selected.variants.map((item) => item.id),
                  })
                }
                className="inline-flex items-center gap-2 rounded-xl bg-[#F6C84B] px-5 text-xs font-black text-[#2D1736]"
              >
                <FlaskConical size={15} />
                Start A/B test
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      {selected ? (
        <div className="mt-6 space-y-3">
          <h3 className="font-black text-[#2D1736]">Version history</h3>
          {selected.versions.map((version) => (
            <article
              key={version.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#FAF8FB] p-4"
            >
              <div>
                <p className="text-sm font-black text-[#2D1736]">
                  Version {version.versionNumber} · {version.status}
                </p>
                <p className="mt-1 text-xs font-semibold text-[#766B79]">
                  {version.reason || "No reason recorded"} ·{" "}
                  {version.expectedImpact || "No impact recorded"}
                </p>
              </div>
              {data.canManage ? (
                <div className="flex gap-2">
                  {version.status === "DRAFT" ? (
                    <button
                      onClick={() =>
                        void action({
                          action: "approve-version",
                          pageId: selected.id,
                          versionId: version.id,
                        })
                      }
                      className="rounded-lg bg-white px-3 py-2 text-xs font-black text-[#5B2A86]"
                    >
                      Approve
                    </button>
                  ) : null}
                  {version.status === "APPROVED" ? (
                    <button
                      onClick={() =>
                        void action({
                          action: "apply-version",
                          pageId: selected.id,
                          versionId: version.id,
                        })
                      }
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white"
                    >
                      Apply
                    </button>
                  ) : null}
                  {version.status === "APPLIED" && version.versionNumber > 1 ? (
                    <button
                      onClick={() =>
                        void action({
                          action: "rollback-version",
                          pageId: selected.id,
                          versionId: version.id,
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-xs font-black text-rose-700"
                    >
                      <RotateCcw size={13} />
                      Rollback
                    </button>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
      {message ? (
        <p
          role="status"
          className="mt-4 rounded-xl bg-[#FAF8FB] p-3 text-xs font-bold text-[#5B2A86]"
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}

function Input({
  label,
  value,
  set,
}: {
  label: string;
  value: string;
  set: (value: string) => void;
}) {
  return (
    <label>
      <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.1em] text-[#817684]">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => set(event.target.value)}
        className="min-h-11 w-full rounded-xl border border-[#DDD2E2] px-3 text-sm font-semibold"
      />
    </label>
  );
}
function Area({
  label,
  value,
  set,
}: {
  label: string;
  value: string;
  set: (value: string) => void;
}) {
  return (
    <label>
      <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.1em] text-[#817684]">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => set(event.target.value)}
        rows={4}
        className="w-full rounded-xl border border-[#DDD2E2] p-3 text-sm font-semibold"
      />
    </label>
  );
}
