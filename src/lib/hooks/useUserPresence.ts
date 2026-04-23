// src/lib/hooks/useUserPresence.ts

import { useState, useEffect, useRef, useCallback } from "react";
import { ref, onValue, set, serverTimestamp, onDisconnect } from "firebase/database";
import { db } from "@/lib/firebase/firebase";
import { useAuth } from "@/lib/auth/AuthContext";

type PresenceStatusMap = Record<string, boolean | number>;

const INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

export const useUserPresence = () => {
  const [onlineUsers, setOnlineUsers] = useState<PresenceStatusMap>({});
  const [isPresenceLoading, setIsPresenceLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInactive = useRef(false);

  const formatLastOnline = (timestamp: number | null): string => {
    if (!timestamp) return "Offline";
    const diff = Date.now() - timestamp;
    if (diff < 60_000) return "Just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
    try {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }).format(new Date(timestamp));
    } catch {
      return new Date(timestamp).toLocaleString();
    }
  };

  // ── Set current user offline ──────────────────────────────────
  const setUserOffline = useCallback(async () => {
    if (!user) return;
    isInactive.current = true;
    const presenceRef = ref(db, `presence/${user.uid}`);
    await set(presenceRef, { online: false, lastSeen: serverTimestamp() });
  }, [user]);

  // ── Set current user back online ──────────────────────────────
  const setUserOnline = useCallback(async () => {
    if (!user) return;
    if (!isInactive.current) return; // already online, skip
    isInactive.current = false;
    const presenceRef = ref(db, `presence/${user.uid}`);
    await set(presenceRef, { online: true, lastSeen: serverTimestamp() });
    // re-register onDisconnect after coming back from inactivity
    onDisconnect(presenceRef).set({ online: false, lastSeen: serverTimestamp() });
  }, [user]);

  // ── Reset inactivity timer on any activity ────────────────────
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);

    // if was inactive, bring back online
    if (isInactive.current) setUserOnline();

    inactivityTimer.current = setTimeout(() => {
      setUserOffline();
    }, INACTIVITY_TIMEOUT_MS);
  }, [setUserOffline, setUserOnline]);

  // ── Attach activity listeners for current user ────────────────
  useEffect(() => {
    if (!user) return;

    const events = [
      "mousemove",
      "keydown",
      "mousedown",
      "touchstart",
      "scroll",
      "focus",
    ];

    events.forEach((e) =>
      window.addEventListener(e, resetInactivityTimer, { passive: true })
    );

    // start timer immediately on mount
    resetInactivityTimer();

    return () => {
      events.forEach((e) =>
        window.removeEventListener(e, resetInactivityTimer)
      );
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [user, resetInactivityTimer]);

  // ── Subscribe to ALL users' presence ─────────────────────────
  useEffect(() => {
    const presenceRef = ref(db, "presence");
    let loaded = false;

    const unsub = onValue(
      presenceRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        const statusMap: PresenceStatusMap = {};

        for (const uid in data) {
          const entry = data[uid];
          if (entry?.online === true) {
            statusMap[uid] = true;           // online → true
          } else if (entry?.lastSeen) {
            statusMap[uid] = entry.lastSeen; // offline → lastSeen timestamp
          } else {
            statusMap[uid] = false;          // never seen → false
          }
        }

        setOnlineUsers(statusMap);
        if (!loaded) {
          setIsPresenceLoading(false);
          loaded = true;
        }
      },
      (error) => {
        console.error("Presence error:", error);
        setIsPresenceLoading(false);
      }
    );

    return () => unsub();
  }, []);

  return { onlineUsers, isPresenceLoading, formatLastOnline };
};