// src/app/api/auth/session/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      // ✅ "strict" ensures cookie is always sent on same-origin requests.
      // "lax" can drop the cookie on same-origin fetch() calls in some
      // Next.js/browser combinations, causing 401s immediately after refresh.
      sameSite: "strict",
      // ✅ 55 minutes — slightly less than Firebase token lifetime (60 min)
      // so apiFetch always refreshes before expiry rather than right at it.
      maxAge: 55 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });

  response.cookies.set("auth-token", "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "strict",
  });

  return response;
}