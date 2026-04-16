// src/lib/firebase/firebase.actions/logsFirestore.ts
// Firestore CRUD service for Activity Logs
// Handles POST (create) and GET (read) operations for activity logging

import {
    getFirestore,
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy,
    limit,
    serverTimestamp,
    Timestamp,
    where,
    type Unsubscribe,
} from "firebase/firestore";
import { app } from "../firebase"; // your existing firebase.ts

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ActivityLog {
    id?: string;
    userName: string;
    userEmail: string;
    function: string;
    urlPath: string;
    createdAt?: Timestamp | null;
}

// ── Firestore instance ────────────────────────────────────────────────────────

const db = getFirestore(app);
const LOGS_COLLECTION = "logs"; // Collection name in Firestore

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns a typed reference to the logs collection.
 */
function logsRef() {
    return collection(db, LOGS_COLLECTION);
}

/**
 * Returns a typed reference to a single log document.
 */
function logDocRef(id: string) {
    return doc(db, LOGS_COLLECTION, id);
}

// ── READ ──────────────────────────────────────────────────────────────────────

/**
 * Fetches all activity logs once (one-time read), ordered by `createdAt` descending.
 *
 * @returns Promise<ActivityLog[]>
 */
export async function getAllLogs(): Promise<ActivityLog[]> {
    const q = query(logsRef(), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<ActivityLog, "id">),
    }));
}

/**
 * Fetches activity logs with pagination and optional filtering.
 *
 * @param pageSize - Number of logs per page (default 50, max 100)
 * @param page - Page number (1-based, default 1)
 * @returns Promise<ActivityLog[]>
 */
export async function getLogsPaginated(
    pageSize: number = 50,
    page: number = 1
): Promise<ActivityLog[]> {
    const normalizedPageSize = Math.min(pageSize, 100);
    const normalizedPage = Math.max(page, 1);
    const fetchLimit = normalizedPageSize * normalizedPage;

    const q = query(logsRef(), orderBy("createdAt", "desc"), limit(fetchLimit));
    const snapshot = await getDocs(q);

    const allLogs = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<ActivityLog, "id">),
    }));

    const start = (normalizedPage - 1) * normalizedPageSize;
    return allLogs.slice(start, start + normalizedPageSize);
}

/**
 * Fetches logs filtered by a specific field and search term.
 *
 * @param searchTerm - Search term to match
 * @param filterField - Field to search: "userName" | "userEmail" | "function" | "urlPath"
 * @returns Promise<ActivityLog[]>
 */
export async function searchLogs(
    searchTerm: string,
    filterField: "userName" | "userEmail" | "function" | "urlPath"
): Promise<ActivityLog[]> {
    const q = query(logsRef(), orderBy("createdAt", "desc"), limit(200));
    const snapshot = await getDocs(q);

    const allLogs = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<ActivityLog, "id">),
    }));

    const searchLower = searchTerm.toLowerCase();
    return allLogs.filter((log) =>
        (log[filterField] as string).toLowerCase().includes(searchLower)
    );
}

/**
 * Subscribes to real-time activity log updates from Firestore.
 * Call the returned unsubscribe function to stop listening.
 *
 * Usage in your component:
 *   useEffect(() => {
 *     const unsub = subscribeToLogs((logs) => setLogs(logs));
 *     return () => unsub();
 *   }, []);
 *
 * @param callback - Called with the latest logs array on every update
 * @returns Unsubscribe function
 */
export function subscribeToLogs(
    callback: (logs: ActivityLog[]) => void
): Unsubscribe {
    const q = query(logsRef(), orderBy("createdAt", "desc"));

    return onSnapshot(q, (snapshot) => {
        const logs: ActivityLog[] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<ActivityLog, "id">),
        }));
        callback(logs);
    });
}

// ── CREATE ────────────────────────────────────────────────────────────────────

/**
 * Adds a new activity log to Firestore.
 * Automatically sets `createdAt` timestamp.
 *
 * @param log - The activity log to add (without id and createdAt)
 * @returns The newly created log item (with its Firestore-generated id)
 */
export async function addLog(
    log: Omit<ActivityLog, "id" | "createdAt">
): Promise<ActivityLog> {
    const payload = {
        userName: log.userName.trim(),
        userEmail: log.userEmail.trim(),
        function: log.function.trim(),
        urlPath: log.urlPath.trim(),
        createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(logsRef(), payload);

    return {
        id: docRef.id,
        ...payload,
        createdAt: null, // serverTimestamp() resolves asynchronously; null is safe here
    };
}

/**
 * Adds multiple logs to Firestore in a batch.
 * Useful for bulk operations or imports.
 *
 * @param logs - Array of activity logs to add
 * @returns Promise<void>
 */
export async function addLogsBatch(
    logs: Omit<ActivityLog, "id" | "createdAt">[]
): Promise<void> {
    const promises = logs.map((log) =>
        addDoc(logsRef(), {
            userName: log.userName.trim(),
            userEmail: log.userEmail.trim(),
            function: log.function.trim(),
            urlPath: log.urlPath.trim(),
            createdAt: serverTimestamp(),
        })
    );

    await Promise.all(promises);
}

// ── UPDATE ────────────────────────────────────────────────────────────────────

/**
 * Updates an existing activity log.
 *
 * @param id - The Firestore document ID
 * @param updates - Partial activity log fields to update
 */
export async function updateLog(
    id: string,
    updates: Partial<Pick<ActivityLog, "userName" | "userEmail" | "function" | "urlPath">>
): Promise<void> {
    if (!id) throw new Error("updateLog: document id is required");

    await updateDoc(logDocRef(id), updates);
}

// ── DELETE ────────────────────────────────────────────────────────────────────

/**
 * Permanently deletes an activity log from Firestore.
 *
 * @param id - The Firestore document ID
 */
export async function deleteLog(id: string): Promise<void> {
    if (!id) throw new Error("deleteLog: document id is required");

    await deleteDoc(logDocRef(id));
}

/**
 * Deletes multiple logs by ID.
 *
 * @param ids - Array of Firestore document IDs to delete
 */
export async function deleteLogsBatch(ids: string[]): Promise<void> {
    const promises = ids.map((id) => deleteLog(id));
    await Promise.all(promises);
    console.log(`✅ Deleted ${ids.length} logs from Firestore.`);
}