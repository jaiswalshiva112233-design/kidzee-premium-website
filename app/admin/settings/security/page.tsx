import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  KeyRound,
  LockKeyhole,
  LogOut,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import {
  adminSession,
  changeAdminPassword,
  createAdminSessionToken,
  getAdminSecurityState,
  getAdminSession,
} from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

type SecurityPageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
    passwordChange?: string;
  }>;
};

function formatDateTime(value: Date | null) {
  if (!value) {
    return "Not recorded yet";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

function validateNewPassword(password: string) {
  if (password.length < 12) {
    return "The new password must contain at least 12 characters.";
  }

  if (password.length > 128) {
    return "The new password cannot exceed 128 characters.";
  }

  if (!/[a-z]/.test(password)) {
    return "Include at least one lowercase letter.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Include at least one uppercase letter.";
  }

  if (!/\d/.test(password)) {
    return "Include at least one number.";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Include at least one special character.";
  }

  return null;
}

function isValidEmail(email: string) {
  return (
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

function redirectWithMessage(
  type: "success" | "error",
  message: string,
): never {
  redirect(
    `/admin/settings/security?${type}=${encodeURIComponent(
      message,
    )}`,
  );
}

async function updateProfileAction(
  formData: FormData,
) {
  "use server";

  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (name.length < 2 || name.length > 80) {
    redirectWithMessage(
      "error",
      "Please enter a valid name.",
    );
  }

  if (!isValidEmail(email)) {
    redirectWithMessage(
      "error",
      "Please enter a valid email address.",
    );
  }

  const duplicateEmail =
    await prisma.adminUser.findFirst({
      where: {
        id: {
          not: session.userId,
        },
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
      },
    });

  if (duplicateEmail) {
    redirectWithMessage(
      "error",
      "Another administrator already uses this email address.",
    );
  }

  await prisma.adminUser.update({
    where: {
      id: session.userId,
    },
    data: {
      name,
      email,
    },
  });

  await prisma.activityLog.create({
    data: {
      adminUserId: session.userId,
      action: "UPDATED",
      entityType: "AdminUser",
      entityId: session.userId,
      description: `${name} updated their administrator profile.`,
    },
  });

  redirectWithMessage(
    "success",
    "Your profile was updated successfully.",
  );
}

async function changePasswordAction(
  formData: FormData,
) {
  "use server";

  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const currentPassword = String(
    formData.get("currentPassword") ?? "",
  );

  const newPassword = String(
    formData.get("newPassword") ?? "",
  );

  const confirmPassword = String(
    formData.get("confirmPassword") ?? "",
  );

  if (!currentPassword) {
    redirectWithMessage(
      "error",
      "Please enter your current password.",
    );
  }

  const passwordError =
    validateNewPassword(newPassword);

  if (passwordError) {
    redirectWithMessage(
      "error",
      passwordError,
    );
  }

  if (newPassword !== confirmPassword) {
    redirectWithMessage(
      "error",
      "The new password and confirmation do not match.",
    );
  }

  const result = await changeAdminPassword(
    currentPassword,
    newPassword,
  );

  if (!result.success) {
    redirectWithMessage(
      "error",
      result.message,
    );
  }

  const sessionToken =
    await createAdminSessionToken(
      result.sessionVersion,
      result.userId,
    );

  const cookieStore = await cookies();

  cookieStore.set({
    name: adminSession.cookieName,
    value: sessionToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: adminSession.durationSeconds,
  });

  redirectWithMessage(
    "success",
    "Password changed successfully. Other signed-in devices have been logged out.",
  );
}

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "A";
}

export const dynamic = "force-dynamic";

export default async function SecurityPage({
  searchParams,
}: SecurityPageProps) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const [params, securityState] =
    await Promise.all([
      searchParams,
      getAdminSecurityState(),
    ]);

  const roleLabel =
    session.role === "OWNER"
      ? "Owner"
      : "Centre Head";

  return (
    <AdminLayout>
      <div className="space-y-8">
        <section className="overflow-hidden rounded-[30px] bg-[#2D1736] px-5 py-7 text-white shadow-[0_22px_65px_rgba(45,23,54,0.18)] sm:px-7 lg:px-9 lg:py-9">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2D1736]">
                  <ShieldCheck
                    aria-hidden="true"
                    size={24}
                  />
                </span>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#F6C84B]">
                    CentreOS Account
                  </p>

                  <p className="mt-1 text-sm font-semibold text-white/60">
                    Profile and access protection
                  </p>
                </div>
              </div>

              <h1 className="mt-6 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                My Profile & Security
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/70">
                Update your administrator profile, change
                your password and protect your CentreOS
                account.
              </p>
            </div>

            <Link
              href="/admin/settings"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/15"
            >
              <ArrowLeft
                aria-hidden="true"
                size={18}
              />
              Back to Settings
            </Link>
          </div>
        </section>

        {params.passwordChange === "required" ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900"
          >
            <KeyRound
              aria-hidden="true"
              size={20}
              className="mt-0.5 shrink-0"
            />

            Please change your temporary password before
            continuing to use the panel.
          </div>
        ) : null}

        {params.success ? (
          <div
            role="status"
            className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-800"
          >
            <CheckCircle2
              aria-hidden="true"
              size={20}
              className="mt-0.5 shrink-0"
            />
            {params.success}
          </div>
        ) : null}

        {params.error ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800"
          >
            <AlertCircle
              aria-hidden="true"
              size={20}
              className="mt-0.5 shrink-0"
            />
            {params.error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[24px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.06)]">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F2E8F7] text-[#5B2A86]">
                <BadgeCheck
                  aria-hidden="true"
                  size={21}
                />
              </span>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.1em] text-[#817684]">
                  Account role
                </p>

                <p className="mt-2 text-base font-black text-[#2D1736]">
                  {roleLabel}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-[24px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.06)]">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                <Clock3
                  aria-hidden="true"
                  size={21}
                />
              </span>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.1em] text-[#817684]">
                  Last successful login
                </p>

                <p className="mt-2 text-base font-black text-[#2D1736]">
                  {formatDateTime(
                    securityState.lastLoginAt,
                  )}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-[24px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.06)]">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF3D5] text-[#8A6100]">
                <KeyRound
                  aria-hidden="true"
                  size={21}
                />
              </span>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.1em] text-[#817684]">
                  Password secured since
                </p>

                <p className="mt-2 text-base font-black text-[#2D1736]">
                  {formatDateTime(
                    securityState.passwordChangedAt,
                  )}
                </p>
              </div>
            </div>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <form
            action={updateProfileAction}
            className="overflow-hidden rounded-[28px] border border-[#E9E2ED] bg-white shadow-[0_18px_50px_rgba(45,23,54,0.07)]"
          >
            <div className="border-b border-[#EEE8F1] bg-[#FAF8FC] p-5 sm:p-6">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#5B2A86] text-lg font-black text-white">
                  {getInitials(session.name)}
                </span>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7A459C]">
                    Administrator profile
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-[#2D1736]">
                    Edit My Profile
                  </h2>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <label className="block">
                <span className="text-sm font-black text-[#35243C]">
                  Full name
                </span>

                <div className="relative mt-2">
                  <UserRound
                    aria-hidden="true"
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7A459C]"
                  />

                  <input
                    type="text"
                    name="name"
                    required
                    minLength={2}
                    maxLength={80}
                    defaultValue={session.name}
                    autoComplete="name"
                    className="min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white pl-11 pr-4 text-sm font-semibold text-[#2D1736] outline-none transition focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#35243C]">
                  Login email
                </span>

                <div className="relative mt-2">
                  <Mail
                    aria-hidden="true"
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7A459C]"
                  />

                  <input
                    type="email"
                    name="email"
                    required
                    maxLength={254}
                    defaultValue={session.email ?? ""}
                    autoComplete="email"
                    className="min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white pl-11 pr-4 text-sm font-semibold text-[#2D1736] outline-none transition focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#35243C]">
                  Account role
                </span>

                <input
                  type="text"
                  value={roleLabel}
                  readOnly
                  className="mt-2 min-h-12 w-full cursor-not-allowed rounded-2xl border border-[#E4DCE8] bg-[#F7F4F9] px-4 text-sm font-bold text-[#756A79]"
                />
              </label>

              <button
                type="submit"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-5 text-sm font-black text-white shadow-[0_12px_28px_rgba(91,42,134,0.22)] transition hover:-translate-y-0.5 hover:bg-[#48206C]"
              >
                <UserRound
                  aria-hidden="true"
                  size={18}
                />
                Save My Profile
              </button>
            </div>
          </form>

          <form
            action={changePasswordAction}
            className="overflow-hidden rounded-[28px] border border-[#E9E2ED] bg-white shadow-[0_18px_50px_rgba(45,23,54,0.07)]"
          >
            <div className="border-b border-[#EEE8F1] bg-[#FAF8FC] p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F2E8F7] text-[#5B2A86]">
                  <LockKeyhole
                    aria-hidden="true"
                    size={21}
                  />
                </span>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7A459C]">
                    Account security
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-[#2D1736]">
                    Change My Password
                  </h2>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <label className="block">
                <span className="text-sm font-black text-[#35243C]">
                  Current password
                </span>

                <input
                  type="password"
                  name="currentPassword"
                  required
                  maxLength={256}
                  autoComplete="current-password"
                  placeholder="Enter current password"
                  className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-semibold text-[#2D1736] outline-none transition placeholder:text-[#AAA0AD] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#35243C]">
                  New password
                </span>

                <input
                  type="password"
                  name="newPassword"
                  required
                  minLength={12}
                  maxLength={128}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  aria-describedby="password-requirements"
                  className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-semibold text-[#2D1736] outline-none transition placeholder:text-[#AAA0AD] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#35243C]">
                  Confirm new password
                </span>

                <input
                  type="password"
                  name="confirmPassword"
                  required
                  minLength={12}
                  maxLength={128}
                  autoComplete="new-password"
                  placeholder="Enter the new password again"
                  className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-semibold text-[#2D1736] outline-none transition placeholder:text-[#AAA0AD] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
                />
              </label>

              <button
                type="submit"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#2D1736] px-5 text-sm font-black text-white shadow-[0_12px_28px_rgba(45,23,54,0.2)] transition hover:-translate-y-0.5 hover:bg-[#452351]"
              >
                <ShieldCheck
                  aria-hidden="true"
                  size={18}
                />
                Change Password Securely
              </button>
            </div>
          </form>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <article
            id="password-requirements"
            className="rounded-[24px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.06)]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFF3D5] text-[#8A6100]">
                <Sparkles
                  aria-hidden="true"
                  size={19}
                />
              </span>

              <h2 className="text-lg font-black text-[#2D1736]">
                Password requirements
              </h2>
            </div>

            <ul className="mt-5 space-y-3 text-sm font-semibold leading-6 text-[#756A79]">
              <li>• At least 12 characters</li>
              <li>• One uppercase letter</li>
              <li>• One lowercase letter</li>
              <li>• One number</li>
              <li>• One special character</li>
            </ul>
          </article>

          <article className="rounded-[24px] border border-red-100 bg-red-50 p-5">
            <h2 className="text-lg font-black text-red-900">
              Sign out securely
            </h2>

            <p className="mt-2 text-sm font-semibold leading-6 text-red-800/75">
              End the current administrator session on this
              device.
            </p>

            <form
              action="/api/admin/logout"
              method="post"
            >
              <button
                type="submit"
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-red-700 px-4 text-sm font-black text-white transition hover:bg-red-800"
              >
                <LogOut
                  aria-hidden="true"
                  size={17}
                />
                Sign Out
              </button>
            </form>
          </article>
        </section>
      </div>
    </AdminLayout>
  );
}