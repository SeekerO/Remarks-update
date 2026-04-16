// src/lib/hooks/useOfflineLogSync.ts
//
// Mount this hook once (e.g. in AuthProvider or ThemeWrapper) to
// automatically flush queued offline logs when connectivity returns.
//
// Usage:
//   In AuthProvider.tsx (or any top-level component):
//
//     import { useOfflineLogSync } from "@/lib/hooks/useOfflineLogSync";
//     // inside the component:
//     useOfflineLogSync();
//
// That's it. The hook also returns live state you can use for UI indicators:
//
//   const { isOnline, pendingCount } = useOfflineLogSync();

import { useEffect, useState, useCallback } from "react";
import {
    startOfflineLogSync,
    flushPendingLogs,
    getPendingLogCount,
} from "@/lib/firebase/firebase.actions.firestore/offlineLogger";

export interface OfflineLogSyncState {
    /** Is the browser currently online? */
    isOnline: boolean;
    /** How many logs are still waiting to be synced to Firestore? */
    pendingCount: number;
    /** Manually trigger a flush (useful for "Retry" buttons). */
    flush: () => Promise<void>;
}

export function useOfflineLogSync(): OfflineLogSyncState {
    const [isOnline, setIsOnline] = useState(
        typeof navigator !== "undefined" ? navigator.onLine : true
    );
    const [pendingCount, setPendingCount] = useState(getPendingLogCount);

    const refreshCount = useCallback(() => {
        setPendingCount(getPendingLogCount());
    }, []);

    useEffect(() => {
        // Register the background sync listener
        const cleanup = startOfflineLogSync();

        const handleOnline = () => {
            setIsOnline(true);
            // Give flushPendingLogs a moment to run, then update the count
            setTimeout(refreshCount, 1500);
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Poll the pending count every 10 s so the badge stays accurate
        const interval = setInterval(refreshCount, 10_000);
        refreshCount(); // initialise immediately

        return () => {
            cleanup();
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
            clearInterval(interval);
        };
    }, [refreshCount]);

    const flush = useCallback(async () => {
        await flushPendingLogs();
        refreshCount();
    }, [refreshCount]);

    return { isOnline, pendingCount, flush };
}