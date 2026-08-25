import "server-only";

import {
  createHash,
  createHmac,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from "node:crypto";

import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

const ADMIN_COOKIE_NAME =
  "kidzee_admin_session";

const ADMIN_CREDENTIAL_ID = "primary";

const PRIMARY_OWNER_USER_ID =
  "primary-owner";

const SESSION_DURATION_SECONDS =
  60 * 60 * 8;

const MAX_FAILED_ATTEMPTS = 5;

const LOCK_DURATION_MILLISECONDS =
  15 * 60 * 1000;

export const DEFAULT_CENTRE_HEAD_PERMISSIONS =
  [
    "dashboard.view",
    "enquiries.manage",
    "admissions.manage",
    "students.manage",
    "attendance.manage",
    "fees.collect",
    "receipts.view",
    "expenses.manage",
    "staff.view",
  ] as const;

type AdminRoleValue =
  | "OWNER"
  | "CENTRE_HEAD";

type AdminSessionSource =
  | "legacy"
  | "user";

type AdminSessionPayload = {
  role: "admin";
  expiresAt: number;
  sessionVersion: number;
  userId?: string;
  adminRole?: AdminRoleValue;
  permissions?: string[];
  mustChangePassword?: boolean;
};

export type AdminSessionClaims = {
  userId?: string;
  role: AdminRoleValue;
  permissions: string[];
  mustChangePassword: boolean;
  expiresAt: number;
  source: AdminSessionSource;
};

export type AdminSessionInfo = {
  userId: string;
  name: string;
  email: string | null;
  role: AdminRoleValue;
  permissions: string[];
  mustChangePassword: boolean;
  expiresAt: number;
  source: AdminSessionSource;
};

type PasswordVerificationResult = {
  valid: boolean;
  lockedUntil: Date | null;
  sessionVersion: number;
};

export type AdminLoginResult =
  PasswordVerificationResult & {
    userId: string | null;
    name: string | null;
    email: string | null;
    role: AdminRoleValue | null;
    active: boolean;
    mustChangePassword: boolean;
  };

function getInitialAdminPassword() {
  const password =
    process.env.ADMIN_PANEL_PASSWORD;

  if (!password) {
    throw new Error(
      "Missing ADMIN_PANEL_PASSWORD in .env.local",
    );
  }

  return password;
}

function getSessionSecret() {
  const secret =
    process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "Missing ADMIN_SESSION_SECRET in .env.local",
    );
  }

  return secret;
}

function createSignature(value: string) {
  return createHmac(
    "sha256",
    getSessionSecret(),
  )
    .update(value)
    .digest("base64url");
}

function safeCompare(
  left: string,
  right: string,
) {
  const leftHash = createHash("sha256")
    .update(left)
    .digest();

  const rightHash = createHash("sha256")
    .update(right)
    .digest();

  return timingSafeEqual(
    leftHash,
    rightHash,
  );
}

function derivePasswordKey(
  password: string,
  salt: string,
) {
  return new Promise<Buffer>(
    (resolve, reject) => {
      scrypt(
        password,
        salt,
        64,
        (error, derivedKey) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(derivedKey);
        },
      );
    },
  );
}

export async function hashAdminPassword(
  password: string,
) {
  const salt =
    randomBytes(16).toString("hex");

  const derivedKey =
    await derivePasswordKey(
      password,
      salt,
    );

  return [
    "scrypt",
    salt,
    derivedKey.toString("hex"),
  ].join("$");
}

async function verifyStoredPassword(
  password: string,
  storedHash: string,
) {
  const [
    algorithm,
    salt,
    hash,
  ] = storedHash.split("$");

  if (
    algorithm !== "scrypt" ||
    !salt ||
    !hash
  ) {
    return false;
  }

  const storedKey = Buffer.from(
    hash,
    "hex",
  );

  if (storedKey.length === 0) {
    return false;
  }

  const submittedKey =
    await derivePasswordKey(
      password,
      salt,
    );

  if (
    submittedKey.length !==
    storedKey.length
  ) {
    return false;
  }

  return timingSafeEqual(
    submittedKey,
    storedKey,
  );
}

