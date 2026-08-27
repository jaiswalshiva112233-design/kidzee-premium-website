"use client";

import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Eye,
  EyeOff,
  ImagePlus,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Star,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type TeamMember = {
  _id: string;
  name: string;
  role: string;
  programme: string;
  qualification: string;
  experience: string;
  introduction: string;
  photoAlt: string;
  imageUrl: string | null;
  published: boolean;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  members?: TeamMember[];
  member?: TeamMember;
  teamSettings?: {
    movementSpeed: TeamMovementSpeed;
  };
};

type TeamMovementSpeed = "SLOW" | "NORMAL" | "FAST";

type TeamFormState = {
  id: string;
  name: string;
  role: string;
  programme: string;
  qualification: string;
  experience: string;
  introduction: string;
  photoAlt: string;
  published: boolean;
  featured: boolean;
  sortOrder: number;
  consentConfirmed: boolean;
};

const emptyForm: TeamFormState = {
  id: "",
  name: "",
  role: "",
  programme: "",
  qualification: "",
  experience: "",
  introduction: "",
  photoAlt: "",
  published: false,
  featured: false,
  sortOrder: 0,
  consentConfirmed: false,
};

const MAX_TEAM_PROFILES = 9;

function sortMembers(members: TeamMember[]) {
  return [...members].sort(
    (first, second) =>
      first.sortOrder - second.sortOrder ||
      first.createdAt.localeCompare(second.createdAt),
  );
}

