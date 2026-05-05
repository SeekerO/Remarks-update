// src/app/admin/panel/creditComponent/CreditGate.tsx
"use client";

import React, { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useCredits } from "./useCredits";
import { TOOL_CREDIT_CONFIGS } from "./creditsConfig";
import { Zap, Lock, Mail, Sparkles, X } from "lucide-react";

// ── Upgrade Modal ────────────────────────────────────────────────────────────

interface UpgradeModalProps {
  toolId: string;
  onClose: () => void;
}

function UpgradeModal({ toolId, onClose }: UpgradeModalProps) {
  const config = TOOL_CREDIT_CONFIGS.find((t) => t.toolId === toolId);
  const [sent, setSent] = useState(false);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-sm flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: "linear-gradient(145deg, #0d0d1a 0%, #111128 100%)",
          border: "1px solid rgba(99,102,241,0.2)",
        }}
      >
        <div
          className="h-[3px] w-full"
          style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)" }}
        />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="px-6 pt-6 pb-7 flex flex-col items-center gap-5">
          {/* Icon cluster */}
          <div className="relative flex items-center justify-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.25)",
                boxShadow: "0 0 40px rgba(99,102,241,0.15)",
              }}
            >
              <span className="text-3xl">{config?.icon ?? "🔒"}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <Lock className="w-3.5 h-3.5 text-red-400" />
            </div>
          </div>

          {/* Heading */}
          <div className="text-center space-y-1.5">
            <h2 className="text-base font-bold text-white tracking-tight">Free Trial Exhausted</h2>
            <p className="text-xs text-white/40 leading-relaxed max-w-[240px]">
              You've used all{" "}
              <span className="text-white/60 font-medium">{config?.defaultFreeCredits ?? 10} free credits</span>{" "}
              for{" "}
              <span className="text-indigo-300 font-medium">{config?.label ?? "this tool"}</span>.
              Contact your administrator for full access.
            </p>
          </div>

          {/* Credit bar — empty */}
          <div className="w-full space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/25">
                Credits Used
              </span>
              <span className="text-[10px] font-bold text-red-400">
                {config?.defaultFreeCredits ?? 10} / {config?.defaultFreeCredits ?? 10}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: "100%", background: "linear-gradient(90deg, #ef4444, #f97316)" }}
              />
            </div>
          </div>

          {/* Full access perks */}
          <div
            className="w-full rounded-xl p-4 space-y-2.5"
            style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.15)" }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/70">
              Full Access Includes
            </p>
            {["Unlimited credits for this tool", "Access to all workspace tools", "Priority processing"].map(
              (item) => (
                <div key={item} className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                  <span className="text-[11px] text-white/50">{item}</span>
                </div>
              )
            )}
          </div>

          {/* CTA */}
          {!sent ? (
            <button
              onClick={() => setSent(true)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                boxShadow: "0 4px 24px rgba(99,102,241,0.35)",
              }}
            >
              <Mail className="w-4 h-4" />
              Request Full Access
            </button>
          ) : (
            <div
              className="w-full py-3 rounded-xl text-center"
              style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}
            >
              <p className="text-sm font-semibold text-emerald-400">✓ Request sent to administrator</p>
            </div>
          )}

          <button
            onClick={onClose}
            className="text-[11px] text-white/20 hover:text-white/50 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Credit Badge ─────────────────────────────────────────────────────────────

interface CreditBadgeProps {
  toolId: string;
  className?: string;
}

export function CreditBadge({ toolId, className = "" }: CreditBadgeProps) {
  const { user } = useAuth();
  const { credits, loading, isUnlimited } = useCredits(user?.uid, toolId);

  if (loading || !credits) return null;

  if (isUnlimited) {
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${className}`}
        style={{
          background: "rgba(16,185,129,0.1)",
          border: "1px solid rgba(16,185,129,0.2)",
          color: "#34d399",
        }}
      >
        <Sparkles className="w-2.5 h-2.5" />
        Unlimited
      </div>
    );
  }

  const pct = Math.max(0, Math.min(100, (credits.remaining / credits.total) * 100));
  const isLow = credits.remaining <= 2;
  const isEmpty = credits.remaining <= 0;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full text-[10px] font-bold ${className}`}
      style={{
        background: isEmpty
          ? "rgba(239,68,68,0.1)"
          : isLow
            ? "rgba(245,158,11,0.1)"
            : "rgba(99,102,241,0.1)",
        border: `1px solid ${
          isEmpty
            ? "rgba(239,68,68,0.2)"
            : isLow
              ? "rgba(245,158,11,0.2)"
              : "rgba(99,102,241,0.2)"
        }`,
        color: isEmpty ? "#f87171" : isLow ? "#fbbf24" : "#a5b4fc",
      }}
    >
      <Zap className="w-2.5 h-2.5" />
      {credits.remaining}/{credits.total} credits
    </div>
  );
}

// ── CreditGate — render-prop wrapper ─────────────────────────────────────────

interface CreditGateProps {
  toolId: string;
  children: (props: {
    onAction: (originalAction: () => void | Promise<void>) => Promise<void>;
    hasCredits: boolean;
    credits: ReturnType<typeof useCredits>["credits"];
    isUnlimited: boolean;
    loading: boolean;
  }) => React.ReactNode;
}

export function CreditGate({ toolId, children }: CreditGateProps) {
  const { user } = useAuth();
  const { credits, loading, deductCredit, isUnlimited, hasCredits } = useCredits(
    user?.uid,
    toolId
  );
  const [showUpgrade, setShowUpgrade] = useState(false);

  const onAction = useCallback(
    async (originalAction: () => void | Promise<void>) => {
      if (isUnlimited) {
        await originalAction();
        return;
      }
      const ok = await deductCredit();
      if (!ok) {
        setShowUpgrade(true);
        return;
      }
      await originalAction();
    },
    [isUnlimited, deductCredit]
  );

  return (
    <>
      {children({ onAction, hasCredits, credits, isUnlimited, loading })}
      {showUpgrade && (
        <UpgradeModal toolId={toolId} onClose={() => setShowUpgrade(false)} />
      )}
    </>
  );
}

// ── CreditGateButton — drop-in button replacement ────────────────────────────

interface CreditGateButtonProps {
  toolId: string;
  onClick: () => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  showBadge?: boolean;
}

export function CreditGateButton({
  toolId,
  onClick,
  children,
  className = "",
  disabled = false,
  showBadge = false,
}: CreditGateButtonProps) {
  const { user } = useAuth();
  const { credits, loading, deductCredit, isUnlimited, hasCredits } = useCredits(
    user?.uid,
    toolId
  );
  const [showUpgrade, setShowUpgrade] = useState(false);

  const handleClick = async () => {
    if (disabled || loading) return;
    if (isUnlimited) {
      await onClick();
      return;
    }
    const ok = await deductCredit();
    if (!ok) {
      setShowUpgrade(true);
      return;
    }
    await onClick();
  };

  return (
    <>
      <div className="flex flex-col gap-1">
        <button
          onClick={handleClick}
          disabled={disabled || loading || (!hasCredits && !isUnlimited)}
          className={className}
        >
          {!isUnlimited && !loading && credits && credits.remaining <= 0 ? (
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              No Credits
            </span>
          ) : (
            children
          )}
        </button>
        {showBadge && <CreditBadge toolId={toolId} />}
      </div>
      {showUpgrade && (
        <UpgradeModal toolId={toolId} onClose={() => setShowUpgrade(false)} />
      )}
    </>
  );
}