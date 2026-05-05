// src/app/admin/panel/creditComponent/CreditsManager.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "@/lib/firebase/firebase";
import {
  TOOL_CREDIT_CONFIGS,
  ToolCreditEntry,
  UserToolCredits,
  getDefaultEntry,
  userCreditsPath,
  creditPath,
} from "./creditsConfig";
import {
  Zap, X, Infinity, RotateCcw, Sparkles, Check, Coins,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Mini credit row inside the modal ────────────────────────────────────────

interface ToolCreditRowProps {
  config: (typeof TOOL_CREDIT_CONFIGS)[number];
  entry: ToolCreditEntry;
  onUpdate: (toolId: string, entry: ToolCreditEntry) => void;
}

function ToolCreditRow({ config, entry, onUpdate }: ToolCreditRowProps) {
  const pct =
    entry.unlimited || entry.total === 0
      ? 100
      : Math.max(0, Math.min(100, (entry.remaining / entry.total) * 100));

  const isLow = !entry.unlimited && entry.remaining <= 2 && entry.remaining > 0;
  const isEmpty = !entry.unlimited && entry.remaining <= 0;

  const accentColor = entry.unlimited
    ? "#34d399"
    : isEmpty
      ? "#f87171"
      : isLow
        ? "#fbbf24"
        : "#818cf8";

  return (
    <div
      className="rounded-xl p-3 space-y-2.5"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base leading-none">{config.icon}</span>
          <span className="text-xs font-semibold text-white/70 truncate">{config.label}</span>
        </div>

        {/* Unlimited toggle */}
        <button
          onClick={() => onUpdate(config.toolId, { ...entry, unlimited: !entry.unlimited })}
          title={entry.unlimited ? "Switch to limited" : "Set unlimited"}
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all"
          style={{
            background: entry.unlimited ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${entry.unlimited ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.08)"}`,
            color: entry.unlimited ? "#34d399" : "rgba(255,255,255,0.3)",
          }}
        >
          <Infinity className="w-2.5 h-2.5" />
          {entry.unlimited ? "Unlimited" : "Limited"}
        </button>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="h-1 w-full rounded-full overflow-hidden bg-white/[0.06]">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${pct}%`,
              background: entry.unlimited
                ? "linear-gradient(90deg, #34d399, #10b981)"
                : isEmpty
                  ? "#ef4444"
                  : isLow
                    ? "#f59e0b"
                    : "linear-gradient(90deg, #6366f1, #8b5cf6)",
            }}
          />
        </div>
        {!entry.unlimited && (
          <div className="flex items-center justify-between">
            <span className="text-[10px]" style={{ color: accentColor }}>
              {entry.remaining} remaining
            </span>
            <span className="text-[10px] text-white/20">of {entry.total}</span>
          </div>
        )}
      </div>

      {/* Controls — only when not unlimited */}
      {!entry.unlimited && (
        <div className="flex items-center gap-2">
          <div className="flex-1 space-y-0.5">
            <label className="text-[9px] uppercase tracking-widest text-white/25 font-bold">
              Remaining
            </label>
            <input
              type="number"
              min={0}
              max={9999}
              value={entry.remaining}
              onChange={(e) =>
                onUpdate(config.toolId, {
                  ...entry,
                  remaining: Math.max(0, parseInt(e.target.value) || 0),
                })
              }
              className="w-full px-2 py-1.5 rounded-lg text-xs font-mono text-white/80 focus:outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
          </div>
          <div className="flex-1 space-y-0.5">
            <label className="text-[9px] uppercase tracking-widest text-white/25 font-bold">
              Total Cap
            </label>
            <input
              type="number"
              min={1}
              max={9999}
              value={entry.total}
              onChange={(e) =>
                onUpdate(config.toolId, {
                  ...entry,
                  total: Math.max(1, parseInt(e.target.value) || 1),
                })
              }
              className="w-full px-2 py-1.5 rounded-lg text-xs font-mono text-white/80 focus:outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
          </div>
          <button
            onClick={() => onUpdate(config.toolId, getDefaultEntry(config))}
            title="Reset to default"
            className="mt-4 p-1.5 rounded-lg text-white/25 hover:text-amber-400 transition-colors"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Credits Modal ────────────────────────────────────────────────────────────

interface CreditsModalProps {
  uid: string;
  displayName: string;
  onClose: () => void;
}

export function CreditsModal({ uid, displayName, onClose }: CreditsModalProps) {
  const [entries, setEntries] = useState<UserToolCredits>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load live from Firebase — NEW PATH: user_credits/{uid}
  useEffect(() => {
    const r = ref(db, userCreditsPath(uid));
    const unsub = onValue(r, (snap) => {
      const stored: UserToolCredits = snap.exists() ? snap.val() : {};
      const merged: UserToolCredits = {};
      for (const config of TOOL_CREDIT_CONFIGS) {
        merged[config.toolId] = stored[config.toolId] ?? getDefaultEntry(config);
      }
      setEntries(merged);
      setLoading(false);
    });
    return () => unsub();
  }, [uid]);

  const handleUpdate = useCallback((toolId: string, entry: ToolCreditEntry) => {
    setEntries((prev) => ({ ...prev, [toolId]: entry }));
  }, []);

  const handleSetAllUnlimited = () => {
    setEntries((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) next[k] = { ...next[k], unlimited: true };
      return next;
    });
  };

  const handleResetAll = () => {
    const reset: UserToolCredits = {};
    for (const config of TOOL_CREDIT_CONFIGS) {
      reset[config.toolId] = getDefaultEntry(config);
    }
    setEntries(reset);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // ── NEW PATH: user_credits/{uid} ──
      await set(ref(db, userCreditsPath(uid)), entries);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Failed to save credits:", err);
    } finally {
      setSaving(false);
    }
  };

  const hasUnlimited = Object.values(entries).some((e) => e.unlimited);
  const allUnlimited = Object.values(entries).every((e) => e.unlimited);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
        className="relative w-full max-w-md flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: "linear-gradient(145deg, #0d0d1a 0%, #0f0f20 100%)",
          border: "1px solid rgba(99,102,241,0.15)",
          maxHeight: "90vh",
        }}
      >
        <div
          className="h-[2px] w-full flex-shrink-0"
          style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)" }}
        />

        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}
          >
            <Coins className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white/90">Credit Manager</p>
            <p className="text-[11px] text-white/30 truncate">
              {displayName} ·{" "}
              {hasUnlimited
                ? "Some unlimited"
                : `${Object.values(entries).reduce((s, e) => s + e.remaining, 0)} total remaining`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick actions */}
        <div
          className="flex gap-2 px-5 py-3 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
        >
          <button
            onClick={handleSetAllUnlimited}
            disabled={allUnlimited}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-40"
            style={{
              background: "rgba(52,211,153,0.1)",
              border: "1px solid rgba(52,211,153,0.2)",
              color: "#34d399",
            }}
          >
            <Sparkles className="w-3 h-3" />
            All Unlimited
          </button>
          <button
            onClick={handleResetAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            <RotateCcw className="w-3 h-3" />
            Reset All
          </button>
        </div>

        {/* Tool list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            TOOL_CREDIT_CONFIGS.map((config) => (
              <ToolCreditRow
                key={config.toolId}
                config={config}
                entry={entries[config.toolId] ?? getDefaultEntry(config)}
                onUpdate={handleUpdate}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div
          className="flex gap-3 px-5 py-4 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all disabled:opacity-30"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            style={{
              background: saved ? "rgba(52,211,153,0.2)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: saved ? "1px solid rgba(52,211,153,0.3)" : "none",
              boxShadow: saved ? "none" : "0 4px 20px rgba(99,102,241,0.3)",
            }}
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : saved ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Saved</span>
              </>
            ) : (
              "Save Credits"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Inline UserCard button + live badge ─────────────────────────────────────

interface CreditsManagerButtonProps {
  uid: string;
  displayName: string;
}

export function CreditsManagerButton({ uid, displayName }: CreditsManagerButtonProps) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<{
    totalRemaining: number;
    hasUnlimited: boolean;
    allUnlimited: boolean;
  } | null>(null);

  useEffect(() => {
    // ── NEW PATH: user_credits/{uid} ──
    const r = ref(db, userCreditsPath(uid));
    const unsub = onValue(r, (snap) => {
      if (!snap.exists()) {
        setSummary({ totalRemaining: 0, hasUnlimited: false, allUnlimited: false });
        return;
      }
      const data: UserToolCredits = snap.val();
      const vals = Object.values(data);
      setSummary({
        totalRemaining: vals.reduce((s, e) => s + (e.unlimited ? 0 : e.remaining), 0),
        hasUnlimited: vals.some((e) => e.unlimited),
        allUnlimited: vals.every((e) => e.unlimited),
      });
    });
    return () => unsub();
  }, [uid]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Manage credits"
        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all"
        style={{
          background: "rgba(99,102,241,0.07)",
          border: "1px solid rgba(99,102,241,0.18)",
          color: "#a5b4fc",
        }}
      >
        <Coins className="w-3 h-3" />
        Credits
        {summary && (
          <span
            className="ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
            style={{
              background: summary.allUnlimited ? "rgba(52,211,153,0.15)" : "rgba(99,102,241,0.15)",
              color: summary.allUnlimited ? "#34d399" : "#818cf8",
            }}
          >
            {summary.allUnlimited
              ? "∞"
              : summary.hasUnlimited
                ? `${summary.totalRemaining}+∞`
                : summary.totalRemaining}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <CreditsModal uid={uid} displayName={displayName} onClose={() => setOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}