"use client";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  LoaderCircle,
  Palette,
  PartyPopper,
  Plus,
  RefreshCcw,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type CalendarEventType =
  | "ACADEMIC"
  | "ACTIVITY"
  | "CELEBRATION"
  | "HOLIDAY"
  | "MEETING"
  | "DEADLINE"
  | "OTHER";

type Programme =
  | "PLAYGROUP"
  | "NURSERY"
  | "JUNIOR_KG"
  | "SENIOR_KG"
  | "DAYCARE";

type CalendarDocument = {
  id: string;
  title: string;
  academicYear: string | null;
  sourceRegion: string | null;
  fileName: string;
  mimeType: string;
  fileSize: number;
  active: boolean;
  createdAt: string;
  eventCount: number;
};

type CalendarEvent = {
  id: string;
  title: string;
  eventType: CalendarEventType;
  startDate: string;
  endDate: string | null;
  allDay: boolean;
  startTime: string | null;
  endTime: string | null;
  programmes: Programme[];
  description: string | null;
  documentId: string | null;
  active: boolean;
};

type CalendarResponse = {
  success: boolean;
  message?: string;
  canManage?: boolean;
  documents?: CalendarDocument[];
  events?: CalendarEvent[];
  warnings?: string[];
};

type EventForm = {
  eventId: string;
  title: string;
  eventType: CalendarEventType;
  startDate: string;
  endDate: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
  programmes: Programme[];
  description: string;
};

const initialEventForm: EventForm = {
  eventId: "",
  title: "",
  eventType: "ACADEMIC",
  startDate: "",
  endDate: "",
  allDay: true,
  startTime: "",
  endTime: "",
  programmes: [],
  description: "",
};

const eventTypeOptions: Array<{
  value: CalendarEventType;
  label: string;
}> = [
  { value: "ACADEMIC", label: "Academic" },
  { value: "ACTIVITY", label: "Activity" },
  { value: "CELEBRATION", label: "Celebration" },
  { value: "HOLIDAY", label: "Holiday / Break" },
  { value: "MEETING", label: "Meeting" },
  { value: "DEADLINE", label: "Deadline" },
  { value: "OTHER", label: "Other" },
];

const programmeOptions: Array<{
  value: Programme;
  label: string;
}> = [
  { value: "PLAYGROUP", label: "Playgroup" },
  { value: "NURSERY", label: "Nursery" },
  { value: "JUNIOR_KG", label: "Junior KG" },
  { value: "SENIOR_KG", label: "Senior KG" },
  { value: "DAYCARE", label: "Daycare" },
];

const eventStyles: Record<CalendarEventType, string> = {
  ACADEMIC: "border-blue-200 bg-blue-50 text-blue-700",
  ACTIVITY: "border-violet-200 bg-violet-50 text-violet-700",
  CELEBRATION: "border-pink-200 bg-pink-50 text-pink-700",
  HOLIDAY: "border-red-200 bg-red-50 text-red-700",
  MEETING: "border-amber-200 bg-amber-50 text-amber-700",
  DEADLINE: "border-orange-200 bg-orange-50 text-orange-700",
  OTHER: "border-slate-200 bg-slate-50 text-slate-700",
};

