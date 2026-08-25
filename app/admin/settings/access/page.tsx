import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserCheck,
  UserPlus,
  UsersRound,
  UserX,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import {
  DEFAULT_CENTRE_HEAD_PERMISSIONS,
  getAdminSession,
  hashAdminPassword,
} from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type AccessPageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

const PERMISSION_OPTIONS = [
  {
    key: "dashboard.view",
    title: "Dashboard",
    description: "View the centre dashboard and daily summary.",
  },
  {
    key: "enquiries.manage",
    title: "Enquiries & Follow-ups",
    description: "Create, edit, follow up and close enquiries.",
  },
  {
    key: "admissions.manage",
    title: "Admissions",
    description: "Manage admission applications and documents.",
  },
  {
    key: "students.manage",
    title: "Students",
    description: "Add and update student and guardian profiles.",
  },
  {
    key: "attendance.manage",
    title: "Attendance",
    description: "Mark and update daily student attendance.",
  },
  {
    key: "fees.collect",
    title: "Fee Collection",
    description: "Create fee payments and collect pending fees.",
  },
  {
    key: "receipts.view",
    title: "Receipts",
    description: "View, download and share fee receipts.",
  },
  {
    key: "expenses.manage",
    title: "Expenses",
    description: "Record and update centre expenses.",
  },
  {
    key: "reports.view",
    title: "Reports",
    description: "View financial and operational reports.",
  },
  {
    key: "ca_export.download",
    title: "PDF & CA Exports",
    description:
      "Download financial, student, attendance and staff report PDFs.",
  },
  {
    key: "staff.view",
    title: "Staff Management",
    description:
      "Manage staff profiles, daily attendance, leave and extra-duty records. Payroll access is controlled separately.",
  },
  {
    key: "payroll.manage",
    title: "Payroll Management",
    description:
      "View salary calculations, generate payroll drafts and export payroll data. Owner approval and payment remain protected.",
  },
  {
    key: "website.manage",
    title: "Website Management",
    description: "Edit website content, photos and programmes.",
  },
  {
    key: "fees.settings",
    title: "Fee & GST Settings",
    description: "Change fees, GST rates and late-fee rules.",
  },
  {
    key: "centre.settings",
    title: "Centre Settings",
    description: "Edit school, receipt and centre information.",
  },
] as const;

const ALLOWED_PERMISSION_KEYS = new Set<string>(
  PERMISSION_OPTIONS.map((permission) => permission.key),
);

const DEFAULT_PERMISSION_KEYS = new Set<string>(
  DEFAULT_CENTRE_HEAD_PERMISSIONS,
);

function getSelectedPermissions(formData: FormData) {
  const permissions = new Set<string>(["dashboard.view"]);

  for (const value of formData.getAll("permissions")) {
    const permission = String(value);

    if (ALLOWED_PERMISSION_KEYS.has(permission)) {
      permissions.add(permission);
    }
  }

  return Array.from(permissions);
}

function readStoredPermissions(value: unknown) {
  if (!Array.isArray(value)) {
    return ["dashboard.view"];
  }

  const permissions = value.filter(
    (permission): permission is string =>
      typeof permission === "string" &&
      ALLOWED_PERMISSION_KEYS.has(permission),
  );

  return Array.from(
    new Set(["dashboard.view", ...permissions]),
  );
}

function validatePassword(password: string) {
  if (password.length < 12) {
    return "Password must contain at least 12 characters.";
  }

  if (password.length > 128) {
    return "Password cannot exceed 128 characters.";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must include a lowercase letter.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must include an uppercase letter.";
  }

  if (!/\d/.test(password)) {
    return "Password must include a number.";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must include a special character.";
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
    `/admin/settings/access?${type}=${encodeURIComponent(
      message,
    )}`,
  );
}

async function requireOwnerSession() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.role !== "OWNER") {
    redirect("/admin");
  }

  return session;
}

