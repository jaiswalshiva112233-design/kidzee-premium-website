import { NextResponse } from "next/server";

import {
  adminSession,
  createAdminSessionToken,
  verifyAdminLogin,
} from "@/lib/admin/auth";
import { firebaseAuthEnabled, verifyFirebasePassword } from "@/lib/firebase/authRest";
import { prisma } from "@/lib/prisma";

type LoginRequestBody = {
  email?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  try {
    let body: LoginRequestBody;

    try {
      body = (await request.json()) as LoginRequestBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid login request.",
        },
        {
          status: 400,
        },
      );
    }

    const email =
      typeof body.email === "string"
        ? body.email.trim()
        : "";

    if (
      typeof body.password !== "string" ||
      body.password.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter your password.",
        },
        {
          status: 400,
        },
      );
    }

    if (email.length > 254) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid email address.",
        },
        {
          status: 400,
        },
      );
    }

    if (body.password.length > 256) {
      return NextResponse.json(
        {
          success: false,
          message: "The password is too long.",
        },
        {
          status: 400,
        },
      );
    }

    if (firebaseAuthEnabled()) {
      if (!email) {
        return NextResponse.json({ success: false, message: "Please enter your email address." }, { status: 400 });
      }
      const identity = await verifyFirebasePassword(email, body.password);
      if (!identity) {
        return NextResponse.json({ success: false, message: "Incorrect email or password." }, { status: 401 });
      }
      const user = await prisma.adminUser.findUnique({ where: { email: identity.email } });
      if (!user?.active) {
        return NextResponse.json({ success: false, message: "This account is not authorised for CentreOS." }, { status: 403 });
      }
      await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date(), failedAttempts: 0, lockedUntil: null } });
      const sessionToken = await createAdminSessionToken(user.sessionVersion, user.id);
      const response = NextResponse.json({
        success: true,
        message: "Login successful.",
        redirectTo: user.mustChangePassword ? "/admin/settings/security?passwordChange=required" : "/admin",
        user: { name: user.name, email: user.email, role: user.role, mustChangePassword: user.mustChangePassword },
      });
      response.cookies.set({ name: adminSession.cookieName, value: sessionToken, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: adminSession.durationSeconds });
      return response;
    }

    const verification = await verifyAdminLogin(
      email,
      body.password,
    );

    if (!verification.valid || !verification.userId) {
      const accountIsInactive =
        Boolean(verification.userId) &&
        !verification.active;

      return NextResponse.json(
        {
          success: false,
          message: verification.lockedUntil
            ? "Too many incorrect attempts. Login is locked for 15 minutes."
            : accountIsInactive
              ? "This account has been deactivated. Please contact the owner."
              : email
                ? "Incorrect email or password."
                : "Incorrect password.",

          lockedUntil: verification.lockedUntil,
        },
        {
          status: verification.lockedUntil
            ? 429
            : accountIsInactive
              ? 403
              : 401,
        },
      );
    }

    const sessionToken = await createAdminSessionToken(
      verification.sessionVersion,
      verification.userId,
    );

    const redirectTo = verification.mustChangePassword
      ? "/admin/settings/security?passwordChange=required"
      : "/admin";

    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
      redirectTo,
      user: {
        name: verification.name,
        email: verification.email,
        role: verification.role,
        mustChangePassword:
          verification.mustChangePassword,
      },
    });

    response.cookies.set({
      name: adminSession.cookieName,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: adminSession.durationSeconds,
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to sign in right now. Please try again. If the problem continues, contact the Owner.",
      },
      {
        status: 500,
      },
    );
  }
}
