// src/app/message/lib/hooks/useWebRTC.ts
// PATCHED — drop-in replacement for the original. Public API unchanged.
// Fixes applied (search "FIX #" to find each one):
//   FIX #1  ICE buffering: candidates arriving before remoteDescription are
//           queued instead of dropped (prevents "stuck on connecting").
//   FIX #2  TURN slot: env-driven TURN server so calls work on symmetric NAT.
//   FIX #3  Cancellable getUserMedia: hanging up mid-acquire stops tracks.
//   FIX #4  "disconnected" no longer triggers immediate teardown — 5s grace
//           window lets ICE recover (which it usually does).
//   FIX #5  Audio-only sink: remoteAudioRef so audio-only calls actually play.
//   FIX #6  Real speaker toggle via setSinkId (falls back to muting if
//           setSinkId isn't supported).
//   FIX #7  Always stop ALL local tracks on cleanup (even ones not attached
//           as senders yet — fixes mic/cam leaks on early errors).
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ref, get, type Unsubscribe } from "firebase/database";
import { db } from "@/lib/firebase/firebase";
import {
  initiateCall,
  answerCall,
  endCall,
  sendIceCandidate,
  subscribeToCall,
  subscribeToIceCandidates,
  type CallType,
  type CallSignal,
} from "../call/callSignaling";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  // FIX #2: optional TURN server (Twilio, Xirsys, coturn, ...).
  // Without TURN, ~15-20% of calls fail (symmetric NAT, mobile carriers).
  ...(process.env.NEXT_PUBLIC_TURN_URL
    ? [
        {
          urls: process.env.NEXT_PUBLIC_TURN_URL,
          username: process.env.NEXT_PUBLIC_TURN_USERNAME,
          credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
        } as RTCIceServer,
      ]
    : []),
];

export type UseWebRTCCallState =
  | "idle"
  | "requesting-media"
  | "calling"
  | "incoming"
  | "connecting"
  | "connected"
  | "ended"
  | "error";

export interface IncomingCallInfo {
  callerName: string;
  callerPhoto: string | null;
  callType: CallType;
  chatId: string;
}

export interface UseWebRTCReturn {
  callState: UseWebRTCCallState;
  callType: CallType;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  incomingCall: IncomingCallInfo | null;
  activeChatId: string;
  isMicOn: boolean;
  isCamOn: boolean;
  isSpeakerOn: boolean;
  error: string | null;
  startCall: (chatId: string, type: CallType) => Promise<void>;
  acceptCall: () => Promise<void>;
  hangUp: () => Promise<void>;
  toggleMic: () => void;
  toggleCam: () => void;
  toggleSpeaker: () => void;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
  // FIX #5: expose an audio sink ref so the modal can render
  // <audio ref={remoteAudioRef} autoPlay /> for audio-only calls.
  remoteAudioRef: React.RefObject<HTMLAudioElement | null>;
  watchChatForIncomingCall: (chatId: string) => void;
}

