// src/app/message/lib/call/callSignaling.ts
//
// Firebase Realtime Database signaling layer for WebRTC calls.
//
// Database structure:
//   calls/{chatId}/
//     state:       "idle" | "ringing" | "connected" | "ended"
//     callType:    "video" | "audio"
//     callerId:    string
//     callerName:  string
//     callerPhoto: string | null
//     offer:       RTCSessionDescriptionInit
//     answer:      RTCSessionDescriptionInit
//     iceCandidates/{userId}/{pushKey}: RTCIceCandidateInit
//     startedAt:   number
//     endedAt:     number

import { db } from "@/lib/firebase/firebase";
import {
    ref,
    set,
    get,
    push,
    update,
    remove,
    onValue,
    off,
    type Unsubscribe,
} from "firebase/database";

export type CallType = "video" | "audio";
export type CallState = "idle" | "ringing" | "connected" | "ended";

export interface CallSignal {
    state: CallState;
    callType: CallType;
    callerId: string;
    callerName: string;
    callerPhoto: string | null;
    offer?: RTCSessionDescriptionInit;
    answer?: RTCSessionDescriptionInit;
    startedAt?: number;
    endedAt?: number;
}

function callRef(chatId: string) {
    return ref(db, `calls/${chatId}`);
}

// ── Initiate a call ───────────────────────────────────────────────
export async function initiateCall(
    chatId: string,
    callerId: string,
    callerName: string,
    callerPhoto: string | null,
    callType: CallType,
    offer: RTCSessionDescriptionInit
): Promise<void> {
    await set(callRef(chatId), {
        state: "ringing",
        callType,
        callerId,
        callerName,
        callerPhoto: callerPhoto ?? null,
        offer,
        startedAt: Date.now(),
    });
}

// ── Answer a call ─────────────────────────────────────────────────
export async function answerCall(
    chatId: string,
    answer: RTCSessionDescriptionInit
): Promise<void> {
    await update(callRef(chatId), {
        answer,
        state: "connected",
    });
}

// ── End / decline a call ──────────────────────────────────────────
export async function endCall(chatId: string): Promise<void> {
    await set(callRef(chatId), {
        state: "ended",
        endedAt: Date.now(),
    });
    // Clean up after a short delay so both sides can read "ended"
    setTimeout(async () => {
        try { await remove(callRef(chatId)); } catch { /* ignore */ }
    }, 4000);
}

// ── Send an ICE candidate ─────────────────────────────────────────
export async function sendIceCandidate(
    chatId: string,
    userId: string,
    candidate: RTCIceCandidateInit
): Promise<void> {
    const iceRef = ref(db, `calls/${chatId}/iceCandidates/${userId}`);
    await push(iceRef, candidate);
}

// ── Subscribe to the call document ───────────────────────────────
export function subscribeToCall(
    chatId: string,
    callback: (signal: CallSignal | null) => void
): Unsubscribe {
    const r = callRef(chatId);
    onValue(r, (snap) => {
        callback(snap.exists() ? (snap.val() as CallSignal) : null);
    });
    return () => off(r);
}

// ── Subscribe to ICE candidates from a specific user ─────────────
export function subscribeToIceCandidates(
    chatId: string,
    fromUserId: string,
    callback: (candidate: RTCIceCandidateInit) => void
): Unsubscribe {
    const r = ref(db, `calls/${chatId}/iceCandidates/${fromUserId}`);
    onValue(r, (snap) => {
        if (!snap.exists()) return;
        snap.forEach((child) => {
            callback(child.val() as RTCIceCandidateInit);
        });
    });
    return () => off(r);
}

// ── One-time read ─────────────────────────────────────────────────
export async function getCallSignal(chatId: string): Promise<CallSignal | null> {
    const snap = await get(callRef(chatId));
    return snap.exists() ? (snap.val() as CallSignal) : null;
}