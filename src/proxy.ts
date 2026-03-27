import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth/session"];

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
    if (isPublic) return NextResponse.next();

    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Basic check — token exists, allow through
    // Firebase Admin JWT verification is optional (see Step 3)
    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|Avexi.ico|.*\\.png$|.*\\.svg$|.*\\.jpg$).*)",
    ],
};