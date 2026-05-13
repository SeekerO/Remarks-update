// src/lib/firebase/firebaseAdmin.ts
// Server-side only — never import this in client components

import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getAdminApp(): App {
  // Prevent re-initializing on hot reload in development
  if (getApps().length > 0) return getApps()[0];

  return initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_CHAT,
      clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      // The private key comes escaped from .env — unescape the newlines
      privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const adminAuth = getAuth(getAdminApp());