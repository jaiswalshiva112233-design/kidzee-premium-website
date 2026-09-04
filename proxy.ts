import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  adminSession,
  getAdminSessionClaimsFromToken,
} from "@/lib/admin/auth";
import {
  getAdminApiPermission,
  getAdminPagePermission,
  hasAdminPermissionRequirement,
} from "@/lib/admin/permissions";

const publicApiPaths = new Set([
  "/api/admin/login",
  "/api/admin/logout",
  "/api/admin/session",
]);


function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL(
    "/admin/login",
    request.url,
  );

  const requestedPath = [
    request.nextUrl.pathname,
    request.nextUrl.search,
  ].join("");

  loginUrl.searchParams.set(
    "next",
    requestedPath,
  );

  const response =
    NextResponse.redirect(loginUrl);

  response.cookies.delete(
    adminSession.cookieName,
  );

  return response;
}

function apiErrorResponse(
  message: string,
  status: 401 | 403,
  clearSession = false,
) {
  const response = NextResponse.json(
    {
      success: false,
      message,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );

  if (clearSession) {
    response.cookies.delete(
      adminSession.cookieName,
    );
  }

  return response;
}

export function proxy(
  request: NextRequest,
) {
  const pathname = request.nextUrl.pathname;
  const isAdminApi = pathname.startsWith("/api/admin");

  if (
    isAdminApi &&
    (publicApiPaths.has(pathname) ||
      (pathname === "/api/admin/marketing/snapshot" &&
        Boolean(request.headers.get("authorization")?.startsWith("Bearer "))))
  ) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get(adminSession.cookieName)?.value;

  // Proxy performs only an optimistic, signed-cookie check. Database-backed
  // session validation still happens inside the destination page or route.
  // This keeps Prisma/Accelerate out of the request preflight and avoids a
  // duplicate AdminUser lookup for every authenticated request.
  const session =
    getAdminSessionClaimsFromToken(
      sessionToken,
    );

  if (pathname === "/admin/login") {
    if (session) {
      return NextResponse.redirect(
        new URL("/admin", request.url),
      );
    }

    return NextResponse.next();
  }

  if (!session) {
    if (isAdminApi) {
      return apiErrorResponse(
        "Your session has expired. Please sign in again.",
        401,
        true,
      );
    }

    return redirectToLogin(request);
  }

  if (
    session.mustChangePassword &&
    !pathname.startsWith(
      "/admin/settings/security",
    )
  ) {
    if (isAdminApi) {
      return apiErrorResponse(
        "Please change your temporary password before continuing.",
        403,
      );
    }

    return NextResponse.redirect(
      new URL(
        "/admin/settings/security?passwordChange=required",
        request.url,
      ),
    );
  }

  const requiredPermission = isAdminApi
    ? getAdminApiPermission(pathname)
    : getAdminPagePermission(pathname);

  if (
    !hasAdminPermissionRequirement(
      session,
      requiredPermission,
    )
  ) {
    if (isAdminApi) {
      return apiErrorResponse(
        "You do not have permission to perform this action.",
        403,
      );
    }

    const deniedUrl = new URL(
      "/admin",
      request.url,
    );

    deniedUrl.searchParams.set(
      "access",
      "denied",
    );

    return NextResponse.redirect(
      deniedUrl,
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
