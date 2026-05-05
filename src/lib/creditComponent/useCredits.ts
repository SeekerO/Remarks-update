// src/app/admin/panel/creditComponent/useCredits.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { ref, onValue, runTransaction, get, set } from "firebase/database";
import { db } from "@/lib/firebase/firebase";
import {
  TOOL_CREDIT_CONFIGS,
  ToolCreditEntry,
  UserToolCredits,
  getDefaultEntry,
  creditPath,
  userCreditsPath,
} from "./creditsConfig";

interface UseCreditsReturn {
  credits: ToolCreditEntry | null;
  loading: boolean;
  /** Returns true if the deduction succeeded, false if out of credits */
  deductCredit: () => Promise<boolean>;
  /** Admin only: set credits for this tool */
  setCredits: (remaining: number, total: number, unlimited: boolean) => Promise<void>;
  isUnlimited: boolean;
  hasCredits: boolean;
}

export function useCredits(
  uid: string | undefined,
  toolId: string,
): UseCreditsReturn {
  const [credits, setCreditsState] = useState<ToolCreditEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const config = TOOL_CREDIT_CONFIGS.find((t) => t.toolId === toolId);

  useEffect(() => {
    if (!uid || !toolId) {
      setLoading(false);
      return;
    }

    // ── NEW PATH: user_credits/{uid}/{toolId} ──
    const creditRef = ref(db, creditPath(uid, toolId));

    const unsub = onValue(creditRef, (snap) => {
      if (snap.exists()) {
        setCreditsState(snap.val() as ToolCreditEntry);
      } else {
        // First time — initialize with default free credits
        const defaultEntry = config
          ? getDefaultEntry(config)
          : { remaining: 10, total: 10, unlimited: false };
        setCreditsState(defaultEntry);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [uid, toolId, config]);

  const deductCredit = useCallback(async (): Promise<boolean> => {
    if (!uid || !toolId) return false;

    // ── NEW PATH: user_credits/{uid}/{toolId} ──
    const creditRef = ref(db, creditPath(uid, toolId));

    // Ensure entry exists before running the transaction
    const snap = await get(creditRef);
    if (!snap.exists()) {
      const defaultEntry = config
        ? getDefaultEntry(config)
        : { remaining: 10, total: 10, unlimited: false };
      await set(creditRef, defaultEntry);
    }

    let success = false;
    await runTransaction(creditRef, (current: ToolCreditEntry | null) => {
      if (!current) {
        const defaultEntry = config
          ? getDefaultEntry(config)
          : { remaining: 10, total: 10, unlimited: false };
        success = true;
        return { ...defaultEntry, remaining: defaultEntry.remaining - 1 };
      }
      if (current.unlimited) {
        success = true;
        return current; // unlimited — don't decrement
      }
      if (current.remaining <= 0) {
        success = false;
        return; // abort transaction
      }
      success = true;
      return { ...current, remaining: current.remaining - 1 };
    });

    return success;
  }, [uid, toolId, config]);

  const setCredits = useCallback(
    async (remaining: number, total: number, unlimited: boolean): Promise<void> => {
      if (!uid || !toolId) return;
      // ── NEW PATH: user_credits/{uid}/{toolId} ──
      await set(ref(db, creditPath(uid, toolId)), { remaining, total, unlimited });
    },
    [uid, toolId],
  );

  const isUnlimited = credits?.unlimited ?? false;
  const hasCredits = isUnlimited || (credits?.remaining ?? 0) > 0;

  return { credits, loading, deductCredit, setCredits, isUnlimited, hasCredits };
}

// ── Admin utility: read all tool credits for a user ───────────────────────────
export async function getAllToolCredits(uid: string): Promise<UserToolCredits> {
  // ── NEW PATH: user_credits/{uid} ──
  const snap = await get(ref(db, userCreditsPath(uid)));
  if (!snap.exists()) return {};
  return snap.val() as UserToolCredits;
}