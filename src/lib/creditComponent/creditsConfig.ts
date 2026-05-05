// src/lib/credits/creditsConfig.ts
// Central registry of all tools that consume credits.
// toolId must be unique and stable — it's used as the Firebase key.
//
// Firebase path: user_credits/{uid}/{toolId}

export interface ToolCreditConfig {
  toolId: string;
  label: string;
  icon: string;
  defaultFreeCredits: number; // how many credits new/unset users get
  urlPath: string; // used to match current route
}

// 11 Tools
export const TOOL_CREDIT_CONFIGS: ToolCreditConfig[] = [
  {
    toolId: "watermark",
    label: "Watermark Editor",
    icon: "💧",
    defaultFreeCredits: 10,
    urlPath: "/edit/watermark",
  },
  {
    toolId: "bgremover",
    label: "Background Remover",
    icon: "✂️",
    defaultFreeCredits: 10,
    urlPath: "/edit/bgremover",
  },
  {
    toolId: "logoeditor",
    label: "Logo Editor",
    icon: "🔷",
    defaultFreeCredits: 10,
    urlPath: "/edit/logoeditor",
  },
  {
    toolId: "resadjuster",
    label: "Resolution Adjuster",
    icon: "📐",
    defaultFreeCredits: 10,
    urlPath: "/edit/resadjuster",
  },
  {
    toolId: "pdfconverter",
    label: "PDF Converter",
    icon: "🔄",
    defaultFreeCredits: 10,
    urlPath: "/document/pdfconverter",
  },
  {
    toolId: "pdf",
    label: "PDF Editor",
    icon: "📄",
    defaultFreeCredits: 10,
    urlPath: "/document/pdf",
  },
  {
    toolId: "dtrextractor",
    label: "DTR Extractor",
    icon: "📊",
    defaultFreeCredits: 10,
    urlPath: "/dtrextractor",
  },
  {
    toolId: "matcher",
    label: "Data Matcher",
    icon: "🔍",
    defaultFreeCredits: 10,
    urlPath: "/matcher",
  },
];

// Shape stored in Firebase under user_credits/{uid}/{toolId}
export interface ToolCreditEntry {
  remaining: number;
  total: number; // the cap set by admin (or default)
  unlimited: boolean; // admin can flip this per tool
}

// Full credits object for a user
export type UserToolCredits = Record<string, ToolCreditEntry>;

export function getDefaultEntry(config: ToolCreditConfig): ToolCreditEntry {
  return {
    remaining: config.defaultFreeCredits,
    total: config.defaultFreeCredits,
    unlimited: false,
  };
}

// ── Firebase path helpers ─────────────────────────────────────────────────────
// All credit reads/writes must go through these helpers so the path is
// consistent across the entire codebase.

/**
 * Path to a single tool's credit entry for a user.
 * user_credits/{uid}/{toolId}
 */
export function creditPath(uid: string, toolId: string): string {
  return `users/${uid}/toolCredits/${toolId}`;
}

/**
 * Path to all tool credits for a user.
 * user_credits/{uid}
 */
export function userCreditsPath(uid: string): string {
  return `users/${uid}/toolCredits`;
}
