import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Your session has expired.",
        },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: session.userId,
          name: session.name,
          email: session.email,
          role: session.role,
          permissions: session.permissions,
          mustChangePassword:
            session.mustChangePassword,
        },
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error(
      "Unable to load admin session:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load the administrator profile.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}