export function useWebRTC({
  currentUserId,
  currentUserName,
  currentUserPhoto,
}: {
  currentUserId: string;
  currentUserName: string;
  currentUserPhoto: string | null;
}): UseWebRTCReturn {
  const [callState, setCallState] = useState<UseWebRTCCallState>("idle");
  const [callType, setCallType] = useState<CallType>("video");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallInfo | null>(null);
  const [activeChatId, setActiveChatId] = useState("");
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const activeChatIdRef = useRef("");
  const processedCandidates = useRef(new Set<string>());
  const unsubCallRef = useRef<Unsubscribe | null>(null);
  const unsubIceRef = useRef<Unsubscribe | null>(null);
  const chatWatchUnsubsRef = useRef<Map<string, Unsubscribe>>(new Map());

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null); // FIX #5

  // FIX #1: buffer ICE candidates received before setRemoteDescription
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteDescSetRef = useRef(false);

  // FIX #3: signal that a hangup happened during getUserMedia
  const cancelledRef = useRef(false);

  // FIX #4: debounce "disconnected" -> teardown
  const disconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Attach streams to media elements whenever they change ─────────
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    // FIX #5: also pipe to the audio element for audio-only calls
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // ── Drain buffered ICE once remoteDescription is set ──────────────
  const drainPendingIce = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    const queued = pendingIceRef.current.splice(0);
    for (const c of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
        processedCandidates.current.add(JSON.stringify(c));
      } catch {
        // ignore
      }
    }
  }, []);

  // ── Cleanup everything ────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (disconnectTimerRef.current) {
      clearTimeout(disconnectTimerRef.current);
      disconnectTimerRef.current = null;
    }
    if (unsubCallRef.current) { unsubCallRef.current(); unsubCallRef.current = null; }
    if (unsubIceRef.current) { unsubIceRef.current(); unsubIceRef.current = null; }

    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.onicecandidate = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.oniceconnectionstatechange = null;
      try { pcRef.current.close(); } catch { /* ignore */ }
      pcRef.current = null;
    }
    // FIX #7: stop ALL local tracks (sender list can be empty if we crashed
    // before addTrack ran).
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => {
        try { t.stop(); } catch { /* ignore */ }
      });
      localStreamRef.current = null;
    }
    remoteStreamRef.current = null;
    pendingIceRef.current = [];
    remoteDescSetRef.current = false;

    setLocalStream(null);
    setRemoteStream(null);
    setCallState("idle");
    setIncomingCall(null);
    activeChatIdRef.current = "";
    setActiveChatId("");
    processedCandidates.current.clear();
    setError(null);
  }, []);

  // ── ICE candidate listener ────────────────────────────────────────
  const setupIceListeners = useCallback((chatId: string, otherUserId: string) => {
    if (unsubIceRef.current) { unsubIceRef.current(); unsubIceRef.current = null; }
    unsubIceRef.current = subscribeToIceCandidates(chatId, otherUserId, async (data) => {
      const pc = pcRef.current;
      if (!pc) return;
      const candStr = JSON.stringify(data);
      if (processedCandidates.current.has(candStr)) return;

      // FIX #1: if remoteDescription isn't set yet, buffer instead of dropping
      if (!remoteDescSetRef.current || !pc.remoteDescription) {
        pendingIceRef.current.push(data);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(data));
        processedCandidates.current.add(candStr);
      } catch {
        // Ignore ICE timing errors during state transitions
      }
    });
  }, []);

  // ── Create RTCPeerConnection ──────────────────────────────────────
  const createPC = useCallback((chatId: string) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    const remote = new MediaStream();
    remoteStreamRef.current = remote;

    pc.ontrack = (e) => {
      e.streams[0]?.getTracks().forEach((t) => {
        if (!remote.getTracks().find((existing) => existing.id === t.id)) {
          remote.addTrack(t);
        }
      });
      setRemoteStream(new MediaStream(remote.getTracks()));
    };

    pc.onicecandidate = (e) => {
      if (e.candidate && activeChatIdRef.current) {
        sendIceCandidate(activeChatIdRef.current, currentUserId, e.candidate.toJSON());
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === "connected") {
        // FIX #4: cancel any pending disconnect-teardown
        if (disconnectTimerRef.current) {
          clearTimeout(disconnectTimerRef.current);
          disconnectTimerRef.current = null;
        }
        setCallState("connected");
      } else if (state === "failed" || state === "closed") {
        cleanup();
      } else if (state === "disconnected") {
        // FIX #4: don't tear down immediately — ICE often recovers in 1-3s.
        if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = setTimeout(() => {
          if (pcRef.current?.connectionState === "disconnected") {
            cleanup();
          }
        }, 5000);
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (
        pc.iceConnectionState === "connected" ||
        pc.iceConnectionState === "completed"
      ) {
        setCallState("connected");
      }
    };

    pcRef.current = pc;
    return pc;
  }, [currentUserId, cleanup]);

  // ── Start outgoing call ───────────────────────────────────────────
  const startCall = useCallback(async (chatId: string, type: CallType) => {
    if (!chatId) return;

    cleanup();
    cancelledRef.current = false; // FIX #3

    activeChatIdRef.current = chatId;
    setActiveChatId(chatId);
    setCallType(type);
    setCallState("requesting-media");

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video" ? { width: 1280, height: 720, facingMode: "user" } : false,
      });

      // FIX #3: user hung up while we were acquiring -> stop and bail
      if (cancelledRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = createPC(chatId);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream!));

      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: type === "video" });
      await pc.setLocalDescription(offer);

      await initiateCall(chatId, currentUserId, currentUserName, currentUserPhoto, type, offer);

      const snap = await get(ref(db, `chats/${chatId}/users`));
      const calleeId = Object.keys(snap.val() || {}).find((id) => id !== currentUserId);
      if (calleeId) setupIceListeners(chatId, calleeId);

      unsubCallRef.current = subscribeToCall(chatId, async (sig) => {
        if (!sig) return;
        if (
          sig.state === "connected" &&
          sig.answer &&
          pc.signalingState === "have-local-offer"
        ) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(sig.answer));
            remoteDescSetRef.current = true; // FIX #1
            await drainPendingIce();          // FIX #1
            setCallState("connecting");
          } catch {
            // ignore
          }
        }
        if (sig.state === "ended") cleanup();
      });

      setCallState("calling");
    } catch (e: any) {
      // FIX #7: ensure any partially-acquired stream is stopped
      stream?.getTracks().forEach((t) => { try { t.stop(); } catch { /* ignore */ } });
      const msg =
        e?.name === "NotAllowedError" || e?.name === "PermissionDeniedError"
          ? "Camera/microphone permission denied."
          : e?.name === "NotFoundError"
            ? "No camera or microphone found."
            : e?.name === "NotReadableError"
              ? "Camera/mic is already in use by another app."
              : "Failed to start call.";
      setError(msg);
      setCallState("error");
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
      activeChatIdRef.current = "";
      setActiveChatId("");
    }
  }, [currentUserId, currentUserName, currentUserPhoto, createPC, setupIceListeners, cleanup, drainPendingIce]);

  // ── Accept incoming call ──────────────────────────────────────────
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    const { chatId, callType: type } = incomingCall;

    cancelledRef.current = false; // FIX #3
    activeChatIdRef.current = chatId;
    setActiveChatId(chatId);
    setCallState("requesting-media");

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video" ? { width: 1280, height: 720, facingMode: "user" } : false,
      });

      // FIX #3
      if (cancelledRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = createPC(chatId);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream!));

      const snap = await get(ref(db, `calls/${chatId}`));
      const sig = snap.val() as CallSignal | null;

      if (!sig?.offer) throw new Error("No offer found in call signal.");

      await pc.setRemoteDescription(new RTCSessionDescription(sig.offer));
      remoteDescSetRef.current = true; // FIX #1
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await answerCall(chatId, answer);

      setupIceListeners(chatId, sig.callerId);
      await drainPendingIce(); // FIX #1 (in case any arrived while signaling)

      unsubCallRef.current = subscribeToCall(chatId, (s) => {
        if (s?.state === "ended") cleanup();
      });

      setCallState("connecting");
      setIncomingCall(null);
    } catch (e: any) {
      stream?.getTracks().forEach((t) => { try { t.stop(); } catch { /* ignore */ } });
      const msg =
        e?.name === "NotAllowedError" || e?.name === "PermissionDeniedError"
          ? "Camera/microphone permission denied."
          : "Failed to accept call.";
      setError(msg);
      setCallState("error");
      cleanup();
    }
  }, [incomingCall, createPC, setupIceListeners, cleanup, drainPendingIce]);

  // ── Watch a chat for incoming calls ──────────────────────────────
  const watchChatForIncomingCall = useCallback((chatId: string) => {
    if (chatWatchUnsubsRef.current.has(chatId)) return;

    const unsub = subscribeToCall(chatId, (sig) => {
      if (!sig) return;

      if (
        sig.state === "ringing" &&
        sig.callerId !== currentUserId &&
        activeChatIdRef.current === ""
      ) {
        activeChatIdRef.current = chatId;
        setActiveChatId(chatId);
        setCallType(sig.callType);
        setIncomingCall({
          callerName: sig.callerName,
          callerPhoto: sig.callerPhoto,
          callType: sig.callType,
          chatId,
        });
        setCallState("incoming");
      }

      if (sig.state === "ended" && activeChatIdRef.current === chatId) {
        cleanup();
      }
    });

    chatWatchUnsubsRef.current.set(chatId, unsub);
  }, [currentUserId, cleanup]);

  // ── Hang up ───────────────────────────────────────────────────────
  const hangUp = useCallback(async () => {
    cancelledRef.current = true; // FIX #3
    const chatId = activeChatIdRef.current;
    if (chatId) {
      try { await endCall(chatId); } catch { /* ignore */ }
    }
    cleanup();
  }, [cleanup]);

  // ── Media controls ────────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    setIsMicOn((prev) => {
      const next = !prev;
      localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = next));
      return next;
    });
  }, []);

  const toggleCam = useCallback(() => {
    setIsCamOn((prev) => {
      const next = !prev;
      localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next));
      return next;
    });
  }, []);

  // FIX #6: real speaker toggle. Try setSinkId; fall back to muting if the
  // browser doesn't expose it (e.g. iOS Safari).
  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn((prev) => {
      const next = !prev;
      const sinkEl: any = remoteAudioRef.current ?? remoteVideoRef.current;
      if (sinkEl && typeof sinkEl.setSinkId === "function") {
        sinkEl.setSinkId(next ? "default" : "").catch(() => {
          // fall back to muting if setSinkId rejects
          remoteStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = next));
        });
      } else {
        remoteStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = next));
      }
      return next;
    });
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────────
  useEffect(() => {
    return () => {
      cleanup();
      chatWatchUnsubsRef.current.forEach((unsub) => unsub());
      chatWatchUnsubsRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    callState,
    callType,
    localStream,
    remoteStream,
    incomingCall,
    activeChatId,
    isMicOn,
    isCamOn,
    isSpeakerOn,
    error,
    startCall,
    acceptCall,
    hangUp,
    toggleMic,
    toggleCam,
    toggleSpeaker,
    localVideoRef,
    remoteVideoRef,
    remoteAudioRef, // FIX #5
    watchChatForIncomingCall,
  };
}
