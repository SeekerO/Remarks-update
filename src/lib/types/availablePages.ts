// src/lib/data/availablePages.ts

// --- Type Definitions ---\r\n
export const AVAILABLE_PAGES = [
  { id: "watermark", name: "Watermark V4", category: "Edit" },
  { id: "bgremover", name: "BG Remover", category: "Edit" },
  { id: "logomaker", name: "Logo Maker", category: "Edit" },
  { id: "faq", name: "FAQ", category: "Notes" },
  { id: "remarks", name: "Remarks", category: "Notes" },
  { id: "pdf", name: "PDF", category: "Notes" },
  { id: "matcher", name: "Matcher", category: "Main" },
  { id: "evaluation", name: "Evaluation", category: "Main" },
] as const;

// Export the types as well for external consumption
export type PageId = (typeof AVAILABLE_PAGES)[number]["id"];

// Note: Do NOT include 'use client'; in this file.
