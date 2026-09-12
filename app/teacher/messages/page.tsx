"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare,
  Send,
  PlusCircle,
  UsersRound,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  MailOpen,
  Filter
} from "lucide-react";

type Message = {
  id: string;
  threadId: string | null;
  subject: string | null;
  body: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    role: string;
  };
  recipient?: {
    id: string;
    name: string;
    role: string;
  } | null;
};

type Colleague = {
  id: string;
  name: string;
  role: string;
  email: string;
};

export default function TeacherMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filter, setFilter] = useState<"all" | "inbox" | "sent">("all");

  // Compose Modal State
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [recipientId, setRecipientId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  async function loadMessages() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/messages");
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
        setColleagues(data.colleagues || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMessages();
  }, []);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!body.trim()) {
      setFormError("Message content cannot be empty.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: recipientId || null,
          subject: subject.trim() || null,
          body: body.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.message || "Failed to send message.");
        return;
      }

      setFormSuccess("Message sent successfully!");
      setSubject("");
      setBody("");
      setRecipientId("");
      setTimeout(() => {
        setShowComposeModal(false);
        setFormSuccess("");
        loadMessages();
      }, 1000);
    } catch (err) {
      setFormError("A network error occurred while sending message.");
    } finally {
      setSubmitting(false);
    }
  }

  async function markAsRead(messageId: string) {
    try {
      await fetch("/api/admin/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isRead: true } : m))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark message as read", err);
    }
  }

  const filteredMessages = messages.filter((m) => {
    if (filter === "inbox") return m.recipient !== undefined;
    if (filter === "sent") return !m.recipient; // Sent by current user or check sender ID
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#2D1736] sm:text-3xl">Internal Messages</h1>
          <p className="text-xs font-semibold text-[#5B2A86]/80 sm:text-sm">
            Communicate directly with Centre Head, teachers, and staff members.
          </p>
        </div>
        <button
          onClick={() => setShowComposeModal(true)}
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-5 py-3 text-sm font-bold text-white shadow transition hover:bg-[#471E6B]"
        >
          <PlusCircle className="h-5 w-5" />
          Compose Message
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex rounded-2xl bg-[#ECE4F0] p-1">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition sm:text-sm ${
              filter === "all"
                ? "bg-[#2D1736] text-white shadow"
                : "text-[#5B2A86] hover:bg-[#D5C2E2]/50"
            }`}
          >
            All Messages ({messages.length})
          </button>
          <button
            onClick={() => setFilter("inbox")}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition sm:text-sm ${
              filter === "inbox"
                ? "bg-[#2D1736] text-white shadow"
                : "text-[#5B2A86] hover:bg-[#D5C2E2]/50"
            }`}
          >
            Inbox
            {unreadCount > 0 && (
              <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] text-white">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="rounded-3xl border border-[#D5C2E2] bg-white p-5 shadow-sm sm:p-6">
        <div className="divide-y divide-[#ECE4F0]">
          {loading ? (
            <div className="py-8 text-center text-sm font-semibold text-[#5B2A86]">Loading messages...</div>
          ) : filteredMessages.length === 0 ? (
            <div className="py-8 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-[#5B2A86]/30" />
              <p className="mt-3 text-sm font-bold text-[#2D1736]">No messages found</p>
              <p className="text-xs text-[#5B2A86]/70">
                You have no active message threads yet. Click &quot;Compose Message&quot; to begin.
              </p>
            </div>
          ) : (
            filteredMessages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => {
                  if (!msg.isRead) markAsRead(msg.id);
                }}
                className={`cursor-pointer py-4 transition first:pt-0 last:pb-0 hover:bg-[#F7F2FA]/50 ${
                  !msg.isRead ? "bg-amber-50/40 p-3 rounded-2xl" : ""
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        !msg.isRead ? "bg-amber-500 text-white" : "bg-[#ECE4F0] text-[#5B2A86]"
                      }`}
                    >
                      {!msg.isRead ? <Mail className="h-5 w-5" /> : <MailOpen className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[#2D1736]">{msg.sender.name}</span>
                        <span className="rounded bg-[#ECE4F0] px-2 py-0.5 text-[10px] font-bold text-[#5B2A86]">
                          {msg.sender.role}
                        </span>
                        {msg.recipient ? (
                          <span className="text-xs text-[#5B2A86]/70">
                            → {msg.recipient.name} ({msg.recipient.role})
                          </span>
                        ) : (
                          <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                            📢 Broadcast
                          </span>
                        )}
                      </div>
                      {msg.subject && (
                        <p className="mt-1 text-sm font-bold text-[#2D1736]">{msg.subject}</p>
                      )}
                      <p className="mt-1 whitespace-pre-wrap text-xs text-[#5B2A86]/90">{msg.body}</p>
                    </div>
                  </div>

                  <div className="text-xs text-[#5B2A86]/60 sm:text-right shrink-0">
                    {new Date(msg.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Compose Message Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#ECE4F0] pb-4">
              <h2 className="text-lg font-black text-[#2D1736]">Compose Message</h2>
              <button
                onClick={() => setShowComposeModal(false)}
                className="rounded-full p-2 text-gray-500 hover:bg-[#F7F2FA]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-800 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleSendMessage} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-black uppercase text-[#2D1736]">Recipient</label>
                <select
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D5C2E2] p-2.5 text-sm font-medium focus:border-[#5B2A86] focus:outline-none"
                >
                  <option value="">📢 Broadcast / General Notice (All Staff)</option>
                  {colleagues.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name} ({col.role})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-[#5B2A86]/70">
                  Select a specific Centre Head or colleague, or send to all staff.
                </p>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-[#2D1736]">Subject (Optional)</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Nursery Batch Activity Update / Schedule query"
                  className="mt-1 w-full rounded-xl border border-[#D5C2E2] p-2.5 text-sm font-medium focus:border-[#5B2A86] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-[#2D1736]">Message Content *</label>
                <textarea
                  required
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Type your message here..."
                  className="mt-1 w-full rounded-xl border border-[#D5C2E2] p-3 text-sm font-medium focus:border-[#5B2A86] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowComposeModal(false)}
                  className="rounded-xl border border-[#D5C2E2] px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-[#F7F2FA]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-[#5B2A86] px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-[#471E6B] disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? "Sending..." : "Send Message"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
