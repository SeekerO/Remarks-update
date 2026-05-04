"use client";

import { useState, useEffect } from "react";
import {
  X,
  Zap,
  Sparkles,
  RotateCcw,
  Save,
  Infinity,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { ref, get, set } from "firebase/database";
import { db } from "@/lib/firebase/firebase";
import {
  TOOL_CREDIT_CONFIGS,
  ToolCreditEntry,
  UserToolCredits,
  getDefaultEntry,
} from "./creditsConfig";
import { UserProfile } from "@/lib/types/adminTypes";

// ── Types ─────────────────────────────────────────────────────────────────────

type DraftCredits = Record<
  string,
  { remaining: number; total: number; unlimited: boolean }
>;

interface CreditsModalProps {
  user: UserProfile;
  onClose: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function pct(remaining: number, total: number) {
  if (total === 0) return 0;
  return Math.max(0, Math.min(100, (remaining / total) * 100));
}

function barColor(p: number) {
  if (p <= 0) return "from-red-500 to-rose-600";
  if (p <= 30) return "from-amber-400 to-orange-500";
  return "from-indigo-500 to-violet-500";
}

// ── ToolCreditRow ─────────────────────────────────────────────────────────────

function ToolCreditRow({
  toolId,
  entry,
  onChange,
  isExpanded,
  onToggle,
}: {
  toolId: string;
  entry: { remaining: number; total: number; unlimited: boolean };
  onChange: (next: { remaining: number; total: number; unlimited: boolean }) => void;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const config = TOOL_CREDIT_CONFIGS.find((t: any) => t.toolId === toolId);
  const p = entry.unlimited ? 100 : pct(entry.remaining, entry.total);
  const isEmpty = !entry.unlimited && entry.remaining <= 0;
  const isLow = !entry.unlimited && !isEmpty && pct(entry.remaining, entry.total) <= 30;

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        isExpanded
          ? "border-indigo-500/30 bg-indigo-500/5"
          : "border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-white/[0.02]"
      }`}
    >
      {/* Row header — click to expand */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        {/* Tool icon */}
        <span className="text-xl flex-shrink-0 w-7 text-center">
          {config?.icon ?? "🔧"}
        </span>

        {/* Label + bar */}
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-xs font-semibold text-gray-700 dark:text-white/75 truncate">
            {config?.label ?? toolId}
          </p>
          {entry.unlimited ? (
            <div className="flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-medium">Unlimited</span>
            </div>
          ) : (
            <div className="space-y-0.5">
              <div className="h-1.5 w-full rounded-full bg-black/[0.05] dark:bg-white/[0.06] overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${barColor(p)}`}
                  style={{ width: `${p}%` }}
                />
              </div>
              <p
                className={`text-[10px] font-medium ${
                  isEmpty
                    ? "text-red-400"
                    : isLow
                    ? "text-amber-400"
                    : "text-white/30"
                }`}
              >
                {entry.remaining}/{entry.total} credits remaining
              </p>
            </div>
          )}
        </div>

        {/* Status badge */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {isEmpty && (
            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
              Empty
            </span>
          )}
          {isLow && !isEmpty && (
            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Low
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-white/20" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-white/20" />
          )}
        </div>
      </button>

      {/* Expanded edit controls */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-indigo-500/10">
          {/* Unlimited toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Infinity className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-xs text-gray-500 dark:text-white/50">Unlimited credits</span>
            </div>
            <button
              onClick={() => onChange({ ...entry, unlimited: !entry.unlimited })}
              className={`w-10 h-5 rounded-full relative transition-colors ${
                entry.unlimited ? "bg-sky-500" : "bg-gray-300 dark:bg-white/10"
              }`}
            >
              <div
                className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
                  entry.unlimited ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          {!entry.unlimited && (
            <div className="grid grid-cols-2 gap-3">
              {/* Remaining */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/25">
                  Remaining
                </label>
                <input
                  type="number"
                  min={0}
                  max={entry.total}
                  value={entry.remaining}
                  onChange={(e) => {
                    const v = Math.min(entry.total, Math.max(0, parseInt(e.target.value) || 0));
                    onChange({ ...entry, remaining: v });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-black/[0.08] dark:border-white/[0.08]
                    bg-transparent text-xs text-gray-700 dark:text-white/70 outline-none
                    focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Total cap */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/25">
                  Total Cap
                </label>
                <input
                  type="number"
                  min={1}
                  value={entry.total}
                  onChange={(e) => {
                    const v = Math.max(1, parseInt(e.target.value) || 1);
                    onChange({ ...entry, total: v, remaining: Math.min(entry.remaining, v) });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-black/[0.08] dark:border-white/[0.08]
                    bg-transparent text-xs text-gray-700 dark:text-white/70 outline-none
                    focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          )}

          {/* Quick refill */}
          {!entry.unlimited && (
            <button
              onClick={() => onChange({ ...entry, remaining: entry.total })}
              className="flex items-center gap-1.5 text-[10px] font-semibold text-indigo-400
                hover:text-indigo-300 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Refill to cap ({entry.total})
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── CreditsModal ──────────────────────────────────────────────────────────────

export default function CreditsModal({ user, onClose }: CreditsModalProps) {
  const [draft, setDraft] = useState<DraftCredits>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  // Load current credits from Firebase
  useEffect(() => {
    async function load() {
      setLoading(true);
      const snap = await get(ref(db, `users/${user.uid}/toolCredits`));
      const existing: UserToolCredits = snap.exists() ? snap.val() : {};

      // Merge with defaults for any missing tools
      const merged: DraftCredits = {};
      for (const config of TOOL_CREDIT_CONFIGS) {
        merged[config.toolId] = existing[config.toolId] ?? getDefaultEntry(config);
      }
      setDraft(merged);
      setLoading(false);
    }
    load();
  }, [user.uid]);

  const handleChange = (
    toolId: string,
    next: { remaining: number; total: number; unlimited: boolean }
  ) => {
    setDraft((prev) => ({ ...prev, [toolId]: next }));
  };

  const handleRefillAll = () => {
    setDraft((prev) => {
      const next = { ...prev };
      for (const toolId of Object.keys(next)) {
        if (!next[toolId].unlimited) {
          next[toolId] = { ...next[toolId], remaining: next[toolId].total };
        }
      }
      return next;
    });
  };

  const handleUnlimitedAll = () => {
    setDraft((prev) => {
      const next = { ...prev };
      for (const toolId of Object.keys(next)) {
        next[toolId] = { ...next[toolId], unlimited: true };
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaveError(null);
    setSaving(true);
    try {
      await set(ref(db, `users/${user.uid}/toolCredits`), draft);
      onClose();
    } catch {
      setSaveError("Failed to save credits. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Summary counts
  const emptyCount = Object.values(draft).filter(
    (e) => !e.unlimited && e.remaining <= 0
  ).length;
  const unlimitedCount = Object.values(draft).filter((e) => e.unlimited).length;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-md bg-white dark:bg-[#0d0d1a] border border-black/[0.08]
        dark:border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[88vh]"
      >
        {/* Accent bar */}
        <div className="h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.06] flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-white/85">
              Tool Credits
            </p>
            <p className="text-[11px] text-gray-400 dark:text-white/30 truncate mt-0.5">
              {user.displayName} ·{" "}
              {unlimitedCount > 0 && (
                <span className="text-emerald-400">{unlimitedCount} unlimited</span>
              )}
              {unlimitedCount > 0 && emptyCount > 0 && " · "}
              {emptyCount > 0 && (
                <span className="text-red-400">{emptyCount} empty</span>
              )}
              {unlimitedCount === 0 && emptyCount === 0 && (
                <span>{TOOL_CREDIT_CONFIGS.length} tools</span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 dark:text-white/30
              hover:text-gray-600 dark:hover:text-white/70 hover:bg-gray-100
              dark:hover:bg-white/[0.06] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 px-5 pt-4 pb-2 flex-shrink-0">
          <button
            onClick={handleRefillAll}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20
              text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/15
              transition-all disabled:opacity-40"
          >
            <RotateCcw className="w-3 h-3" /> Refill All
          </button>
          <button
            onClick={handleUnlimitedAll}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20
              text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/15
              transition-all disabled:opacity-40"
          >
            <Sparkles className="w-3 h-3" /> Unlimited All
          </button>
        </div>

        {/* Tool list */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            </div>
          ) : (
            TOOL_CREDIT_CONFIGS.map((config: any) => (
              <ToolCreditRow
                key={config.toolId}
                toolId={config.toolId}
                entry={draft[config.toolId] ?? getDefaultEntry(config)}
                onChange={(next) => handleChange(config.toolId, next)}
                isExpanded={expandedTool === config.toolId}
                onToggle={() =>
                  setExpandedTool((prev) =>
                    prev === config.toolId ? null : config.toolId
                  )
                }
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-black/[0.06] dark:border-white/[0.06] flex-shrink-0">
          {saveError && (
            <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <p className="text-[10px] text-red-400">{saveError}</p>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08]
                text-gray-600 dark:text-white/50 text-sm hover:bg-gray-50 dark:hover:bg-white/[0.04]
                disabled:opacity-40 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white
                text-sm font-semibold disabled:opacity-40 transition-all
                flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Credits
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}