async function createCentreHeadAction(
  formData: FormData,
) {
  "use server";

  const owner = await requireOwnerSession();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(
    formData.get("password") ?? "",
  );
  const confirmPassword = String(
    formData.get("confirmPassword") ?? "",
  );

  if (name.length < 2 || name.length > 80) {
    redirectWithMessage(
      "error",
      "Enter a valid Centre Head name.",
    );
  }

  if (!isValidEmail(email)) {
    redirectWithMessage(
      "error",
      "Enter a valid Centre Head email address.",
    );
  }

  const passwordError = validatePassword(password);

  if (passwordError) {
    redirectWithMessage("error", passwordError);
  }

  if (password !== confirmPassword) {
    redirectWithMessage(
      "error",
      "Password and confirmation do not match.",
    );
  }

  const existingUser = await prisma.adminUser.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    redirectWithMessage(
      "error",
      "An administrator already uses this email address.",
    );
  }

  const passwordHash =
    await hashAdminPassword(password);

  const createdUser = await prisma.adminUser.create({
    data: {
      name,
      email,
      role: "CENTRE_HEAD",
      active: true,
      passwordHash,
      sessionVersion: 1,
      failedAttempts: 0,
      lockedUntil: null,
      passwordChangedAt: new Date(),
      mustChangePassword: true,
      permissions: getSelectedPermissions(formData),
    },
  });

  await prisma.activityLog.create({
    data: {
      adminUserId: owner.userId,
      action: "CREATED",
      entityType: "AdminUser",
      entityId: createdUser.id,
      description: `Centre Head access created for ${name}.`,
    },
  });

  revalidatePath("/admin/settings/access");

  redirectWithMessage(
    "success",
    `${name} can now sign in. They must change the temporary password after login.`,
  );
}

