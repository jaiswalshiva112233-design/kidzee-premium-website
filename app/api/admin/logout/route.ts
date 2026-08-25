import { NextResponse } from "next/server";

import { adminSession } from "@/lib/admin/auth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(
    new URL("/admin/login", request.url),
    {
      status: 303,
    },
  );

  response.cookies.set({
    name: adminSession.cookieName,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return response;
}