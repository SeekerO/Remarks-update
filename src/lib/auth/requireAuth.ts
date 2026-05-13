// src/lib/auth/requireAuth.ts
// Drop-in auth guard for every API route handler.
// Usage:
//   const user = await requireAuth();           // throws on failure
//   const user = await requireAuth(true);       // also requires isAdmin

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/firebaseAdmin";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export interface AuthUser {
  uid: string;
  email: string | undefined;
  isAdmin: boolean;
}

/**
 * Verifies the session cookie and returns the decoded user.
 * Throws AuthError if unauthenticated or (optionally) not admin.
 *
 * @param requireAdmin — if true, also throws 403 for non-admins
 */
export async function requireAuth(requireAdmin = false): Promise<AuthUser> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    throw new AuthError("Unauthenticated: no session cookie.", 401);
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token, true); // true = check revocation
  } catch (err: any) {
    throw new AuthError(`Unauthenticated: ${err.message}`, 401);
  }

  // Read isAdmin from the custom claim stored in Firebase Auth
  // (falls back to false if not set)
  const isAdmin = decoded.isAdmin === true;

  if (requireAdmin && !isAdmin) {
    throw new AuthError("Forbidden: admin only.", 403);
  }

  return {
    uid: decoded.uid,
    email: decoded.email,
    isAdmin,
  };
}

/**
 * Wraps AuthError into a NextResponse so route handlers
 * can return early cleanly.
 *
 * Usage inside a handler:
 *   const [user, errResponse] = await tryAuth();
 *   if (errResponse) return errResponse;
 */
export async function tryAuth(
  requireAdmin = false
): Promise<[AuthUser, null] | [null, NextResponse]> {
  try {
    const user = await requireAuth(requireAdmin);
    return [user, null];
  } catch (err: any) {
    const status = err instanceof AuthError ? err.status : 401;
    return [
      null,
      NextResponse.json({ error: err.message }, { status }),
    ];
  }
}


// New File