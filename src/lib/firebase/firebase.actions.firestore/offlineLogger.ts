// src/lib/firebase/firebase.actions.firestore/offlineLogger.ts
//
// Drop-in replacement for addLog() that:
//   1. Always records the log immediately in localStorage
//   2. Attempts a live Firestore write right away (if online)
//   3. On any failure, the localStorage copy stays — a background
//      flush routine (startOfflineLogSync) retries it when the
//      browser reports it is back online.
//
// Usage:
//   Replace every `addLog(...)` call with `logActivity(...)`.
//   Call `startOfflineLogSync()` once, at app startup (e.g. in AuthProvider or layout.tsx).

import { addLog } from "./logsFirestore";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PendingLog {
    id: string; // client-generated UUID
    userName: string;
    userEmail: string;
    function: string;
    urlPath: string;
    capturedAt: number; // Date.now() when the action happened
    retries: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const LS_KEY = "avexi_pending_logs";
const MAX_RETRIES = 5;
const MAX_PENDING = 200; // cap to avoid unbounded localStorage growth

// ── Helpers ───────────────────────────────────────────────────────────────────

function uuid(): string {
    return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function readQueue(): PendingLog[] {
    try {
        const raw = localStorage.getItem(LS_KEY);
        return raw ? (JSON.parse(raw) as PendingLog[]) : [];
    } catch {
        return [];
    }
}

function writeQueue(queue: PendingLog[]): void {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(queue));
    } catch {
        // localStorage full — drop oldest entries and retry once
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(queue.slice(-50)));
        } catch {
            // silently swallow
        }
    }
}

function enqueue(log: Omit<PendingLog, "id" | "retries">): PendingLog {
    const entry: PendingLog = { ...log, id: uuid(), retries: 0 };
    const queue = readQueue();
    // Enforce cap — discard oldest if needed
    const trimmed = queue.length >= MAX_PENDING ? queue.slice(1) : queue;
    writeQueue([...trimmed, entry]);
    return entry;
}

function removeFromQueue(id: string): void {
    writeQueue(readQueue().filter((l) => l.id !== id));
}

function incrementRetry(id: string): void {
    writeQueue(
        readQueue().map((l) => (l.id === id ? { ...l, retries: l.retries + 1 } : l))
    );
}

// ── Public: logActivity ───────────────────────────────────────────────────────

/**
 * Fire-and-forget activity logger with offline resilience.
 *
 * Stores the log in localStorage immediately, then tries to push
 * it to Firestore. If the push fails (offline, auth error, etc.)
 * the entry stays in localStorage and will be retried automatically
 * when the browser comes back online (after startOfflineLogSync() is called).
 */
export async function logActivity(payload: {
    userName: string;
    userEmail: string;
    function: string;
    urlPath: string;
}): Promise<void> {
    const entry = enqueue({ ...payload, capturedAt: Date.now() });

    if (!navigator.onLine) return; // will be flushed by the sync listener

    try {
        await addLog({
            userName: payload.userName,
            userEmail: payload.userEmail,
            function: payload.function,
            urlPath: payload.urlPath,
        });
        removeFromQueue(entry.id);
    } catch {
        // stays in queue — sync will retry
    }
}

// ── Public: flushPendingLogs ──────────────────────────────────────────────────

/**
 * Attempts to push every pending localStorage log to Firestore.
 * Safe to call at any time; skips entries that have already exceeded MAX_RETRIES.
 */
export async function flushPendingLogs(): Promise<void> {
    if (!navigator.onLine) return;

    const queue = readQueue();
    if (queue.length === 0) return;

    for (const log of queue) {
        if (log.retries >= MAX_RETRIES) {
            // Give up on this entry so it doesn't block the queue forever
            removeFromQueue(log.id);
            continue;
        }

        try {
            await addLog({
                userName: log.userName,
                userEmail: log.userEmail,
                function: log.function,
                urlPath: log.urlPath,
            });
            removeFromQueue(log.id);
        } catch {
            incrementRetry(log.id);
        }
    }
}

// ── Public: startOfflineLogSync ───────────────────────────────────────────────

let _syncStarted = false;

/**
 * Registers a window `online` listener that flushes queued logs as soon
 * as the browser reports an internet connection.
 *
 * Call once at app startup — repeated calls are safe (no-op after first).
 *
 * Returns a cleanup function that removes the listener.
 */
export function startOfflineLogSync(): () => void {
    if (_syncStarted || typeof window === "undefined") return () => { };
    _syncStarted = true;

    const handler = () => {
        flushPendingLogs().catch(() => { }); // fire-and-forget, errors are swallowed
    };

    window.addEventListener("online", handler);

    // Also attempt an immediate flush (for cases where the page loads while already online
    // but there are leftover logs from a previous offline session).
    flushPendingLogs().catch(() => { });

    return () => {
        window.removeEventListener("online", handler);
        _syncStarted = false;
    };
}

// ── Public: getPendingLogCount ────────────────────────────────────────────────

/** Returns how many logs are currently waiting to be synced. */
export function getPendingLogCount(): number {
    return readQueue().length;
}