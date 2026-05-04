// src/lib/credits/creditsConfig.ts
// Central registry of all tools that consume credits.
// toolId must be unique and stable — it's used as the Firebase key.

export interface ToolCreditConfig {
  toolId: string;
  label: string;
  icon: string;
  defaultFreeCredits: number; // how many credits new/unset users get
  urlPath: string; // used to match current route
}

export const TOOL_CREDIT_CONFIGS: ToolCreditConfig[] = [
  {
    toolId: "watermark",
    label: "Watermark Editor",
    icon: "💧",
    defaultFreeCredits: 10,
    urlPath: "/edit/watermark",
  },
  {
    toolId: "bg_remover",
    label: "Background Remover",
    icon: "✂️",
    defaultFreeCredits: 10,
    urlPath: "/edit/bgremover",
  },
  {
    toolId: "logo_maker",
    label: "Logo Maker",
    icon: "🔷",
    defaultFreeCredits: 10,
    urlPath: "/edit/logoeditor",
  },
  {
    toolId: "res_adjuster",
    label: "Resolution Adjuster",
    icon: "📐",
    defaultFreeCredits: 10,
    urlPath: "/edit/resadjuster",
  },
  {
    toolId: "file_converter",
    label: "File Converter",
    icon: "📄",
    defaultFreeCredits: 10,
    urlPath: "/document/pdf",
  },
  {
    toolId: "matcher",
    label: "Data Matcher",
    icon: "🔍",
    defaultFreeCredits: 10,
    urlPath: "/Matcher",
  },
  {
    toolId: "dtr_extractor",
    label: "DTR Extractor",
    icon: "📊",
    defaultFreeCredits: 10,
    urlPath: "/dtrextractor",
  },
  {
    toolId: "faq",
    label: "FAQ Tool",
    icon: "📋",
    defaultFreeCredits: 10,
    urlPath: "/document/faq",
  },
];

// Shape stored in Firebase under users/{uid}/toolCredits/{toolId}
export interface ToolCreditEntry {
  remaining: number;
  total: number; // the cap set by admin (or default)
  unlimited: boolean; // admin can flip this per tool
}

// Full credits object stored in Firebase
export type UserToolCredits = Record<string, ToolCreditEntry>;

export function getDefaultEntry(config: ToolCreditConfig): ToolCreditEntry {
  return {
    remaining: config.defaultFreeCredits,
    total: config.defaultFreeCredits,
    unlimited: false,
  };
}
