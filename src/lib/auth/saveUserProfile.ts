// saveUserProfile.ts
import { ref, get, update, set } from "firebase/database";
import { db } from "@/lib/firebase/firebase";
import { TOOL_CREDIT_CONFIGS, getDefaultEntry } from "@/lib/creditComponent/creditsConfig";

// Default pages all new users get access to
export const DEFAULT_ALLOWED_PAGES = [
  "dashboard",
  "watermark",
  "bgremover",
  "logoeditor",
  "resadjuster",
  "pdfconverter",
  "dtrextractor",
  "pdf",
  "remarks",
  "faq",
  "matcher",
  "message",
];

// Build default credits object for all tools
function buildDefaultCredits() {
  const credits: Record<string, any> = {};
  for (const config of TOOL_CREDIT_CONFIGS) {
    credits[config.toolId] = getDefaultEntry(config);
  }
  return credits;
}

// Check if daily credits should be refilled
function shouldRefillCredits(lastRefill: string | null): boolean {
  if (!lastRefill) return true;
  const last = new Date(lastRefill);
  const now = new Date();
  return (
    last.getFullYear() !== now.getFullYear() ||
    last.getMonth() !== now.getMonth() ||
    last.getDate() !== now.getDate()
  );
}

export const saveUserProfile = async (user: any) => {
  const userRef = ref(db, `users/${user.uid}`);
  const snapshot = await get(userRef);

  const userData = {
    displayName: user.displayName,
    email: user.email,
    lastLogin: new Date().toISOString(),
    photoURL: user.photoURL ?? null,
  };

  if (snapshot.exists()) {
    const existingData = snapshot.val();

    // Handle daily credit refill
    const lastRefill = existingData.lastCreditRefill ?? null;
    const creditsUpdate: Record<string, any> = {};

    if (shouldRefillCredits(lastRefill)) {
      // Refill all limited (non-unlimited) tool credits back to their cap
      const existingCredits = existingData.toolCredits ?? {};
      for (const config of TOOL_CREDIT_CONFIGS) {
        const existing = existingCredits[config.toolId];
        if (existing && existing.unlimited) {
          // Keep unlimited as-is
          creditsUpdate[`toolCredits/${config.toolId}`] = existing;
        } else {
          // Refill to total cap (or default if not set)
          const total = existing?.total ?? config.defaultFreeCredits;
          creditsUpdate[`toolCredits/${config.toolId}`] = {
            remaining: total,
            total,
            unlimited: false,
          };
        }
      }
      creditsUpdate.lastCreditRefill = new Date().toISOString();
    }

    await update(userRef, {
      ...userData,
      isAdmin: existingData.isAdmin ?? false,
      // Default isPermitted to TRUE for existing users who don't have it set
      isPermitted: existingData.isPermitted !== undefined ? existingData.isPermitted : true,
      allowCalls: existingData.allowCalls ?? true,
      // Default allowed pages to ALL pages if not set
      allowedPages: existingData.allowedPages ?? DEFAULT_ALLOWED_PAGES,
      // No roles system needed
      ...creditsUpdate,
    });
  } else {
    // New user — grant full default access immediately
    const defaultCredits = buildDefaultCredits();

    await set(userRef, {
      ...userData,
      isAdmin: false,
      isPermitted: true, // Default TRUE — no approval needed
      allowCalls: true,
      allowedPages: DEFAULT_ALLOWED_PAGES, // All pages by default
      notes: "", // Admin notes field
      toolCredits: defaultCredits,
      lastCreditRefill: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
  }
};