function normaliseEmail(value: string) {
  return value.trim().toLowerCase();
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getJsonText(
  value: Record<string, unknown>,
  key: string,
) {
  const item = value[key];

  return typeof item === "string"
    ? item.trim()
    : "";
}

function normalisePermissions(
  value: unknown,
  role: AdminRoleValue,
) {
  if (role === "OWNER") {
    return ["*"];
  }

  if (!Array.isArray(value)) {
    return [
      ...DEFAULT_CENTRE_HEAD_PERMISSIONS,
    ];
  }

  const permissions = value
    .filter(
      (item): item is string =>
        typeof item === "string",
    )
    .map((item) => item.trim())
    .filter(Boolean);

  return permissions.length > 0
    ? permissions
    : [
        ...DEFAULT_CENTRE_HEAD_PERMISSIONS,
      ];
}

async function ensureAdminCredential() {
  const existingCredential =
    await prisma.adminCredential.findUnique({
      where: {
        id: ADMIN_CREDENTIAL_ID,
      },
    });

  if (existingCredential) {
    return existingCredential;
  }

  const initialPasswordHash =
    await hashAdminPassword(
      getInitialAdminPassword(),
    );

  return prisma.adminCredential.upsert({
    where: {
      id: ADMIN_CREDENTIAL_ID,
    },

    create: {
      id: ADMIN_CREDENTIAL_ID,
      passwordHash:
        initialPasswordHash,
      sessionVersion: 1,
    },

    update: {},
  });
}

async function getOwnerDefaults() {
  const setting =
    await prisma.centreSetting.findUnique({
      where: {
        key: "SCHOOL_PROFILE",
      },
    });

  const profile = isRecord(
    setting?.value,
  )
    ? setting.value
    : {};

  const configuredEmail =
    normaliseEmail(
      process.env.ADMIN_OWNER_EMAIL ??
        "",
    ) ||
    normaliseEmail(
      getJsonText(profile, "email"),
    );

  const configuredName =
    (
      process.env.ADMIN_OWNER_NAME ??
      ""
    ).trim() || "Centre Owner";

  return {
    email:
      configuredEmail || null,
    name: configuredName,
  };
}

async function getAvailableOwnerEmail(
  requestedEmail: string | null,
  currentUserId?: string,
) {
  if (!requestedEmail) {
    return null;
  }

  const existingUser =
    await prisma.adminUser.findFirst({
      where: {
        email: {
          equals: requestedEmail,
          mode: "insensitive",
        },

        ...(currentUserId
          ? {
              id: {
                not: currentUserId,
              },
            }
          : {}),
      },

      select: {
        id: true,
      },
    });

  return existingUser
    ? null
    : requestedEmail;
}

export async function ensurePrimaryOwnerUser() {
  const [
    credential,
    defaults,
  ] = await Promise.all([
    ensureAdminCredential(),
    getOwnerDefaults(),
  ]);

  const existingOwner =
    await prisma.adminUser.findFirst({
      where: {
        role: "OWNER",
      },

      orderBy: {
        createdAt: "asc",
      },
    });

  if (existingOwner) {
    const availableEmail =
      existingOwner.email
        ? null
        : await getAvailableOwnerEmail(
            defaults.email,
            existingOwner.id,
          );

    const needsUpdate =
      !existingOwner.passwordHash ||
      !existingOwner.passwordChangedAt ||
      Boolean(availableEmail);

    if (!needsUpdate) {
      return existingOwner;
    }

    return prisma.adminUser.update({
      where: {
        id: existingOwner.id,
      },

      data: {
        ...(!existingOwner.passwordHash
          ? {
              passwordHash:
                credential.passwordHash,
            }
          : {}),

        ...(!existingOwner
          .passwordChangedAt
          ? {
              passwordChangedAt:
                credential.passwordChangedAt,
            }
          : {}),

        ...(availableEmail
          ? {
              email: availableEmail,
            }
          : {}),

        active: true,
        mustChangePassword: false,
      },
    });
  }

  const availableEmail =
    await getAvailableOwnerEmail(
      defaults.email,
      PRIMARY_OWNER_USER_ID,
    );

  const existingPrimaryUser =
    await prisma.adminUser.findUnique({
      where: {
        id: PRIMARY_OWNER_USER_ID,
      },
    });

  if (existingPrimaryUser) {
    return prisma.adminUser.update({
      where: {
        id: existingPrimaryUser.id,
      },

      data: {
        name:
          existingPrimaryUser.name ||
          defaults.name,

        email:
          existingPrimaryUser.email ??
          availableEmail,

        role: "OWNER",
        active: true,

        passwordHash:
          existingPrimaryUser
            .passwordHash ??
          credential.passwordHash,

        passwordChangedAt:
          existingPrimaryUser
            .passwordChangedAt ??
          credential.passwordChangedAt,

        mustChangePassword: false,
      },
    });
  }

  return prisma.adminUser.create({
    data: {
      id: PRIMARY_OWNER_USER_ID,
      name: defaults.name,
      email: availableEmail,
      role: "OWNER",
      active: true,
      passwordHash:
        credential.passwordHash,
      sessionVersion:
        credential.sessionVersion,
      failedAttempts: 0,
      lockedUntil: null,
      passwordChangedAt:
        credential.passwordChangedAt,
      mustChangePassword: false,
      permissions: ["*"],
    },
  });
}

export async function verifyAdminPassword(
  submittedPassword: string,
): Promise<PasswordVerificationResult> {
  let credential =
    await ensureAdminCredential();

  const now = new Date();

  if (
    credential.lockedUntil &&
    credential.lockedUntil > now
  ) {
    return {
      valid: false,
      lockedUntil:
        credential.lockedUntil,
      sessionVersion:
        credential.sessionVersion,
    };
  }

  if (
    credential.lockedUntil &&
    credential.lockedUntil <= now
  ) {
    credential =
      await prisma.adminCredential.update({
        where: {
          id: ADMIN_CREDENTIAL_ID,
        },

        data: {
          failedAttempts: 0,
          lockedUntil: null,
        },
      });
  }

  const passwordIsCorrect =
    await verifyStoredPassword(
      submittedPassword,
      credential.passwordHash,
    );

  if (passwordIsCorrect) {
    const updatedCredential =
      await prisma.adminCredential.update({
        where: {
          id: ADMIN_CREDENTIAL_ID,
        },

        data: {
          failedAttempts: 0,
          lockedUntil: null,
          lastLoginAt: now,
        },
      });

    return {
      valid: true,
      lockedUntil: null,
      sessionVersion:
        updatedCredential.sessionVersion,
    };
  }

  const nextFailedAttempts =
    credential.failedAttempts + 1;

  const shouldLock =
    nextFailedAttempts >=
    MAX_FAILED_ATTEMPTS;

  const lockedUntil = shouldLock
    ? new Date(
        now.getTime() +
          LOCK_DURATION_MILLISECONDS,
      )
    : null;

  await prisma.adminCredential.update({
    where: {
      id: ADMIN_CREDENTIAL_ID,
    },

    data: {
      failedAttempts: shouldLock
        ? 0
        : nextFailedAttempts,

      lockedUntil,
    },
  });

  return {
    valid: false,
    lockedUntil,
    sessionVersion:
      credential.sessionVersion,
  };
}

async function verifyAdminUserPassword(
  user: {
    id: string;
    active: boolean;
    passwordHash: string | null;
    sessionVersion: number;
    failedAttempts: number;
    lockedUntil: Date | null;
  },
  submittedPassword: string,
): Promise<PasswordVerificationResult> {
  if (
    !user.active ||
    !user.passwordHash
  ) {
    return {
      valid: false,
      lockedUntil: null,
      sessionVersion:
        user.sessionVersion,
    };
  }

  let currentUser = user;
  const now = new Date();

  if (
    currentUser.lockedUntil &&
    currentUser.lockedUntil > now
  ) {
    return {
      valid: false,
      lockedUntil:
        currentUser.lockedUntil,
      sessionVersion:
        currentUser.sessionVersion,
    };
  }

  if (
    currentUser.lockedUntil &&
    currentUser.lockedUntil <= now
  ) {
    currentUser =
      await prisma.adminUser.update({
        where: {
          id: currentUser.id,
        },

        data: {
          failedAttempts: 0,
          lockedUntil: null,
        },
      });
  }

  const passwordIsCorrect =
    await verifyStoredPassword(
      submittedPassword,
      currentUser.passwordHash ??
        "",
    );

  if (passwordIsCorrect) {
    const updatedUser =
      await prisma.adminUser.update({
        where: {
          id: currentUser.id,
        },

        data: {
          failedAttempts: 0,
          lockedUntil: null,
          lastLoginAt: now,
        },
      });

    return {
      valid: true,
      lockedUntil: null,
      sessionVersion:
        updatedUser.sessionVersion,
    };
  }

  const nextFailedAttempts =
    currentUser.failedAttempts + 1;

  const shouldLock =
    nextFailedAttempts >=
    MAX_FAILED_ATTEMPTS;

  const lockedUntil = shouldLock
    ? new Date(
        now.getTime() +
          LOCK_DURATION_MILLISECONDS,
      )
    : null;

  await prisma.adminUser.update({
    where: {
      id: currentUser.id,
    },

    data: {
      failedAttempts: shouldLock
        ? 0
        : nextFailedAttempts,

      lockedUntil,
    },
  });

  return {
    valid: false,
    lockedUntil,
    sessionVersion:
      currentUser.sessionVersion,
  };
}

export async function verifyAdminLogin(
  email: string,
  submittedPassword: string,
): Promise<AdminLoginResult> {
  const owner =
    await ensurePrimaryOwnerUser();

  const normalisedEmail =
    normaliseEmail(email);

  const user = normalisedEmail
    ? await prisma.adminUser.findFirst({
        where: {
          email: {
            equals:
              normalisedEmail,
            mode: "insensitive",
          },
        },
      })
    : owner;

  if (!user) {
    if (owner.passwordHash) {
      await verifyStoredPassword(
        submittedPassword,
        owner.passwordHash,
      );
    }

    return {
      valid: false,
      lockedUntil: null,
      sessionVersion: 1,
      userId: null,
      name: null,
      email: null,
      role: null,
      active: false,
      mustChangePassword: false,
    };
  }

  const verification =
    await verifyAdminUserPassword(
      user,
      submittedPassword,
    );

  return {
    ...verification,
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    mustChangePassword:
      user.mustChangePassword,
  };
}

function encodePayload(
  payload: AdminSessionPayload,
) {
  return Buffer.from(
    JSON.stringify(payload),
    "utf8",
  ).toString("base64url");
}

function isAdminRoleValue(
  value: unknown,
): value is AdminRoleValue {
  return (
    value === "OWNER" ||
    value === "CENTRE_HEAD"
  );
}

function decodePayload(
  encodedPayload: string,
): AdminSessionPayload | null {
  try {
    const decoded = Buffer.from(
      encodedPayload,
      "base64url",
    ).toString("utf8");

    const payload = JSON.parse(
      decoded,
    ) as {
      role?: unknown;
      expiresAt?: unknown;
      sessionVersion?: unknown;
      userId?: unknown;
      adminRole?: unknown;
      permissions?: unknown;
      mustChangePassword?: unknown;
    };

    if (
      payload.role !== "admin" ||
      typeof payload.expiresAt !==
        "number"
    ) {
      return null;
    }

    return {
      role: "admin",
      expiresAt: payload.expiresAt,

      sessionVersion:
        typeof payload.sessionVersion ===
        "number"
          ? payload.sessionVersion
          : 1,

      userId:
        typeof payload.userId ===
        "string"
          ? payload.userId
          : undefined,

      adminRole: isAdminRoleValue(
        payload.adminRole,
      )
        ? payload.adminRole
        : undefined,

      permissions: Array.isArray(
        payload.permissions,
      )
        ? payload.permissions.filter(
            (permission): permission is string =>
              typeof permission === "string",
          )
        : undefined,

      mustChangePassword:
        typeof payload.mustChangePassword ===
        "boolean"
          ? payload.mustChangePassword
          : undefined,
    };
  } catch {
    return null;
  }
}

function readVerifiedSessionPayload(
  token: string | undefined,
) {
  if (!token) {
    return null;
  }

  const [encodedPayload, receivedSignature] =
    token.split(".");

  if (!encodedPayload || !receivedSignature) {
    return null;
  }

  const expectedSignature =
    createSignature(encodedPayload);

  if (
    !safeCompare(
      receivedSignature,
      expectedSignature,
    )
  ) {
    return null;
  }

  const payload =
    decodePayload(encodedPayload);

  if (
    !payload ||
    payload.expiresAt <=
      Math.floor(Date.now() / 1000)
  ) {
    return null;
  }

  return payload;
}

export function getAdminSessionClaimsFromToken(
  token: string | undefined,
): AdminSessionClaims | null {
  const payload =
    readVerifiedSessionPayload(token);

  if (!payload) {
    return null;
  }

  if (!payload.userId) {
    return {
      role: "OWNER",
      permissions: ["*"],
      mustChangePassword: false,
      expiresAt: payload.expiresAt,
      source: "legacy",
    };
  }

  if (!payload.adminRole) {
    return null;
  }

  if (
    payload.adminRole === "CENTRE_HEAD" &&
    !payload.permissions
  ) {
    // Older centre-head cookies do not contain signed permission claims.
    // Requiring a fresh login is safer than guessing their current access.
    return null;
  }

  return {
    userId: payload.userId,
    role: payload.adminRole,
    permissions: normalisePermissions(
      payload.permissions,
      payload.adminRole,
    ),
    mustChangePassword:
      payload.mustChangePassword ?? false,
    expiresAt: payload.expiresAt,
    source: "user",
  };
}

async function createSignedSessionToken(
  payload: AdminSessionPayload,
) {
  const encodedPayload =
    encodePayload(payload);

  const signature =
    createSignature(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

async function createUserSessionToken(
  userId: string,
  requestedSessionVersion?: number,
) {
  const user =
    await prisma.adminUser.findUnique({
      where: {
        id: userId,
      },
    });

  if (
    !user ||
    !user.active ||
    !user.passwordHash
  ) {
    throw new Error(
      "The admin user is not available.",
    );
  }

  return createSignedSessionToken({
    role: "admin",
    userId: user.id,
    adminRole: user.role,
    permissions: normalisePermissions(
      user.permissions,
      user.role,
    ),
    mustChangePassword:
      user.mustChangePassword,

    expiresAt:
      Math.floor(Date.now() / 1000) +
      SESSION_DURATION_SECONDS,

    sessionVersion:
      requestedSessionVersion ??
      user.sessionVersion,
  });
}

async function resolveAdminSessionToken(
  token: string | undefined,
): Promise<AdminSessionInfo | null> {
  const payload =
    readVerifiedSessionPayload(token);

  if (!payload) {
    return null;
  }

  if (payload.userId) {
    const user =
      await prisma.adminUser.findUnique({
        where: {
          id: payload.userId,
        },
      });

    if (
      !user ||
      !user.active ||
      !user.passwordHash ||
      payload.sessionVersion !==
        user.sessionVersion ||
      (payload.adminRole &&
        payload.adminRole !==
          user.role)
    ) {
      return null;
    }

    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,

      permissions:
        normalisePermissions(
          user.permissions,
          user.role,
        ),

      mustChangePassword:
        user.mustChangePassword,

      expiresAt: payload.expiresAt,
      source: "user",
    };
  }

  const credential =
    await ensureAdminCredential();

  if (
    payload.sessionVersion !==
    credential.sessionVersion
  ) {
    return null;
  }

  const owner =
    await ensurePrimaryOwnerUser();

  return {
    userId: owner.id,
    name: owner.name,
    email: owner.email,
    role: "OWNER",
    permissions: ["*"],
    mustChangePassword: false,
    expiresAt: payload.expiresAt,
    source: "legacy",
  };
}

async function getSessionTokenFromCookie() {
  const cookieStore = await cookies();

  return cookieStore.get(
    ADMIN_COOKIE_NAME,
  )?.value;
}

export async function getAdminSessionFromToken(
  token: string | undefined,
) {
  return resolveAdminSessionToken(token);
}

export async function getAdminSession() {
  const token =
    await getSessionTokenFromCookie();

  return getAdminSessionFromToken(token);
}

export async function createAdminSessionToken(
  requestedSessionVersion?: number,
  requestedUserId?: string,
) {
  if (requestedUserId) {
    return createUserSessionToken(
      requestedUserId,
      requestedSessionVersion,
    );
  }

  const currentSession =
    await getAdminSession();

  if (
    currentSession?.source ===
    "user"
  ) {
    return createUserSessionToken(
      currentSession.userId,
      requestedSessionVersion,
    );
  }

  const sessionVersion =
    requestedSessionVersion ??
    (await ensureAdminCredential())
      .sessionVersion;

  return createSignedSessionToken({
    role: "admin",

    expiresAt:
      Math.floor(Date.now() / 1000) +
      SESSION_DURATION_SECONDS,

    sessionVersion,
  });
}

export async function verifyAdminSessionToken(
  token: string | undefined,
) {
  const session =
    await resolveAdminSessionToken(
      token,
    );

  return session !== null;
}

export async function isAdminAuthenticated(
  requiredPermission?: string,
) {
  const session =
    await getAdminSession();

  if (!session) {
    return false;
  }

  if (!requiredPermission) {
    return true;
  }

  return (
    session.role === "OWNER" ||
    session.permissions.includes("*") ||
    session.permissions.includes(
      requiredPermission,
    )
  );
}

export async function isOwnerAuthenticated() {
  const session =
    await getAdminSession();

  return session?.role === "OWNER";
}

export async function getCurrentAdminUser() {
  return getAdminSession();
}

export async function requireAdmin() {
  const session =
    await getAdminSession();

  if (!session) {
    throw new Error(
      "UNAUTHENTICATED",
    );
  }

  return session;
}

export async function requireOwner() {
  const session =
    await getAdminSession();

  if (!session) {
    throw new Error(
      "UNAUTHENTICATED",
    );
  }

  if (session.role !== "OWNER") {
    throw new Error("FORBIDDEN");
  }

  return session;
}

export async function hasAdminPermission(
  permission: string,
) {
  const session =
    await getAdminSession();

  if (!session) {
    return false;
  }

  return (
    session.role === "OWNER" ||
    session.permissions.includes("*") ||
    session.permissions.includes(
      permission,
    )
  );
}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string,
) {
  const session =
    await getAdminSession();

  if (!session) {
    return {
      success: false as const,
      message:
        "Your session has expired. Please sign in again.",
      lockedUntil: null,
    };
  }

  if (
    safeCompare(
      currentPassword,
      newPassword,
    )
  ) {
    return {
      success: false as const,
      message:
        "The new password must be different from the current password.",
      lockedUntil: null,
    };
  }

  if (session.source === "user") {
    const user =
      await prisma.adminUser.findUnique({
        where: {
          id: session.userId,
        },
      });

    if (!user) {
      return {
        success: false as const,
        message:
          "The admin account could not be found.",
        lockedUntil: null,
      };
    }

    const verification =
      await verifyAdminUserPassword(
        user,
        currentPassword,
      );

    if (!verification.valid) {
      return {
        success: false as const,

        message:
          verification.lockedUntil
            ? "Too many incorrect attempts. Please wait 15 minutes before trying again."
            : "The current password is incorrect.",

        lockedUntil:
          verification.lockedUntil,
      };
    }

    const passwordHash =
      await hashAdminPassword(
        newPassword,
      );

    const updatedUser =
      await prisma.$transaction(
        async (transaction) => {
          const savedUser =
            await transaction.adminUser.update({
              where: {
                id: user.id,
              },

              data: {
                passwordHash,
                passwordChangedAt:
                  new Date(),

                sessionVersion: {
                  increment: 1,
                },

                failedAttempts: 0,
                lockedUntil: null,
                mustChangePassword: false,
              },
            });

          if (
            savedUser.role === "OWNER"
          ) {
            await transaction.adminCredential.upsert(
              {
                where: {
                  id: ADMIN_CREDENTIAL_ID,
                },

                create: {
                  id: ADMIN_CREDENTIAL_ID,
                  passwordHash,

                  sessionVersion:
                    savedUser.sessionVersion,

                  passwordChangedAt:
                    new Date(),
                },

                update: {
                  passwordHash,

                  sessionVersion:
                    savedUser.sessionVersion,

                  passwordChangedAt:
                    new Date(),

                  failedAttempts: 0,
                  lockedUntil: null,
                },
              },
            );
          }

          return savedUser;
        },
      );

    return {
      success: true as const,
      message:
        "Password changed successfully.",

      sessionVersion:
        updatedUser.sessionVersion,

      userId: updatedUser.id,
    };
  }

  const verification =
    await verifyAdminPassword(
      currentPassword,
    );

  if (!verification.valid) {
    return {
      success: false as const,

      message:
        verification.lockedUntil
          ? "Too many incorrect attempts. Please wait 15 minutes before trying again."
          : "The current password is incorrect.",

      lockedUntil:
        verification.lockedUntil,
    };
  }

  const passwordHash =
    await hashAdminPassword(
      newPassword,
    );

  const owner =
    await ensurePrimaryOwnerUser();

  const result =
    await prisma.$transaction(
      async (transaction) => {
        const updatedCredential =
          await transaction.adminCredential.update(
            {
              where: {
                id: ADMIN_CREDENTIAL_ID,
              },

              data: {
                passwordHash,
                passwordChangedAt:
                  new Date(),

                sessionVersion: {
                  increment: 1,
                },

                failedAttempts: 0,
                lockedUntil: null,
              },
            },
          );

        const updatedOwner =
          await transaction.adminUser.update({
            where: {
              id: owner.id,
            },

            data: {
              passwordHash,

              sessionVersion:
                updatedCredential.sessionVersion,

              passwordChangedAt:
                new Date(),

              failedAttempts: 0,
              lockedUntil: null,
              mustChangePassword: false,
            },
          });

        return {
          updatedCredential,
          updatedOwner,
        };
      },
    );

  return {
    success: true as const,
    message:
      "Admin password changed successfully.",

    sessionVersion:
      result.updatedCredential
        .sessionVersion,

    userId:
      result.updatedOwner.id,
  };
}

export async function getAdminSecurityState() {
  const session =
    await getAdminSession();

  if (
    session?.source === "user"
  ) {
    const user =
      await prisma.adminUser.findUnique({
        where: {
          id: session.userId,
        },

        select: {
          lastLoginAt: true,
          passwordChangedAt: true,
        },
      });

    if (user) {
      return {
        lastLoginAt:
          user.lastLoginAt,

        passwordChangedAt:
          user.passwordChangedAt,
      };
    }
  }

  const credential =
    await ensureAdminCredential();

  return {
    lastLoginAt:
      credential.lastLoginAt,

    passwordChangedAt:
      credential.passwordChangedAt,
  };
}

export const adminSession = {
  cookieName: ADMIN_COOKIE_NAME,

  durationSeconds:
    SESSION_DURATION_SECONDS,
} as const;
