// src/lib/credits/useCredits.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { ref, onValue, runTransaction, get } from "firebase/database";
import { db } from "@/lib/firebase/firebase";
import {
  TOOL_CREDIT_CONFIGS,
  ToolCreditEntry,
  UserToolCredits,
  getDefaultEntry,
} from "./creditsConfig";

interface UseCreditsReturn {
  credits: ToolCreditEntry | null;
  loading: boolean;
  /** Returns true if the deduction succeeded, false if out of credits */
  deductCredit: () => Promise<boolean>;
  /** Admin only: set credits for this tool */
  setCredits: (
    remaining: number,
    total: number,
    unlimited: boolean,
  ) => Promise<void>;
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

    const creditRef = ref(db, `users/${uid}/toolCredits/${toolId}`);
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

    const creditRef = ref(db, `users/${uid}/toolCredits/${toolId}`);

    // First check if entry exists, if not initialize it
    const snap = await get(creditRef);
    if (!snap.exists()) {
      const defaultEntry = config
        ? getDefaultEntry(config)
        : { remaining: 10, total: 10, unlimited: false };
      // We'll let the transaction below handle writing
      const { set } = await import("firebase/database");
      await set(creditRef, defaultEntry);
    }

    // Use a transaction for atomic decrement
    let success = false;
    await runTransaction(creditRef, (current: ToolCreditEntry | null) => {
      if (!current) {
        // Shouldn't happen after initialization, but handle gracefully
        const defaultEntry = config
          ? getDefaultEntry(config)
          : { remaining: 10, total: 10, unlimited: false };
        success = true;
        return { ...defaultEntry, remaining: defaultEntry.remaining - 1 };
      }
      if (current.unlimited) {
        success = true;
        return current; // Don't modify unlimited
      }
      if (current.remaining <= 0) {
        success = false;
        return; // returning undefined aborts the transaction — don't write
      }
      success = true;
      return { ...current, remaining: current.remaining - 1 };
    });

    return success;
  }, [uid, toolId, config]);

  const setCredits = useCallback(
    async (
      remaining: number,
      total: number,
      unlimited: boolean,
    ): Promise<void> => {
      if (!uid || !toolId) return;
      const { set } = await import("firebase/database");
      await set(ref(db, `users/${uid}/toolCredits/${toolId}`), {
        remaining,
        total,
        unlimited,
      });
    },
    [uid, toolId],
  );

  const isUnlimited = credits?.unlimited ?? false;
  const hasCredits = isUnlimited || (credits?.remaining ?? 0) > 0;

  return {
    credits,
    loading,
    deductCredit,
    setCredits,
    isUnlimited,
    hasCredits,
  };
}

// Utility: read all tool credits for a user (used in admin panel)
export async function getAllToolCredits(uid: string): Promise<UserToolCredits> {
  const snap = await get(ref(db, `users/${uid}/toolCredits`));
  if (!snap.exists()) return {};
  return snap.val() as UserToolCredits;
}