async function updateCentreHeadAction(
  formData: FormData,
) {
  "use server";

  const owner = await requireOwnerSession();

  const userId = String(formData.get("userId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (name.length < 2 || name.length > 80) {
    redirectWithMessage(
      "error",
      "Enter a valid Centre Head name.",
    );
  }

  if (!isValidEmail(email)) {
    redirectWithMessage(
      "error",
      "Enter a valid Centre Head email address.",
    );
  }

  const existingUser = await prisma.adminUser.findFirst({
    where: {
      id: userId,
      role: "CENTRE_HEAD",
    },
  });

  if (!existingUser) {
    redirectWithMessage(
      "error",
      "Centre Head account was not found.",
    );
  }

  const duplicateEmail =
    await prisma.adminUser.findFirst({
      where: {
        id: {
          not: userId,
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
      id: userId,
    },
    data: {
      name,
      email,
      permissions: getSelectedPermissions(formData),
      sessionVersion: {
        increment: 1,
      },
    },
  });

  await prisma.activityLog.create({
    data: {
      adminUserId: owner.userId,
      action: "UPDATED",
      entityType: "AdminUser",
      entityId: userId,
      description: `Centre Head profile and permissions updated for ${name}.`,
    },
  });

  revalidatePath("/admin/settings/access");

  redirectWithMessage(
    "success",
    `${name}'s profile and permissions were updated.`,
  );
}

async function toggleCentreHeadAction(
  formData: FormData,
) {
  "use server";

  const owner = await requireOwnerSession();
  const userId = String(formData.get("userId") ?? "");

  const existingUser = await prisma.adminUser.findFirst({
    where: {
      id: userId,
      role: "CENTRE_HEAD",
    },
  });

  if (!existingUser) {
    redirectWithMessage(
      "error",
      "Centre Head account was not found.",
    );
  }

  const nextActiveState = !existingUser.active;

  await prisma.adminUser.update({
    where: {
      id: userId,
    },
    data: {
      active: nextActiveState,
      failedAttempts: 0,
      lockedUntil: null,
      sessionVersion: {
        increment: 1,
      },
    },
  });

  await prisma.activityLog.create({
    data: {
      adminUserId: owner.userId,
      action: "UPDATED",
      entityType: "AdminUser",
      entityId: userId,
      description: `${existingUser.name}'s access was ${
        nextActiveState ? "activated" : "deactivated"
      }.`,
    },
  });

  revalidatePath("/admin/settings/access");

  redirectWithMessage(
    "success",
    `${existingUser.name}'s access is now ${
      nextActiveState ? "active" : "inactive"
    }.`,
  );
}

async function resetCentreHeadPasswordAction(
  formData: FormData,
) {
  "use server";

  const owner = await requireOwnerSession();

  const userId = String(formData.get("userId") ?? "");
  const newPassword = String(
    formData.get("newPassword") ?? "",
  );
  const confirmPassword = String(
    formData.get("confirmPassword") ?? "",
  );

  const existingUser = await prisma.adminUser.findFirst({
    where: {
      id: userId,
      role: "CENTRE_HEAD",
    },
  });

  if (!existingUser) {
    redirectWithMessage(
      "error",
      "Centre Head account was not found.",
    );
  }

  const passwordError = validatePassword(newPassword);

  if (passwordError) {
    redirectWithMessage("error", passwordError);
  }

  if (newPassword !== confirmPassword) {
    redirectWithMessage(
      "error",
      "Password and confirmation do not match.",
    );
  }

  const passwordHash =
    await hashAdminPassword(newPassword);

  await prisma.adminUser.update({
    where: {
      id: userId,
    },
    data: {
      passwordHash,
      passwordChangedAt: new Date(),
      mustChangePassword: true,
      failedAttempts: 0,
      lockedUntil: null,
      sessionVersion: {
        increment: 1,
      },
    },
  });

  await prisma.activityLog.create({
    data: {
      adminUserId: owner.userId,
      action: "UPDATED",
      entityType: "AdminUser",
      entityId: userId,
      description: `Temporary password reset for ${existingUser.name}.`,
    },
  });

  revalidatePath("/admin/settings/access");

  redirectWithMessage(
    "success",
    `${existingUser.name}'s temporary password was reset. They must change it after login.`,
  );
}

function formatDate(value: Date | null) {
  if (!value) {
    return "Never";
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

function PermissionCheckboxes({
  selectedPermissions,
}: {
  selectedPermissions: string[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {PERMISSION_OPTIONS.map((permission) => {
        const mandatory =
          permission.key === "dashboard.view";

        return (
          <label
            key={permission.key}
            className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#E5DCE9] bg-white p-4 transition hover:border-[#BDA5CB] hover:bg-[#FCFAFD]"
          >
            <input
              type="checkbox"
              name="permissions"
              value={permission.key}
              defaultChecked={
                mandatory ||
                selectedPermissions.includes(permission.key)
              }
              disabled={mandatory}
              className="mt-1 h-4 w-4 rounded border-[#BCAFC2] accent-[#5B2A86]"
            />

            {mandatory ? (
              <input
                type="hidden"
                name="permissions"
                value={permission.key}
              />
            ) : null}

            <span>
              <span className="block text-sm font-black text-[#35243E]">
                {permission.title}
              </span>

              <span className="mt-1 block text-xs font-semibold leading-5 text-[#817684]">
                {permission.description}
              </span>

              {mandatory ? (
                <span className="mt-2 inline-flex rounded-full bg-[#EEE4F3] px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#5B2A86]">
                  Always enabled
                </span>
              ) : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}

export default async function AccessManagementPage({
  searchParams,
}: AccessPageProps) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.role !== "OWNER") {
    redirect("/admin");
  }

  const [params, users] = await Promise.all([
    searchParams,
    prisma.adminUser.findMany({
      orderBy: [
        {
          role: "asc",
        },
        {
          name: "asc",
        },
      ],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        permissions: true,
        lastLoginAt: true,
        lockedUntil: true,
        mustChangePassword: true,
        createdAt: true,
      },
    }),
  ]);

  const owner = users.find((user) => user.role === "OWNER");
  const centreHeads = users.filter(
    (user) => user.role === "CENTRE_HEAD",
  );
  const activeCentreHeads = centreHeads.filter(
    (user) => user.active,
  ).length;
  const lockedCentreHeads = centreHeads.filter(
    (user) =>
      user.lockedUntil &&
      // Lock expiry is evaluated once for this server-rendered request.
      // eslint-disable-next-line react-hooks/purity
      user.lockedUntil.getTime() > Date.now(),
  ).length;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <section className="overflow-hidden rounded-[30px] bg-[#2D1736] px-5 py-7 text-white shadow-[0_24px_70px_rgba(45,23,54,0.18)] sm:px-7 lg:px-9 lg:py-9">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2D1736]">
                  <UsersRound
                    aria-hidden="true"
                    size={24}
                  />
                </span>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#F6C84B]">
                    Owner Control
                  </p>

                  <p className="mt-1 text-sm font-semibold text-white/60">
                    Secure team access management
                  </p>
                </div>
              </div>

              <h1 className="mt-6 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                Admin Access
              </h1>

              <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-white/70">
                Create Centre Head accounts, choose exactly
                what they can manage, reset passwords and
                deactivate access instantly.
              </p>
            </div>

            <Link
              href="/admin/settings"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/15"
            >
              <ArrowLeft aria-hidden="true" size={18} />
              Back to Settings
            </Link>
          </div>
        </section>

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

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={ShieldCheck}
            label="Owner"
            value={owner?.name ?? "Owner"}
            detail="Full centre control"
          />

          <SummaryCard
            icon={UsersRound}
            label="Centre Heads"
            value={String(centreHeads.length)}
            detail="Accounts created"
          />

          <SummaryCard
            icon={UserCheck}
            label="Active Access"
            value={String(activeCentreHeads)}
            detail="Can sign in"
          />

          <SummaryCard
            icon={LockKeyhole}
            label="Locked"
            value={String(lockedCentreHeads)}
            detail="Temporarily locked"
          />
        </section>

        <section className="overflow-hidden rounded-[28px] border border-[#E9E2ED] bg-white shadow-[0_18px_50px_rgba(45,23,54,0.07)]">
          <div className="border-b border-[#EEE8F1] bg-[#FAF8FC] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F2E8F7] text-[#5B2A86]">
                <UserPlus aria-hidden="true" size={21} />
              </span>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7A459C]">
                  New administrator
                </p>

                <h2 className="mt-1 text-2xl font-black text-[#2D1736]">
                  Add a Centre Head
                </h2>

                <p className="mt-2 text-sm font-semibold leading-6 text-[#817684]">
                  They will sign in using their email and
                  temporary password.
                </p>
              </div>
            </div>
          </div>

          <form
            action={createCentreHeadAction}
            className="space-y-7 p-5 sm:p-6"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-black text-[#35243E]">
                  Full name
                </span>

                <input
                  type="text"
                  name="name"
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                  placeholder="Enter Centre Head name"
                  className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] px-4 text-sm font-semibold text-[#2D1736] outline-none focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#35243E]">
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
                    autoComplete="email"
                    placeholder="name@example.com"
                    className="min-h-12 w-full rounded-2xl border border-[#DCCFE4] pl-11 pr-4 text-sm font-semibold text-[#2D1736] outline-none focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#35243E]">
                  Temporary password
                </span>

                <input
                  type="password"
                  name="password"
                  required
                  minLength={12}
                  maxLength={128}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] px-4 text-sm font-semibold text-[#2D1736] outline-none focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#35243E]">
                  Confirm password
                </span>

                <input
                  type="password"
                  name="confirmPassword"
                  required
                  minLength={12}
                  maxLength={128}
                  autoComplete="new-password"
                  placeholder="Enter password again"
                  className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] px-4 text-sm font-semibold text-[#2D1736] outline-none focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
                />
              </label>
            </div>

            <div>
              <h3 className="text-lg font-black text-[#2D1736]">
                Centre Head permissions
              </h3>

              <p className="mt-1 text-sm font-semibold text-[#817684]">
                Tick only the sections this person should use.
              </p>

              <div className="mt-4">
                <PermissionCheckboxes
                  selectedPermissions={Array.from(
                    DEFAULT_PERMISSION_KEYS,
                  )}
                />
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-5 text-sm font-black text-white shadow-[0_12px_28px_rgba(91,42,134,0.22)] transition hover:-translate-y-0.5 hover:bg-[#48206C]"
            >
              <UserPlus aria-hidden="true" size={18} />
              Create Centre Head Access
            </button>
          </form>
        </section>

        <section className="space-y-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7A459C]">
              Team accounts
            </p>

            <h2 className="mt-2 text-2xl font-black text-[#2D1736]">
              Centre Head Access
            </h2>
          </div>

          {centreHeads.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-[#D8C9E0] bg-white p-10 text-center">
              <UsersRound
                aria-hidden="true"
                size={34}
                className="mx-auto text-[#7A459C]"
              />

              <h3 className="mt-4 text-xl font-black text-[#2D1736]">
                No Centre Head account yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-[#817684]">
                Use the form above when you are ready to
                provide secure panel access.
              </p>
            </div>
          ) : (
            centreHeads.map((user) => {
              const permissions = readStoredPermissions(
                user.permissions,
              );
              const currentlyLocked =
                Boolean(user.lockedUntil) &&
                // Lock expiry is evaluated once for this server-rendered request.
                // eslint-disable-next-line react-hooks/purity
                user.lockedUntil!.getTime() > Date.now();

              return (
                <article
                  key={user.id}
                  className="overflow-hidden rounded-[28px] border border-[#E9E2ED] bg-white shadow-[0_16px_45px_rgba(45,23,54,0.06)]"
                >
                  <div className="flex flex-col gap-5 border-b border-[#EEE8F1] bg-[#FAF8FC] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div className="flex items-center gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#5B2A86] text-lg font-black uppercase text-white">
                        {user.name.charAt(0)}
                      </span>

                      <div>
                        <h3 className="text-xl font-black text-[#2D1736]">
                          {user.name}
                        </h3>

                        <p className="mt-1 text-sm font-semibold text-[#817684]">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={[
                          "rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-[0.08em]",
                          currentlyLocked
                            ? "bg-red-100 text-red-800"
                            : user.active
                              ? "bg-green-100 text-green-800"
                              : "bg-slate-200 text-slate-700",
                        ].join(" ")}
                      >
                        {currentlyLocked
                          ? "Locked"
                          : user.active
                            ? "Active"
                            : "Inactive"}
                      </span>

                      {user.mustChangePassword ? (
                        <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-black uppercase tracking-[0.08em] text-amber-800">
                          Password change required
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_300px]">
                    <form
                      action={updateCentreHeadAction}
                      className="space-y-6"
                    >
                      <input
                        type="hidden"
                        name="userId"
                        value={user.id}
                      />

                      <div className="grid gap-4 md:grid-cols-2">
                        <label>
                          <span className="text-sm font-black text-[#35243E]">
                            Full name
                          </span>

                          <input
                            type="text"
                            name="name"
                            required
                            minLength={2}
                            maxLength={80}
                            defaultValue={user.name}
                            className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] px-4 text-sm font-semibold text-[#2D1736] outline-none focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
                          />
                        </label>

                        <label>
                          <span className="text-sm font-black text-[#35243E]">
                            Login email
                          </span>

                          <input
                            type="email"
                            name="email"
                            required
                            maxLength={254}
                            defaultValue={user.email ?? ""}
                            className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] px-4 text-sm font-semibold text-[#2D1736] outline-none focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
                          />
                        </label>
                      </div>

                      <div>
                        <h4 className="text-base font-black text-[#2D1736]">
                          Allowed sections
                        </h4>

                        <p className="mt-1 text-sm font-semibold text-[#817684]">
                          Saving permissions signs this user
                          out so the new access applies
                          immediately.
                        </p>

                        <div className="mt-4">
                          <PermissionCheckboxes
                            selectedPermissions={permissions}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-5 text-sm font-black text-white transition hover:bg-[#48206C]"
                      >
                        <ShieldCheck
                          aria-hidden="true"
                          size={18}
                        />
                        Save Profile & Permissions
                      </button>
                    </form>

                    <aside className="space-y-4">
                      <div className="rounded-2xl border border-[#E7DFEA] bg-[#FAF8FC] p-4">
                        <div className="flex items-center gap-2 text-[#5B2A86]">
                          <Clock3
                            aria-hidden="true"
                            size={17}
                          />

                          <p className="text-xs font-black uppercase tracking-[0.1em]">
                            Last login
                          </p>
                        </div>

                        <p className="mt-2 text-sm font-black text-[#2D1736]">
                          {formatDate(user.lastLoginAt)}
                        </p>
                      </div>

                      <form action={toggleCentreHeadAction}>
                        <input
                          type="hidden"
                          name="userId"
                          value={user.id}
                        />

                        <button
                          type="submit"
                          className={[
                            "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black transition",
                            user.active
                              ? "border border-red-200 bg-red-50 text-red-800 hover:bg-red-100"
                              : "bg-green-700 text-white hover:bg-green-800",
                          ].join(" ")}
                        >
                          {user.active ? (
                            <>
                              <UserX
                                aria-hidden="true"
                                size={17}
                              />
                              Deactivate Access
                            </>
                          ) : (
                            <>
                              <UserCheck
                                aria-hidden="true"
                                size={17}
                              />
                              Activate Access
                            </>
                          )}
                        </button>
                      </form>

                      <details className="rounded-2xl border border-[#E7DFEA] bg-white">
                        <summary className="cursor-pointer list-none p-4 text-sm font-black text-[#5B2A86]">
                          <span className="flex items-center gap-2">
                            <KeyRound
                              aria-hidden="true"
                              size={17}
                            />
                            Reset Temporary Password
                          </span>
                        </summary>

                        <form
                          action={
                            resetCentreHeadPasswordAction
                          }
                          className="space-y-4 border-t border-[#EEE8F1] p-4"
                        >
                          <input
                            type="hidden"
                            name="userId"
                            value={user.id}
                          />

                          <input
                            type="password"
                            name="newPassword"
                            required
                            minLength={12}
                            maxLength={128}
                            autoComplete="new-password"
                            placeholder="New temporary password"
                            className="min-h-11 w-full rounded-xl border border-[#DCCFE4] px-3 text-sm font-semibold outline-none focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
                          />

                          <input
                            type="password"
                            name="confirmPassword"
                            required
                            minLength={12}
                            maxLength={128}
                            autoComplete="new-password"
                            placeholder="Confirm password"
                            className="min-h-11 w-full rounded-xl border border-[#DCCFE4] px-3 text-sm font-semibold outline-none focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
                          />

                          <button
                            type="submit"
                            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2D1736] px-4 text-sm font-black text-white hover:bg-[#452351]"
                          >
                            <LockKeyhole
                              aria-hidden="true"
                              size={16}
                            />
                            Reset Password
                          </button>
                        </form>
                      </details>
                    </aside>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
    </AdminLayout>
  );
}

type SummaryCardProps = {
  icon: typeof ShieldCheck;
  label: string;
  value: string;
  detail: string;
};

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
}: SummaryCardProps) {
  return (
    <article className="rounded-[24px] border border-[#E9E2ED] bg-white p-5 shadow-[0_12px_35px_rgba(45,23,54,0.05)]">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
        <Icon aria-hidden="true" size={20} />
      </span>

      <p className="mt-4 text-xs font-black uppercase tracking-[0.12em] text-[#817684]">
        {label}
      </p>

      <p className="mt-2 truncate text-2xl font-black text-[#2D1736]">
        {value}
      </p>

      <p className="mt-1 text-sm font-semibold text-[#817684]">
        {detail}
      </p>
    </article>
  );
}