const activitySuggestions: Array<{
  title: string;
  eventType: CalendarEventType;
  description: string;
}> = [
  {
    title: "Red Day",
    eventType: "ACTIVITY",
    description: "Children wear red, identify red objects and enjoy a red colour-sorting and art activity.",
  },
  {
    title: "Yellow Day",
    eventType: "ACTIVITY",
    description: "Children explore yellow objects, fruits, flowers and a bright yellow-themed craft.",
  },
  {
    title: "Blue Day",
    eventType: "ACTIVITY",
    description: "Blue dress theme, water-and-sky conversation and a blue sensory or art activity.",
  },
  {
    title: "Green Day",
    eventType: "ACTIVITY",
    description: "Green dress theme, plant learning and a nature-focused classroom activity.",
  },
  {
    title: "Orange Day",
    eventType: "ACTIVITY",
    description: "Orange dress theme, fruit exploration and colour-mixing art activity.",
  },
  {
    title: "Pink Day",
    eventType: "ACTIVITY",
    description: "Pink dress theme, object recognition and a creative pink-themed activity.",
  },
  {
    title: "Fruit Day",
    eventType: "ACTIVITY",
    description: "Fruit identification, healthy-eating conversation and a supervised tasting activity.",
  },
  {
    title: "Vegetable Day",
    eventType: "ACTIVITY",
    description: "Vegetable market role play, healthy-food learning and sorting activity.",
  },
  {
    title: "Community Helpers Day",
    eventType: "ACTIVITY",
    description: "Dress-up and role play to learn about doctors, teachers, police, firefighters and other helpers.",
  },
  {
    title: "Fancy Dress Day",
    eventType: "ACTIVITY",
    description: "Age-appropriate fancy dress, short introductions and confidence-building participation.",
  },
  {
    title: "Show and Tell",
    eventType: "ACTIVITY",
    description: "Children bring or choose an object and speak briefly to build language and confidence.",
  },
  {
    title: "Annual Sports Day",
    eventType: "ACTIVITY",
    description: "Child-friendly races, movement stations, teamwork and family participation.",
  },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function formatDateRange(event: CalendarEvent) {
  const start = formatDate(event.startDate);
  const end = event.endDate ? formatDate(event.endDate) : null;
  return end && end !== start ? `${start} – ${end}` : start;
}

function toInputDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function formatFileSize(value: number) {
  return value >= 1024 * 1024
    ? `${(value / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(value / 1024))} KB`;
}

function getCalendarWindow() {
  const year = new Date().getFullYear();
  return {
    from: `${year}-01-01`,
    to: `${year + 1}-12-31`,
  };
}

export default function CalendarWorkspace() {
  const [documents, setDocuments] = useState<CalendarDocument[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [calendarTitle, setCalendarTitle] = useState("");
  const [region, setRegion] = useState("Delhi, NCR, UK, Haryana");
  const [eventForm, setEventForm] = useState<EventForm>(initialEventForm);
  const [filter, setFilter] = useState<CalendarEventType | "ALL">("ALL");
  const [plannerYear, setPlannerYear] = useState(String(new Date().getFullYear()));

  const loadCalendar = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const window = getCalendarWindow();
      const response = await fetch(
        `/api/admin/calendar?from=${window.from}&to=${window.to}`,
        { cache: "no-store" },
      );
      const result = (await response.json()) as CalendarResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "The calendar could not be loaded.");
      }

      setDocuments(result.documents ?? []);
      setEvents(result.events ?? []);
      setCanManage(Boolean(result.canManage));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "The calendar could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // The workspace must load the authenticated calendar after the client mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCalendar();
  }, [loadCalendar]);

  const activeDocument = useMemo(
    () => documents.find((document) => document.active) ?? null,
    [documents],
  );

  const visibleEvents = useMemo(
    () =>
      events.filter((event) => filter === "ALL" || event.eventType === filter),
    [events, filter],
  );

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return visibleEvents.filter(
      (event) => new Date(event.endDate ?? event.startDate) >= now,
    );
  }, [visibleEvents]);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError("Choose the Kidzee calendar PDF first.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    setWarnings([]);

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("title", calendarTitle);
      formData.set("region", region);

      const response = await fetch("/api/admin/calendar", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as CalendarResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "The calendar could not be uploaded.");
      }

      setMessage(result.message ?? "The new calendar is active.");
      setWarnings(result.warnings ?? []);
      setFile(null);
      setCalendarTitle("");
      const fileInput = document.getElementById("calendar-file") as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }

      await loadCalendar();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "The calendar could not be uploaded.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleEventSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: eventForm.eventId ? "update-event" : "create-event",
          ...eventForm,
        }),
      });
      const result = (await response.json()) as CalendarResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "The event could not be saved.");
      }

      setMessage(result.message ?? "Calendar event saved.");
      setEventForm(initialEventForm);
      await loadCalendar();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The event could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function createPreschoolPlanner() {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-preschool-template",
          year: Number(plannerYear),
        }),
      });
      const result = (await response.json()) as CalendarResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "The preschool planner could not be created.");
      }

      setMessage(result.message ?? "The preschool planner is ready.");
      await loadCalendar();
    } catch (plannerError) {
      setError(
        plannerError instanceof Error
          ? plannerError.message
          : "The preschool planner could not be created.",
      );
    } finally {
      setSaving(false);
    }
  }

  function selectActivitySuggestion(suggestion: (typeof activitySuggestions)[number]) {
    setEventForm({
      ...initialEventForm,
      title: suggestion.title,
      eventType: suggestion.eventType,
      description: suggestion.description,
    });
    document.getElementById("event-editor")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function editEvent(event: CalendarEvent) {
    setEventForm({
      eventId: event.id,
      title: event.title,
      eventType: event.eventType,
      startDate: toInputDate(event.startDate),
      endDate: event.endDate ? toInputDate(event.endDate) : "",
      allDay: event.allDay,
      startTime: event.startTime ?? "",
      endTime: event.endTime ?? "",
      programmes: event.programmes,
      description: event.description ?? "",
    });
    document.getElementById("event-editor")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  async function removeEvent(event: CalendarEvent) {
    if (!window.confirm(`Remove “${event.title}” from the active calendar?`)) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/calendar?eventId=${encodeURIComponent(event.id)}`,
        { method: "DELETE" },
      );
      const result = (await response.json()) as CalendarResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "The event could not be removed.");
      }

      setMessage(result.message ?? "Calendar event removed.");
      await loadCalendar();
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "The event could not be removed.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-7">
      {error ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {error}
        </div>
      ) : null}

      {message ? (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-bold text-green-700">
          <CheckCircle2 aria-hidden="true" size={19} className="mt-0.5 shrink-0" />
          {message}
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold leading-6 text-amber-800">
          <p className="font-black">Please review these imported rows:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[28px] border border-[#E7DEEB] bg-white p-5 shadow-[0_16px_45px_rgba(45,23,54,0.06)] sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">Active calendar</p>
              <h2 className="mt-2 text-2xl font-black text-[#2D1736]">
                {activeDocument?.title ?? "No calendar uploaded"}
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#817684]">
                {activeDocument
                  ? `${activeDocument.eventCount} imported events · ${activeDocument.sourceRegion ?? "Centre calendar"}`
                  : "Upload the Kidzee holiday PDF and its dates will be added automatically."}
              </p>
            </div>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
              <CalendarDays aria-hidden="true" size={23} />
            </span>
          </div>

          {activeDocument ? (
            <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl bg-[#FAF8FC] p-4">
              <FileText aria-hidden="true" size={18} className="text-[#6A328F]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-[#2D1736]">{activeDocument.fileName}</p>
                <p className="text-xs font-semibold text-[#817684]">
                  {formatFileSize(activeDocument.fileSize)} · {activeDocument.academicYear ?? "Year not detected"}
                </p>
              </div>
              <a
                href={`/api/admin/calendar?documentId=${encodeURIComponent(activeDocument.id)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#DDD2E2] bg-white px-4 text-xs font-black text-[#5B2A86]"
              >
                Open PDF
              </a>
            </div>
          ) : null}
        </div>

        <div className="rounded-[28px] bg-[#2D1736] p-5 text-white shadow-[0_18px_48px_rgba(45,23,54,0.16)] sm:p-7">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2D1736]">
              <Sparkles aria-hidden="true" size={22} />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.13em] text-[#F6C84B]">Automatic yearly update</p>
              <h2 className="mt-2 text-xl font-black">Upload once, review and use.</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
                A new upload archives the previous active calendar and immediately updates upcoming dashboard reminders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {canManage ? (
        <div className="space-y-6">
          <section className="overflow-hidden rounded-[30px] border border-[#E6D9EB] bg-gradient-to-br from-[#FBF8FD] via-white to-[#FFF8E7] p-5 shadow-[0_16px_45px_rgba(45,23,54,0.06)] sm:p-7">
            <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr] xl:items-start">
              <div>
                <div className="flex items-start gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#5B2A86] text-white">
                    <PartyPopper aria-hidden="true" size={21} />
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">Built-in academic planner</p>
                    <h2 className="mt-2 text-2xl font-black text-[#2D1736]">Create the complete preschool year</h2>
                  </div>
                </div>
                <p className="mt-4 text-sm font-semibold leading-6 text-[#817684]">
                  Adds Independence Day, Kargil Vijay Diwas, Friendship Day, Teachers&apos; Day, Children&apos;s Day and other important preschool observances. Existing events are kept and duplicates are skipped.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <label className="block sm:w-36">
                    <span className="text-sm font-black text-[#35243E]">Planner year</span>
                    <input
                      type="number"
                      min="2020"
                      max="2100"
                      value={plannerYear}
                      onChange={(event) => setPlannerYear(event.target.value)}
                      className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-black text-[#2D1736] outline-none focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => void createPreschoolPlanner()}
                    disabled={saving}
                    className="inline-flex min-h-12 items-center justify-center gap-2 self-end rounded-2xl bg-[#5B2A86] px-5 text-sm font-black text-white transition hover:bg-[#4B206F] disabled:opacity-60"
                  >
                    {saving ? <LoaderCircle aria-hidden="true" size={18} className="animate-spin" /> : <Sparkles aria-hidden="true" size={18} />}
                    Create Year Planner
                  </button>
                </div>
              </div>

              <div className="rounded-[24px] border border-white bg-white/80 p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF0F5] text-pink-700">
                    <Palette aria-hidden="true" size={19} />
                  </span>
                  <div>
                    <h3 className="text-lg font-black text-[#2D1736]">Schedule centre activity days</h3>
                    <p className="mt-1 text-xs font-semibold leading-5 text-[#817684]">These do not have universal dates. Select one, choose your centre&apos;s date and save it.</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {activitySuggestions.map((suggestion) => (
                    <button
                      key={suggestion.title}
                      type="button"
                      onClick={() => selectActivitySuggestion(suggestion)}
                      className="rounded-full border border-[#E4D9E8] bg-white px-3.5 py-2 text-xs font-black text-[#5B2A86] transition hover:border-[#5B2A86] hover:bg-[#F3EAF8]"
                    >
                      + {suggestion.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
          <form onSubmit={handleUpload} className="rounded-[28px] border border-[#E7DEEB] bg-white p-5 shadow-[0_16px_45px_rgba(45,23,54,0.06)] sm:p-7">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF3D5] text-[#8A6100]">
                <Upload aria-hidden="true" size={20} />
              </span>
              <div>
                <h2 className="text-xl font-black text-[#2D1736]">Upload Kidzee calendar</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-[#817684]">PDF up to 12 MB. Delhi/NCR rows are imported automatically.</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-black text-[#35243E]">Calendar PDF *</span>
                <input
                  id="calendar-file"
                  type="file"
                  accept="application/pdf,.pdf"
                  disabled={saving}
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  className="mt-2 block min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 py-3 text-sm font-semibold text-[#2D1736] file:mr-4 file:rounded-xl file:border-0 file:bg-[#F3EAF8] file:px-4 file:py-2 file:text-xs file:font-black file:text-[#5B2A86]"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#35243E]">Calendar title</span>
                <input
                  value={calendarTitle}
                  disabled={saving}
                  onChange={(event) => setCalendarTitle(event.target.value)}
                  placeholder="Example: Kidzee Holiday Calendar 2027"
                  className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-semibold text-[#2D1736] outline-none focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#35243E]">Region column</span>
                <input
                  value={region}
                  disabled={saving}
                  onChange={(event) => setRegion(event.target.value)}
                  className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-semibold text-[#2D1736] outline-none focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-5 text-sm font-black text-white transition hover:bg-[#4B206F] disabled:opacity-60"
            >
              {saving ? <LoaderCircle aria-hidden="true" size={18} className="animate-spin" /> : <Upload aria-hidden="true" size={18} />}
              Upload &amp; Activate Calendar
            </button>
          </form>

          <form id="event-editor" onSubmit={handleEventSave} className="scroll-mt-24 rounded-[28px] border border-[#E7DEEB] bg-white p-5 shadow-[0_16px_45px_rgba(45,23,54,0.06)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7A459C]">Manual event</p>
                <h2 className="mt-2 text-xl font-black text-[#2D1736]">
                  {eventForm.eventId ? "Edit calendar event" : "Add calendar event"}
                </h2>
              </div>
              {eventForm.eventId ? (
                <button type="button" onClick={() => setEventForm(initialEventForm)} className="rounded-xl border border-[#DDD2E2] px-3 py-2 text-xs font-black text-[#5B2A86]">
                  Cancel edit
                </button>
              ) : null}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-sm font-black text-[#35243E]">Event title *</span>
                <input
                  value={eventForm.title}
                  onChange={(event) => setEventForm((current) => ({ ...current, title: event.target.value }))}
                  required
                  className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] px-4 text-sm font-semibold outline-none focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#35243E]">Event type *</span>
                <select
                  value={eventForm.eventType}
                  onChange={(event) => setEventForm((current) => ({ ...current, eventType: event.target.value as CalendarEventType }))}
                  className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-semibold outline-none"
                >
                  {eventTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#35243E]">Start date *</span>
                <input
                  type="date"
                  value={eventForm.startDate}
                  onChange={(event) => setEventForm((current) => ({ ...current, startDate: event.target.value }))}
                  required
                  className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] px-4 text-sm font-semibold outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#35243E]">End date</span>
                <input
                  type="date"
                  value={eventForm.endDate}
                  onChange={(event) => setEventForm((current) => ({ ...current, endDate: event.target.value }))}
                  min={eventForm.startDate || undefined}
                  className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] px-4 text-sm font-semibold outline-none"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="text-sm font-black text-[#35243E]">Description</span>
                <textarea
                  value={eventForm.description}
                  onChange={(event) => setEventForm((current) => ({ ...current, description: event.target.value }))}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-[#DCCFE4] px-4 py-3 text-sm font-semibold outline-none focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
                />
              </label>
            </div>

            <div className="mt-4">
              <p className="text-sm font-black text-[#35243E]">Programmes</p>
              <p className="mt-1 text-xs font-semibold text-[#817684]">Leave all unchecked when the event is for the whole centre.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {programmeOptions.map((option) => {
                  const selected = eventForm.programmes.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setEventForm((current) => ({
                        ...current,
                        programmes: selected
                          ? current.programmes.filter((programme) => programme !== option.value)
                          : [...current.programmes, option.value],
                      }))}
                      className={`rounded-full border px-3.5 py-2 text-xs font-black transition ${selected ? "border-[#5B2A86] bg-[#5B2A86] text-white" : "border-[#DDD2E2] bg-white text-[#625768]"}`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button type="submit" disabled={saving} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-5 text-sm font-black text-white disabled:opacity-60">
              {saving ? <LoaderCircle aria-hidden="true" size={18} className="animate-spin" /> : <Plus aria-hidden="true" size={18} />}
              {eventForm.eventId ? "Save Event Changes" : "Add Event"}
            </button>
          </form>
          </section>
        </div>
      ) : null}

      <section className="rounded-[30px] border border-[#E7DEEB] bg-white p-5 shadow-[0_16px_45px_rgba(45,23,54,0.06)] sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">Upcoming calendar</p>
            <h2 className="mt-2 text-2xl font-black text-[#2D1736]">What is coming next</h2>
            <p className="mt-2 text-sm font-semibold text-[#817684]">Tomorrow’s events appear automatically on the dashboard.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as CalendarEventType | "ALL")}
              className="min-h-11 rounded-xl border border-[#DDD2E2] bg-white px-4 text-xs font-black text-[#5B2A86]"
            >
              <option value="ALL">All event types</option>
              {eventTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <button type="button" onClick={() => void loadCalendar()} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#DDD2E2] bg-white px-4 text-xs font-black text-[#5B2A86]">
              <RefreshCcw aria-hidden="true" size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-48 items-center justify-center text-[#6A328F]">
            <LoaderCircle aria-hidden="true" size={30} className="animate-spin" />
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-[#FAF8FC] p-8 text-center">
            <CalendarDays aria-hidden="true" size={30} className="mx-auto text-[#A08DA8]" />
            <p className="mt-3 text-sm font-bold text-[#817684]">No upcoming events in this filter.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {upcomingEvents.map((event) => (
              <article key={event.id} className="rounded-[24px] border border-[#E9E2ED] bg-[#FCFBFD] p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${eventStyles[event.eventType]}`}>
                    {eventTypeOptions.find((option) => option.value === event.eventType)?.label ?? event.eventType}
                  </span>
                  {canManage ? (
                    <div className="flex gap-1">
                      <button type="button" onClick={() => editEvent(event)} className="rounded-lg px-2.5 py-1.5 text-xs font-black text-[#5B2A86] hover:bg-[#F3EAF8]">Edit</button>
                      <button type="button" onClick={() => void removeEvent(event)} className="rounded-lg p-2 text-red-600 hover:bg-red-50" aria-label={`Remove ${event.title}`}>
                        <Trash2 aria-hidden="true" size={15} />
                      </button>
                    </div>
                  ) : null}
                </div>
                <h3 className="mt-4 text-lg font-black leading-6 text-[#2D1736]">{event.title}</h3>
                <p className="mt-3 flex items-center gap-2 text-sm font-black text-[#6A328F]">
                  <CalendarDays aria-hidden="true" size={16} />
                  {formatDateRange(event)}
                </p>
                {!event.allDay && event.startTime ? (
                  <p className="mt-2 flex items-center gap-2 text-xs font-bold text-[#817684]">
                    <Clock3 aria-hidden="true" size={14} />
                    {event.startTime}{event.endTime ? ` – ${event.endTime}` : ""}
                  </p>
                ) : null}
                {event.description ? <p className="mt-3 text-sm font-semibold leading-6 text-[#817684]">{event.description}</p> : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
