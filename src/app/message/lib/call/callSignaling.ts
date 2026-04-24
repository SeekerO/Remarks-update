// src/app/message/lib/call/callSignaling.ts
// PATCHED — drop-in replacement for the original. Public API unchanged.
// Fixes applied (search "FIX #" to find each one):
//   FIX #A  off(ref) detached EVERY listener on the path, including the
//           page-level incoming-call watcher. Now we keep the per-listener
//           callback handle and only detach that one.
//   FIX #B  endCall used set() (replaces the whole node), wiping the
//           callerId/chatId so the peer's "ringing -> ended" diff couldn't
//           be matched. Now uses update() to merge state:"ended".
//   FIX #C  initiateCall used set() with no guard, so simultaneous calls
//           on the same chatId would silently overwrite each other (glare).
//           Now refuses to overwrite an existing ringing/connected doc.
"use client";

import { db } from "@/lib/firebase/firebase";
import {
  ref,
  set,
  get,
  push,
  update,
  remove,
  onValue,
  onChildAdded,
  off,
  runTransaction,
  type Unsubscribe,
  type DataSnapshot,
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
// FIX #C: refuse to overwrite an existing active call doc. If two clients
// race to call the same chat, the second one's transaction aborts and we
// throw — caller can surface "user is busy" instead of silently stomping.
export async function initiateCall(
  chatId: string,
  callerId: string,
  callerName: string,
  callerPhoto: string | null,
  callType: CallType,
  offer: RTCSessionDescriptionInit,
): Promise<void> {
  const result = await runTransaction(callRef(chatId), (current) => {
    if (current && (current.state === "ringing" || current.state === "connected")) {
      // abort — someone else owns this call slot
      return; // returning undefined aborts the transaction
    }
    return {
      state: "ringing",
      callType,
      callerId,
      callerName,
      callerPhoto: callerPhoto ?? null,
      offer,
      startedAt: Date.now(),
    };
  });
  if (!result.committed) {
    throw new Error("Call already in progress for this chat.");
  }
}

// ── Answer a call ─────────────────────────────────────────────────
export async function answerCall(
  chatId: string,
  answer: RTCSessionDescriptionInit,
): Promise<void> {
  await update(callRef(chatId), {
    answer,
    state: "connected",
  });
}

// ── End / decline a call ──────────────────────────────────────────
// FIX #B: use update() instead of set() so callerId/chatId/etc. survive,
// and the peer's subscribeToCall callback can still see who ended it.
export async function endCall(chatId: string): Promise<void> {
  try {
    await update(callRef(chatId), {
      state: "ended",
      endedAt: Date.now(),
    });
  } catch {
    /* ignore — node may already be gone */
  }
  // Clean up after a short delay so both sides can read "ended"
  setTimeout(async () => {
    try {
      await remove(callRef(chatId));
    } catch {
      /* ignore */
    }
  }, 4000);
}

// ── Send an ICE candidate ─────────────────────────────────────────
export async function sendIceCandidate(
  chatId: string,
  userId: string,
  candidate: RTCIceCandidateInit,
): Promise<void> {
  const iceRef = ref(db, `calls/${chatId}/iceCandidates/${userId}`);
  await push(iceRef, candidate);
}

// ── Subscribe to the call document ───────────────────────────────
// FIX #A: keep the callback reference and detach ONLY that callback in the
// returned unsubscribe. The previous `off(r)` removed every listener on
// this path, including the page-level incoming-call watcher.
export function subscribeToCall(
  chatId: string,
  callback: (signal: CallSignal | null) => void,
): Unsubscribe {
  const r = callRef(chatId);
  const handler = (snap: DataSnapshot) => {
    callback(snap.exists() ? (snap.val() as CallSignal) : null);
  };
  onValue(r, handler);
  return () => off(r, "value", handler);
}

// ── Subscribe to ICE candidates from a specific user ─────────────
// FIX #A: same fix — scope the detach to the specific child_added handler.
export function subscribeToIceCandidates(
  chatId: string,
  fromUserId: string,
  callback: (candidate: RTCIceCandidateInit) => void,
): Unsubscribe {
  const r = ref(db, `calls/${chatId}/iceCandidates/${fromUserId}`);
  const handler = (snap: DataSnapshot) => {
    if (snap.exists()) {
      callback(snap.val() as RTCIceCandidateInit);
    }
  };
  onChildAdded(r, handler);
  return () => off(r, "child_added", handler);
}

// ── One-time read ─────────────────────────────────────────────────
export async function getCallSignal(
  chatId: string,
): Promise<CallSignal | null> {
  const snap = await get(callRef(chatId));
  return snap.exists() ? (snap.val() as CallSignal) : null;
}
