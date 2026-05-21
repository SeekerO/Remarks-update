// src/app/api/admin/set-role/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/firebaseAdmin";

export async function POST(req: NextRequest) {
  // Only admins can set roles

  const { targetUid, isAdmin } = await req.json();

  if (!targetUid || typeof isAdmin !== "boolean") {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }

  // Prevent self-demotion
  if (targetUid && !isAdmin) {
    return NextResponse.json(
      { error: "Cannot remove your own admin role." },
      { status: 400 },
    );
  }

  await adminAuth.setCustomUserClaims(targetUid, { isAdmin });

  return NextResponse.json({ success: true });
}
