// src/lib/firebase/firebase.actions/faqFirestore.ts
// Firestore CRUD service for FAQ data
// Replaces localStorage with persistent Firestore storage

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
    serverTimestamp,
    Timestamp,
    type Unsubscribe,
} from "firebase/firestore";
import { app } from "../firebase"; // your existing firebase.ts

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FaqItem {
    id?: string;           // Firestore document ID (undefined for new items)
    topic: string;
    details: string;
    timerStartTime?: number | null;
    order?: number;        // Optional sort order
    createdAt?: Timestamp | null;
    updatedAt?: Timestamp | null;
}

// ── Firestore instance ────────────────────────────────────────────────────────

const db = getFirestore(app);
const FAQ_COLLECTION = "faqs"; // Collection name in Firestore

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns a typed reference to the faqs collection.
 */
function faqsRef() {
    return collection(db, FAQ_COLLECTION);
}

/**
 * Returns a typed reference to a single faq document.
 */
function faqDocRef(id: string) {
    return doc(db, FAQ_COLLECTION, id);
}

// ── READ ──────────────────────────────────────────────────────────────────────

/**
 * Fetches all FAQ items once (one-time read), ordered by `order` field.
 *
 * @returns Promise<FaqItem[]>
 */
export async function getAllFaqs(): Promise<FaqItem[]> {
    const q = query(faqsRef(), orderBy("order", "asc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<FaqItem, "id">),
    }));
}

/**
 * Subscribes to real-time FAQ updates from Firestore.
 * Call the returned unsubscribe function to stop listening.
 *
 * Usage in your component:
 *   useEffect(() => {
 *     const unsub = subscribeToFaqs((faqs) => setFaqs(faqs));
 *     return () => unsub();
 *   }, []);
 *
 * @param callback - Called with the latest FAQ array on every update
 * @returns Unsubscribe function
 */
export function subscribeToFaqs(
    callback: (faqs: FaqItem[]) => void
): Unsubscribe {
    const q = query(faqsRef(), orderBy("order", "asc"));

    return onSnapshot(q, (snapshot) => {
        const faqs: FaqItem[] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<FaqItem, "id">),
        }));
        callback(faqs);
    });
}

// ── CREATE ────────────────────────────────────────────────────────────────────

/**
 * Adds a new FAQ item to Firestore.
 * Automatically sets `createdAt`, `updatedAt`, and `timerStartTime`.
 *
 * @param faq - The FAQ item to add (without id)
 * @returns The newly created FAQ item (with its Firestore-generated id)
 */
export async function addFaq(
    faq: Omit<FaqItem, "id" | "createdAt" | "updatedAt">
): Promise<FaqItem> {
    // Get current max order to append at the end
    const existing = await getAllFaqs();
    const maxOrder = existing.length > 0
        ? Math.max(...existing.map((f) => f.order ?? 0))
        : -1;

    const payload = {
        topic: faq.topic.trim(),
        details: faq.details.trim(),
        timerStartTime: faq.timerStartTime ?? null,
        order: maxOrder + 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(faqsRef(), payload);

    return {
        id: docRef.id,
        ...payload,
        createdAt: null, // serverTimestamp() resolves asynchronously; null is safe here
        updatedAt: null,
    };
}

// ── UPDATE ────────────────────────────────────────────────────────────────────

/**
 * Updates an existing FAQ document's topic and/or details.
 *
 * @param id      - The Firestore document ID
 * @param updates - Partial FAQ fields to update
 */
export async function updateFaq(
    id: string,
    updates: Partial<Pick<FaqItem, "topic" | "details" | "timerStartTime" | "order">>
): Promise<void> {
    if (!id) throw new Error("updateFaq: document id is required");

    await updateDoc(faqDocRef(id), {
        ...updates,
        updatedAt: serverTimestamp(),
    });
}

// ── TIMER-SPECIFIC UPDATE ─────────────────────────────────────────────────────

/**
 * Sets (or clears) the timer start time for a specific FAQ.
 * Use `null` to reset/stop the timer, or `Date.now()` to start it.
 *
 * @param id             - Firestore document ID
 * @param timerStartTime - Timestamp in ms, or null to reset
 */
export async function setFaqTimer(
    id: string,
    timerStartTime: number | null
): Promise<void> {
    if (!id) throw new Error("setFaqTimer: document id is required");

    await updateDoc(faqDocRef(id), {
        timerStartTime,
        updatedAt: serverTimestamp(),
    });
}

// ── DELETE ────────────────────────────────────────────────────────────────────

/**
 * Permanently deletes a FAQ document from Firestore.
 *
 * @param id - The Firestore document ID
 */
export async function deleteFaq(id: string): Promise<void> {
    if (!id) throw new Error("deleteFaq: document id is required");

    await deleteDoc(faqDocRef(id));
}

// ── BULK SEED (one-time migration from JSON) ──────────────────────────────────

/**
 * Seeds Firestore with an initial FAQ array (e.g., from your faq.json).
 * Safe to call once during setup — does NOT check for duplicates.
 *
 * Example usage (run once from a setup script or admin page):
 *   import faqData from "@/lib/json/faq.json";
 *   await seedFaqs(faqData);
 *
 * @param faqs - Array of FAQ items to seed
 */
export async function seedFaqs(
    faqs: Omit<FaqItem, "id" | "createdAt" | "updatedAt">[]
): Promise<void> {
    const promises = faqs.map((faq, index) =>
        addDoc(faqsRef(), {
            topic: faq.topic.trim(),
            details: faq.details.trim(),
            timerStartTime: faq.timerStartTime ?? null,
            order: index,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        })
    );

    await Promise.all(promises);
    console.log(`✅ Seeded ${faqs.length} FAQs to Firestore.`);
}