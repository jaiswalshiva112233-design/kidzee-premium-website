"use client";

import {
  AlertTriangle,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MessageSquarePlus,
  RefreshCw,
  Route,
  Send,
  UserRoundPlus,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Journey = {
  id: string;
  status: string;
  allowedTransitions: string[];
  overdueFollowUps: number;
  activities: Array<{
    id: string;
    type: string;
    title: string;
    notes: string | null;
    occurredAt: string;
    recordedBy: { name: string; role: string } | null;
  }>;
  appointments: Array<{
    id: string;
    kind: "VISIT" | "TRIAL";
    status: string;
    scheduledAt: string;
    outcome: string | null;
    parentFeedback: string | null;
  }>;
  followUps: Array<{
    id: string;
    title: string;
    notes: string | null;
    dueAt: string;
    status: string;
  }>;
  marketingJobs: Array<{
    id: string;
    provider: string;
    eventType: string;
    status: string;
    attempts: number;
    lastError: string | null;
  }>;
  conversionHistory: Array<{
    id: string;
    entityId: string;
    description: string;
    createdAt: string;
  }>;
  family: {
    familyName: string;
    enquiries: Array<{
      id: string;
      enquiryNumber: string;
      childName: string | null;
      status: string;
    }>;
  } | null;
};

function label(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function localDateTime(date = new Date(Date.now() + 24 * 60 * 60 * 1000)) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function EnquiryJourneyPanel({ enquiryId }: { enquiryId: string }) {
  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [dueAt, setDueAt] = useState(localDateTime());
  const [appointmentAt, setAppointmentAt] = useState(localDateTime());
  const [appointmentKind, setAppointmentKind] = useState<"VISIT" | "TRIAL">("VISIT");
  const [siblingEnquiryId, setSiblingEnquiryId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/enquiries/${enquiryId}/workflow`, { cache: "no-store" });
      const result = (await response.json()) as { success?: boolean; message?: string; enquiry?: Journey };
      if (!response.ok || !result.enquiry) throw new Error(result.message || "Unable to load CRM timeline.");
      setJourney(result.enquiry);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load CRM timeline.");
    } finally {
      setLoading(false);
    }
  }, [enquiryId]);

  useEffect(() => {
    // Load this enquiry's server-authoritative timeline when its panel mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function act(payload: Record<string, unknown>) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/enquiries/${enquiryId}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { message?: string; enquiry?: Journey };
      if (!response.ok || !result.enquiry) throw new Error(result.message || "The CRM action could not be saved.");
      setJourney(result.enquiry);
      setNote("");
      setSiblingEnquiryId("");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "The CRM action could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="flex items-center justify-center rounded-[24px] border border-[#E7DCEB] bg-white p-8 text-[#5B2A86]">
        <LoaderCircle className="animate-spin" aria-hidden="true" />
        <span className="ml-2 text-sm font-black">Loading CRM journey</span>
      </section>
    );
  }

  if (!journey) {
    return <section className="rounded-[24px] border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">{error || "CRM journey unavailable."}</section>;
  }

  const pendingAppointments = journey.appointments.filter((item) => item.status === "SCHEDULED");
  const pendingFollowUps = journey.followUps.filter((item) => item.status === "PENDING");

  return (
    <section className="rounded-[24px] border border-[#DCCFE4] bg-[#FBF8FD] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5B2A86] text-white"><Route size={20} aria-hidden="true" /></span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#6A328F]">CRM journey</p>
            <h3 className="mt-1 text-lg font-black text-[#2D1736]">Current stage: {label(journey.status)}</h3>
          </div>
        </div>
        <button type="button" onClick={() => void load()} className="rounded-xl border border-[#DCCFE4] bg-white p-2 text-[#5B2A86]" aria-label="Refresh CRM journey"><RefreshCw size={17} /></button>
      </div>

      {journey.overdueFollowUps > 0 ? (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-black text-amber-800">
          <AlertTriangle size={17} aria-hidden="true" /> {journey.overdueFollowUps} overdue follow-up{journey.overdueFollowUps === 1 ? "" : "s"}
        </div>
      ) : null}
      {error ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div> : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#E7DCEB] bg-white p-4">
          <h4 className="text-sm font-black text-[#2D1736]">Next valid stage</h4>
          <div className="mt-3 flex flex-wrap gap-2">
            {journey.allowedTransitions.length ? journey.allowedTransitions.filter((status) => status !== "ADMITTED").map((status) => (
              <button key={status} type="button" disabled={saving} onClick={() => void act({ action: "TRANSITION", status, notes: note })} className="rounded-xl bg-[#F2E9F7] px-3 py-2 text-xs font-black text-[#5B2A86] disabled:opacity-50">{label(status)}</button>
            )) : <p className="text-xs font-semibold text-[#817684]">No direct transition. Use Admissions to confirm an admission or reopen a closed lead.</p>}
            {(journey.status === "CLOSED" || journey.status === "NOT_INTERESTED") ? (
              <button type="button" disabled={saving} onClick={() => void act({ action: "REOPEN", notes: note })} className="rounded-xl bg-green-100 px-3 py-2 text-xs font-black text-green-800">Reopen lead</button>
            ) : null}
            {journey.status !== "CLOSED" && journey.status !== "NOT_INTERESTED" && journey.status !== "ADMITTED" ? (
              <button type="button" disabled={saving || !note.trim()} onClick={() => void act({ action: "CLOSE", notes: note })} className="rounded-xl bg-red-100 px-3 py-2 text-xs font-black text-red-800 disabled:opacity-50">Close lead</button>
            ) : null}
          </div>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Conversation note, outcome or closing reason" className="mt-3 min-h-20 w-full rounded-xl border border-[#DCCFE4] px-3 py-2 text-sm" />
          <button type="button" disabled={saving || !note.trim()} onClick={() => void act({ action: "ADD_NOTE", notes: note })} className="mt-2 inline-flex items-center gap-2 rounded-xl border border-[#DCCFE4] px-3 py-2 text-xs font-black text-[#5B2A86] disabled:opacity-50"><MessageSquarePlus size={15} /> Add note</button>
        </div>

        <div className="rounded-2xl border border-[#E7DCEB] bg-white p-4">
          <h4 className="text-sm font-black text-[#2D1736]">Follow-up reminder</h4>
          <input type="datetime-local" value={dueAt} min={localDateTime(new Date())} onChange={(event) => setDueAt(event.target.value)} className="mt-3 min-h-11 w-full rounded-xl border border-[#DCCFE4] px-3 text-sm" />
          <button type="button" disabled={saving} onClick={() => void act({ action: "SCHEDULE_FOLLOW_UP", dueAt, notes: note })} className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#5B2A86] px-3 py-2 text-xs font-black text-white disabled:opacity-50"><Clock3 size={15} /> Schedule follow-up</button>
          {pendingFollowUps.map((followUp) => (
            <div key={followUp.id} className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-[#FAF7FC] p-3 text-xs">
              <span className="font-bold text-[#625768]">{new Date(followUp.dueAt).toLocaleString("en-IN")}</span>
              <button type="button" onClick={() => void act({ action: "COMPLETE_FOLLOW_UP", followUpId: followUp.id, notes: note })} className="font-black text-green-700">Complete</button>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-[#E7DCEB] bg-white p-4">
          <h4 className="text-sm font-black text-[#2D1736]">Visit or optional trial</h4>
          <div className="mt-3 grid grid-cols-[110px_1fr] gap-2">
            <select value={appointmentKind} onChange={(event) => setAppointmentKind(event.target.value as "VISIT" | "TRIAL")} className="rounded-xl border border-[#DCCFE4] px-2 text-sm"><option value="VISIT">Visit</option><option value="TRIAL">Trial</option></select>
            <input type="datetime-local" value={appointmentAt} onChange={(event) => setAppointmentAt(event.target.value)} className="min-h-11 rounded-xl border border-[#DCCFE4] px-3 text-sm" />
          </div>
          <button type="button" disabled={saving} onClick={() => void act({ action: "SCHEDULE_APPOINTMENT", kind: appointmentKind, scheduledAt: appointmentAt, notes: note })} className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#5B2A86] px-3 py-2 text-xs font-black text-white"><CalendarPlus size={15} /> Book {appointmentKind === "VISIT" ? "visit" : "trial"}</button>
          {pendingAppointments.map((appointment) => (
            <div key={appointment.id} className="mt-3 rounded-xl bg-[#FAF7FC] p-3 text-xs">
              <p className="font-black text-[#2D1736]">{label(appointment.kind)} · {new Date(appointment.scheduledAt).toLocaleString("en-IN")}</p>
              <div className="mt-2 flex gap-3"><button type="button" onClick={() => void act({ action: "COMPLETE_APPOINTMENT", appointmentId: appointment.id, outcome: note, parentFeedback: note })} className="font-black text-green-700">Completed</button><button type="button" onClick={() => void act({ action: "NO_SHOW", appointmentId: appointment.id, notes: note })} className="font-black text-red-700">No-show</button></div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-[#E7DCEB] bg-white p-4">
          <h4 className="text-sm font-black text-[#2D1736]">Sibling support</h4>
          <p className="mt-1 text-xs font-semibold text-[#817684]">Link another enquiry using its CentreOS enquiry ID.</p>
          <input value={siblingEnquiryId} onChange={(event) => setSiblingEnquiryId(event.target.value)} placeholder="Sibling enquiry ID" className="mt-3 min-h-11 w-full rounded-xl border border-[#DCCFE4] px-3 text-sm" />
          <button type="button" disabled={saving || !siblingEnquiryId.trim()} onClick={() => void act({ action: "LINK_SIBLING", siblingEnquiryId })} className="mt-2 inline-flex items-center gap-2 rounded-xl border border-[#DCCFE4] px-3 py-2 text-xs font-black text-[#5B2A86] disabled:opacity-50"><UserRoundPlus size={15} /> Link sibling</button>
          {journey.family ? <p className="mt-3 rounded-xl bg-green-50 p-3 text-xs font-bold text-green-800">{journey.family.familyName}: {journey.family.enquiries.map((item) => item.childName ?? item.enquiryNumber).join(", ")}</p> : null}
        </div>
      </div>

      {journey.marketingJobs.length ? (
        <div className="mt-5 rounded-2xl border border-[#E7DCEB] bg-white p-4">
          <h4 className="text-sm font-black text-[#2D1736]">Google & Meta conversion delivery</h4>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {journey.marketingJobs.map((job) => (
              <div key={job.id} className="rounded-xl bg-[#FAF7FC] p-3 text-xs">
                <div className="flex items-start justify-between gap-2"><p className="font-black text-[#2D1736]">{job.provider} · {label(job.eventType)}</p><span className="font-black text-[#6A328F]">{job.status}</span></div>
                <p className="mt-1 font-semibold text-[#817684]">Attempts: {job.attempts}{job.lastError ? ` · ${job.lastError}` : ""}</p>
                {(job.status === "DEAD" || job.status === "RETRY") ? <button type="button" onClick={() => void act({ action: "RESEND_CONVERSION", jobId: job.id })} className="mt-2 inline-flex items-center gap-1 font-black text-[#5B2A86]"><Send size={13} /> Resend safely</button> : null}
              </div>
            ))}
          </div>
          {journey.conversionHistory.length ? (
            <div className="mt-4 border-t border-[#E7DCEB] pt-3">
              <p className="text-[10px] font-black uppercase tracking-wide text-[#817684]">Delivery history</p>
              <div className="mt-2 space-y-2">
                {journey.conversionHistory.slice(0, 12).map((event) => (
                  <p key={event.id} className="flex flex-wrap justify-between gap-2 text-xs font-semibold text-[#625768]"><span>{event.description}</span><time>{new Date(event.createdAt).toLocaleString("en-IN")}</time></p>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 rounded-2xl border border-[#E7DCEB] bg-white p-4">
        <h4 className="flex items-center gap-2 text-sm font-black text-[#2D1736]"><Clock3 size={17} /> Full timeline</h4>
        <div className="mt-4 max-h-96 space-y-4 overflow-y-auto pr-1">
          {journey.activities.length ? journey.activities.map((activity) => (
            <article key={activity.id} className="border-l-2 border-[#D8C6E2] pl-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-black text-[#2D1736]">{activity.title}</p><time className="text-[11px] font-bold text-[#817684]">{new Date(activity.occurredAt).toLocaleString("en-IN")}</time></div>
              {activity.notes ? <p className="mt-1 text-xs font-semibold leading-5 text-[#625768]">{activity.notes}</p> : null}
              <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-[#8B808F]">{activity.recordedBy?.name ?? "Website / system"} · {label(activity.type)}</p>
            </article>
          )) : <p className="text-sm font-semibold text-[#817684]">New CRM activity will appear here.</p>}
        </div>
      </div>

      {saving ? <div className="mt-3 flex items-center gap-2 text-xs font-black text-[#5B2A86]"><LoaderCircle size={15} className="animate-spin" /> Saving CRM action</div> : <div className="mt-3 flex items-center gap-2 text-xs font-bold text-green-700"><CheckCircle2 size={15} /> Every action is timestamped and audited.</div>}
    </section>
  );
}