export default function WebsiteTeamManager() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [form, setForm] = useState<TeamFormState>(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [movementSpeed, setMovementSpeed] =
    useState<TeamMovementSpeed>("NORMAL");
  const [savingMovementSpeed, setSavingMovementSpeed] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  const editingMember = form.id
    ? members.find((member) => member._id === form.id) ?? null
    : null;
  const displayedImage = previewUrl || editingMember?.imageUrl || null;
  const publishedCount = members.filter((member) => member.published).length;
  const featuredCount = members.filter(
    (member) => member.published && member.featured,
  ).length;
  const atProfileLimit = members.length >= MAX_TEAM_PROFILES;

  function clearPreview() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(null);
  }

  function resetForm() {
    clearPreview();
    setFile(null);
    setForm({
      ...emptyForm,
      sortOrder: members.length,
    });
  }

  async function loadMembers() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/website-team", {
        method: "GET",
        cache: "no-store",
      });
      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ?? "Unable to load website team profiles.",
        );
      }

      const nextMembers = sortMembers(result.members ?? []);
      setMembers(nextMembers);
      setMovementSpeed(result.teamSettings?.movementSpeed ?? "NORMAL");
      setForm((current) =>
        current.id
          ? current
          : {
              ...current,
              sortOrder: nextMembers.length,
            },
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load website team profiles.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadMembers();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;

    clearPreview();
    setFile(nextFile);
    setForm((current) => ({
      ...current,
      consentConfirmed: false,
    }));
    setMessage("");
    setError("");

    if (nextFile) {
      setPreviewUrl(URL.createObjectURL(nextFile));
    }
  }

  function startEditing(member: TeamMember) {
    clearPreview();
    setFile(null);
    setForm({
      id: member._id,
      name: member.name,
      role: member.role,
      programme: member.programme || "",
      qualification: member.qualification || "",
      experience: member.experience || "",
      introduction: member.introduction,
      photoAlt: member.photoAlt,
      published: member.published,
      featured: member.featured,
      sortOrder: member.sortOrder,
      consentConfirmed: false,
    });
    setMessage("");
    setError("");
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }

  async function saveMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.id && atProfileLimit) {
      setMessage("");
      setError(
        "The 9-profile limit has been reached. Edit or remove an existing profile before adding another.",
      );
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();

      if (form.id) formData.set("id", form.id);
      formData.set("name", form.name);
      formData.set("role", form.role);
      formData.set("programme", form.programme);
      formData.set("qualification", form.qualification);
      formData.set("experience", form.experience);
      formData.set("introduction", form.introduction);
      formData.set("photoAlt", form.photoAlt);
      formData.set("published", String(form.published));
      formData.set("featured", String(form.featured));
      formData.set("sortOrder", String(form.sortOrder));
      formData.set(
        "consentConfirmed",
        String(form.consentConfirmed),
      );

      if (file) formData.set("file", file);

      const response = await fetch("/api/admin/website-team", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success || !result.member) {
        throw new Error(
          result.message ?? "The teacher profile could not be saved.",
        );
      }

      setMembers((current) =>
        sortMembers([
          result.member as TeamMember,
          ...current.filter(
            (member) => member._id !== result.member?._id,
          ),
        ]),
      );
      setMessage(result.message ?? "The teacher profile has been saved.");
      clearPreview();
      setFile(null);
      setForm({
        ...emptyForm,
        sortOrder: form.id ? members.length : members.length + 1,
      });
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The teacher profile could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function quickUpdate(
    member: TeamMember,
    action: "setPublished" | "setFeatured",
    value: boolean,
  ) {
    setBusyId(member._id);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/website-team", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          id: member._id,
          value,
        }),
      });
      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ?? "The team profile could not be updated.",
        );
      }

      setMembers((current) =>
        current.map((item) =>
          item._id === member._id
            ? {
                ...item,
                published:
                  action === "setPublished" ? value : item.published,
                featured:
                  action === "setFeatured" ? value : item.featured,
              }
            : item,
        ),
      );
      setMessage(result.message ?? "The team profile has been updated.");
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "The team profile could not be updated.",
      );
    } finally {
      setBusyId("");
    }
  }

  async function moveMember(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= members.length) {
      return;
    }

    const previousMembers = members;
    const nextMembers = [...members];
    const [movedMember] = nextMembers.splice(index, 1);
    nextMembers.splice(targetIndex, 0, movedMember);
    const orderedMembers = nextMembers.map((member, memberIndex) => ({
      ...member,
      sortOrder: memberIndex,
    }));

    setMembers(orderedMembers);
    setBusyId(movedMember._id);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/website-team", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "reorderMembers",
          orderedIds: orderedMembers.map((member) => member._id),
        }),
      });
      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ?? "The team order could not be saved.",
        );
      }

      setMessage(result.message ?? "The team order has been updated.");
    } catch (moveError) {
      setMembers(previousMembers);
      setError(
        moveError instanceof Error
          ? moveError.message
          : "The team order could not be saved.",
      );
    } finally {
      setBusyId("");
    }
  }

  async function removeMember(member: TeamMember) {
    if (
      !window.confirm(
        `Remove ${member.name} from the website team? This cannot be undone.`,
      )
    ) {
      return;
    }

    setBusyId(member._id);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/admin/website-team?id=${encodeURIComponent(member._id)}`,
        { method: "DELETE" },
      );
      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ?? "The teacher profile could not be removed.",
        );
      }

      setMembers((current) =>
        current.filter((item) => item._id !== member._id),
      );

      if (form.id === member._id) {
        resetForm();
      }

      setMessage(result.message ?? "The teacher profile has been removed.");
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "The teacher profile could not be removed.",
      );
    } finally {
      setBusyId("");
    }
  }

  async function saveMovementSpeed(nextSpeed: TeamMovementSpeed) {
    const previousSpeed = movementSpeed;
    setMovementSpeed(nextSpeed);
    setSavingMovementSpeed(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/website-team", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "setMovementSpeed",
          value: nextSpeed,
        }),
      });
      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ?? "The staff movement speed could not be saved.",
        );
      }

      setMovementSpeed(result.teamSettings?.movementSpeed ?? nextSpeed);
      setMessage(
        result.message ?? "The staff movement speed has been saved.",
      );
    } catch (saveError) {
      setMovementSpeed(previousSpeed);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The staff movement speed could not be saved.",
      );
    } finally {
      setSavingMovementSpeed(false);
    }
  }

  return (
    <div className="space-y-7">
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Profiles added",
            value: `${members.length} of ${MAX_TEAM_PROFILES}`,
          },
          { label: "Visible on About", value: publishedCount },
          { label: "Featured on Home", value: featuredCount },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-[24px] border border-[#E8DFEC] bg-white p-5 shadow-[0_12px_34px_rgba(45,23,54,0.05)]"
          >
            <p className="text-3xl font-black tracking-[-0.04em] text-[#2D1736]">
              {item.value}
            </p>
            <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-[#817684]">
              {item.label}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-[26px] border border-[#E4D7E9] bg-white p-5 shadow-[0_14px_42px_rgba(45,23,54,0.06)] sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7A459C]">
            Homepage presentation
          </p>
          <h2 className="mt-2 text-xl font-black tracking-[-0.025em] text-[#2D1736]">
            Staff photo movement speed
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#756A79]">
            Controls the continuous team strip on the homepage. Normal is the
            recommended balanced speed.
          </p>
        </div>

        <div
          className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-[#F6F1F8] p-1.5 sm:mt-0 sm:min-w-[300px]"
          aria-label="Staff photo movement speed"
        >
          {(["SLOW", "NORMAL", "FAST"] as const).map((speed) => (
            <button
              key={speed}
              type="button"
              disabled={savingMovementSpeed}
              aria-pressed={movementSpeed === speed}
              onClick={() => void saveMovementSpeed(speed)}
              className={`min-h-11 rounded-xl px-3 text-xs font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/45 disabled:cursor-wait disabled:opacity-65 ${
                movementSpeed === speed
                  ? "bg-[#5B2A86] text-white shadow-sm"
                  : "text-[#5B2A86] hover:bg-white"
              }`}
            >
              {speed.charAt(0) + speed.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </section>

      {message ? (
        <div
          role="status"
          className="flex items-start gap-2 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-bold text-green-700"
        >
          <CheckCircle2 aria-hidden="true" size={19} className="mt-0.5" />
          {message}
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold leading-6 text-red-700"
        >
          {error}
        </div>
      ) : null}

      <div className="grid gap-7 xl:grid-cols-[0.42fr_0.58fr]">
        <div ref={formRef} className="scroll-mt-28">
          <form
            onSubmit={(event) => void saveMember(event)}
            className="rounded-[30px] border border-[#E7DDEB] bg-white p-5 shadow-[0_18px_55px_rgba(45,23,54,0.07)] sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7A459C]">
                  {form.id ? "Edit profile" : "Add a profile"}
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#2D1736]">
                  {form.id ? form.name || "Teacher profile" : "New website profile"}
                </h2>
              </div>

              {form.id ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#DED1E5] text-[#5B2A86] transition hover:bg-[#F7F0FA]"
                  aria-label="Cancel editing"
                >
                  <X aria-hidden="true" size={19} />
                </button>
              ) : null}
            </div>

            {!form.id && atProfileLimit ? (
              <p className="mt-5 rounded-2xl border border-[#E7D7A2] bg-[#FFF9E8] px-4 py-3 text-sm font-bold leading-6 text-[#705B21]">
                9 of 9 profiles added. Edit or remove an existing profile to
                make room for another.
              </p>
            ) : null}

            <div className="mt-6 overflow-hidden rounded-[26px] border border-[#E3D8E8] bg-[#F5EEF8]">
              <div className="relative aspect-[4/5]">
                {displayedImage ? (
                  <Image
                    src={displayedImage}
                    alt={
                      form.photoAlt ||
                      form.name ||
                      "Teacher portrait preview"
                    }
                    fill
                    unoptimized
                    sizes="(max-width: 1280px) 100vw, 420px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[#9A86A5]">
                    <div className="text-center">
                      <UserRound
                        aria-hidden="true"
                        size={54}
                        className="mx-auto"
                      />
                      <p className="mt-3 text-sm font-black">
                        Portrait preview
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <Field label="Full name" htmlFor="team-name">
                <input
                  id="team-name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  maxLength={80}
                  required
                  placeholder="Teacher's full name"
                  className={inputClass}
                />
              </Field>

              <Field label="Role or designation" htmlFor="team-role">
                <input
                  id="team-role"
                  value={form.role}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      role: event.target.value,
                    }))
                  }
                  maxLength={80}
                  required
                  placeholder="Class Teacher, Centre Head, Daycare Teacher"
                  className={inputClass}
                />
              </Field>

              <Field
                label="Class or programme (optional)"
                htmlFor="team-programme"
              >
                <input
                  id="team-programme"
                  value={form.programme}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      programme: event.target.value,
                    }))
                  }
                  maxLength={80}
                  placeholder="Nursery, Junior KG, Daycare"
                  className={inputClass}
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Qualification (optional)"
                  htmlFor="team-qualification"
                >
                  <input
                    id="team-qualification"
                    value={form.qualification}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        qualification: event.target.value,
                      }))
                    }
                    maxLength={120}
                    placeholder="NTT, B.Ed., Montessori trained"
                    className={inputClass}
                  />
                </Field>

                <Field
                  label="Experience (optional)"
                  htmlFor="team-experience"
                >
                  <input
                    id="team-experience"
                    value={form.experience}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        experience: event.target.value,
                      }))
                    }
                    maxLength={80}
                    placeholder="6 years in early childhood education"
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field
                label="Short introduction"
                htmlFor="team-introduction"
                help="Use one warm, factual sentence. Maximum 260 characters."
              >
                <textarea
                  id="team-introduction"
                  value={form.introduction}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      introduction: event.target.value,
                    }))
                  }
                  maxLength={260}
                  rows={4}
                  placeholder="She helps young children settle gently and participate with confidence."
                  className={`${inputClass} py-3`}
                />
                <p className="mt-2 text-right text-xs font-bold text-[#8B7F8F]">
                  {form.introduction.length}/260
                </p>
              </Field>

              <Field
                label="Portrait photograph"
                htmlFor="team-photo"
                help="Use a clear vertical 4:5 portrait. JPG, PNG, WebP or AVIF; maximum 12 MB."
              >
                <input
                  id="team-photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handleFileChange}
                  className="block w-full cursor-pointer rounded-2xl border border-[#DCCFE4] bg-white text-sm font-semibold text-[#5F5663] file:mr-4 file:cursor-pointer file:border-0 file:bg-[#F3EAF8] file:px-4 file:py-3 file:text-sm file:font-black file:text-[#5B2A86] hover:file:bg-[#EADDF1]"
                />
              </Field>

              <Field
                label="Photo description"
                htmlFor="team-photo-alt"
                help="Leave blank to create a clear description automatically."
              >
                <input
                  id="team-photo-alt"
                  value={form.photoAlt}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      photoAlt: event.target.value,
                    }))
                  }
                  maxLength={180}
                  placeholder="Teacher name and role at Kidzee Sector 12 Dwarka"
                  className={inputClass}
                />
              </Field>

              {file ? (
                <label className="flex cursor-pointer items-start gap-3 rounded-[22px] border border-[#E5D6B0] bg-[#FFF9E8] p-4">
                  <input
                    type="checkbox"
                    checked={form.consentConfirmed}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        consentConfirmed: event.target.checked,
                      }))
                    }
                    className="mt-1 h-4 w-4 accent-[#5B2A86]"
                  />
                  <span className="text-sm font-bold leading-6 text-[#66552B]">
                    The teacher has permitted the centre to publish this
                    photograph on the website.
                  </span>
                </label>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-[22px] border border-[#E7DDEB] bg-[#FAF7FC] p-4">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        published: event.target.checked,
                        featured: event.target.checked
                          ? current.featured
                          : false,
                      }))
                    }
                    className="mt-1 h-4 w-4 accent-[#5B2A86]"
                  />
                  <span>
                    <span className="block text-sm font-black text-[#34233C]">
                      Show on About page
                    </span>
                    <span className="mt-1 block text-xs font-semibold leading-5 text-[#7E7282]">
                      Keep off while preparing a draft.
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-[22px] border border-[#E7DDEB] bg-[#FAF7FC] p-4">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        featured: event.target.checked,
                        published: event.target.checked
                          ? true
                          : current.published,
                      }))
                    }
                    className="mt-1 h-4 w-4 accent-[#5B2A86]"
                  />
                  <span>
                    <span className="block text-sm font-black text-[#34233C]">
                      Feature on homepage
                    </span>
                    <span className="mt-1 block text-xs font-semibold leading-5 text-[#7E7282]">
                      Select up to nine; the homepage shows three at a time.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || (!form.id && atProfileLimit)}
              className="mt-6 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-5 text-sm font-black text-white shadow-[0_14px_34px_rgba(91,42,134,0.22)] transition hover:-translate-y-0.5 hover:bg-[#4B206F] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <LoaderCircle
                    aria-hidden="true"
                    size={18}
                    className="animate-spin"
                  />
                  Saving profile…
                </>
              ) : (
                <>
                  {form.id ? (
                    <Save aria-hidden="true" size={18} />
                  ) : (
                    <Plus aria-hidden="true" size={18} />
                  )}
                  {form.id
                    ? "Save Changes"
                    : atProfileLimit
                      ? "9-profile limit reached"
                      : "Add Website Profile"}
                </>
              )}
            </button>
          </form>
        </div>

        <section>
          <div className="flex flex-col gap-4 rounded-[26px] border border-[#E7DDEB] bg-white p-5 shadow-[0_14px_42px_rgba(45,23,54,0.055)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7A459C]">
                Website order
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.03em] text-[#2D1736]">
                Teacher profiles
              </h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-[#7B7080]">
                Use the arrows to control the order shown to parents.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadMembers()}
              disabled={loading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#DCCFE4] bg-[#FAF7FC] px-4 text-sm font-black text-[#5B2A86] transition hover:bg-[#F1E8F6] disabled:opacity-60"
            >
              <RefreshCw aria-hidden="true" size={17} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="mt-5 flex min-h-72 items-center justify-center rounded-[28px] border border-[#E7DDEB] bg-white">
              <div className="text-center">
                <LoaderCircle
                  aria-hidden="true"
                  size={30}
                  className="mx-auto animate-spin text-[#5B2A86]"
                />
                <p className="mt-3 text-sm font-bold text-[#756A79]">
                  Loading team profiles…
                </p>
              </div>
            </div>
          ) : members.length === 0 ? (
            <div className="mt-5 rounded-[30px] border border-dashed border-[#CFBDD8] bg-[#FAF7FC] px-6 py-14 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-white text-[#5B2A86] shadow-sm">
                <ImagePlus aria-hidden="true" size={27} />
              </span>
              <h3 className="mt-5 text-xl font-black text-[#2D1736]">
                Add your first teacher profile
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-[#7B7080]">
                Nothing will appear publicly until you upload a portrait and
                choose Show on About page.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {members.map((member, index) => {
                const memberBusy = busyId === member._id;

                return (
                  <article
                    key={member._id}
                    className="overflow-hidden rounded-[28px] border border-[#E7DDEB] bg-white shadow-[0_14px_42px_rgba(45,23,54,0.055)]"
                  >
                    <div className="grid sm:grid-cols-[150px_1fr]">
                      <div className="relative aspect-[4/5] bg-[#F1E9F4] sm:aspect-auto sm:min-h-[188px]">
                        {member.imageUrl ? (
                          <Image
                            src={member.imageUrl}
                            alt={member.photoAlt || member.name}
                            fill
                            unoptimized
                            sizes="150px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[#9B88A6]">
                            <UserRound aria-hidden="true" size={42} />
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="text-xl font-black tracking-[-0.02em] text-[#2D1736]">
                              {member.name}
                            </h3>
                            <p className="mt-1 text-sm font-black text-[#6A328F]">
                              {member.role}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] ${
                                member.published
                                  ? "border-green-200 bg-green-50 text-green-700"
                                  : "border-slate-200 bg-slate-50 text-slate-600"
                              }`}
                            >
                              {member.published ? "Visible" : "Hidden"}
                            </span>
                            {member.featured ? (
                              <span className="rounded-full border border-[#EAD38A] bg-[#FFF8DE] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-[#805E00]">
                                Homepage
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <p className="mt-3 text-sm font-semibold leading-6 text-[#756A79]">
                          {member.introduction ||
                            "No public introduction has been added yet."}
                        </p>

                        {member.programme ||
                        member.qualification ||
                        member.experience ? (
                          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black text-[#675A6C]">
                            {[member.programme, member.qualification, member.experience]
                              .filter(Boolean)
                              .map((detail) => (
                                <span
                                  key={detail}
                                  className="rounded-full bg-[#F5EFF8] px-3 py-1.5"
                                >
                                  {detail}
                                </span>
                              ))}
                          </div>
                        ) : null}

                        <div className="mt-5 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEditing(member)}
                            disabled={memberBusy}
                            className={secondaryButtonClass}
                          >
                            <Pencil aria-hidden="true" size={15} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void quickUpdate(
                                member,
                                "setPublished",
                                !member.published,
                              )
                            }
                            disabled={memberBusy}
                            className={secondaryButtonClass}
                          >
                            {member.published ? (
                              <EyeOff aria-hidden="true" size={15} />
                            ) : (
                              <Eye aria-hidden="true" size={15} />
                            )}
                            {member.published ? "Hide" : "Show"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void quickUpdate(
                                member,
                                "setFeatured",
                                !member.featured,
                              )
                            }
                            disabled={memberBusy}
                            className={secondaryButtonClass}
                          >
                            {member.featured ? (
                              <Sparkles aria-hidden="true" size={15} />
                            ) : (
                              <Star aria-hidden="true" size={15} />
                            )}
                            {member.featured ? "Unfeature" : "Feature"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void moveMember(index, -1)}
                            disabled={memberBusy || index === 0}
                            className={iconButtonClass}
                            aria-label={`Move ${member.name} up`}
                          >
                            <ArrowUp aria-hidden="true" size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void moveMember(index, 1)}
                            disabled={
                              memberBusy || index === members.length - 1
                            }
                            className={iconButtonClass}
                            aria-label={`Move ${member.name} down`}
                          >
                            <ArrowDown aria-hidden="true" size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void removeMember(member)}
                            disabled={memberBusy}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                          >
                            {memberBusy ? (
                              <LoaderCircle
                                aria-hidden="true"
                                size={15}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 aria-hidden="true" size={15} />
                            )}
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  help,
  children,
}: {
  label: string;
  htmlFor: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-sm font-black text-[#35243E]">
        {label}
      </label>
      {help ? (
        <p className="mt-1 text-xs font-semibold leading-5 text-[#837887]">
          {help}
        </p>
      ) : null}
      <div className="mt-2">{children}</div>
    </div>
  );
}

const inputClass =
  "min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-semibold text-[#2D1736] outline-none transition placeholder:text-[#A398A7] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10";

const secondaryButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#DDCFE4] bg-white px-3 text-xs font-black text-[#5B2A86] transition hover:bg-[#F7F0FA] disabled:cursor-not-allowed disabled:opacity-50";

const iconButtonClass =
  "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#DDCFE4] bg-white text-[#5B2A86] transition hover:bg-[#F7F0FA] disabled:cursor-not-allowed disabled:opacity-35";
