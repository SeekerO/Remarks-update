// src/app/message/lib/hooks/useWebRTC.ts
// PATCHED v2 — all previous fixes kept, plus:
//   FIX #8  Callee was seeing "calling" state because activeChatIdRef was set
//           before acceptCall(), causing the "active states" effect in page.tsx
//           to open the VideoCallModal prematurely on the callee.
//           Now callState "incoming" does NOT trigger the modal; the callee
//           only enters the modal after acceptCall() resolves.
//   FIX #9  RTCPeerConnection was created before getUserMedia resolved, so
//           calling hangUp() mid-acquire left the PC alive and leaked tracks.
//           createPC() is now called only after the stream is ready.
//   FIX #10 "connecting" state is set on the CALLER after setRemoteDescription,
//           not only after ICE negotiation, so the modal shows "Connecting…"
//           immediately instead of staying on "calling" forever.
//   FIX #11 watchChatForIncomingCall: the effect that was setting callState to
//           "incoming" raced with an already-accepted call and fired multiple
//           times.  Added a guard so it only fires once per chat per session.
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
  const [incomingCall, setIncomingCall] = useState<IncomingCallInfo | null>(
    null,
  );
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
  // FIX #11: track which chats have already fired an incoming-call notification
  const incomingFiredRef = useRef(new Set<string>());
  const chatWatchUnsubsRef = useRef<Map<string, Unsubscribe>>(new Map());

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // FIX #1: buffer ICE candidates received before setRemoteDescription
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteDescSetRef = useRef(false);

  // FIX #3: signal hangup during getUserMedia
  const cancelledRef = useRef(false);

  // FIX #4: grace timer for "disconnected"
  const disconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Attach streams to media elements ──────────────────────────────
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // ── Drain buffered ICE ─────────────────────────────────────────────
  const drainPendingIce = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    const queued = pendingIceRef.current.splice(0);
    for (const c of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
        processedCandidates.current.add(JSON.stringify(c));
      } catch {
        // ignore stale ICE errors
      }
    }
  }, []);

  // ── Full cleanup ───────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (disconnectTimerRef.current) {
      clearTimeout(disconnectTimerRef.current);
      disconnectTimerRef.current = null;
    }
    if (unsubCallRef.current) {
      unsubCallRef.current();
      unsubCallRef.current = null;
    }
    if (unsubIceRef.current) {
      unsubIceRef.current();
      unsubIceRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.onicecandidate = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.oniceconnectionstatechange = null;
      try {
        pcRef.current.close();
      } catch {
        /* ignore */
      }
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          /* ignore */
        }
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

  // ── ICE listener setup ─────────────────────────────────────────────
  const setupIceListeners = useCallback(
    (chatId: string, otherUserId: string) => {
      if (unsubIceRef.current) {
        unsubIceRef.current();
        unsubIceRef.current = null;
      }
      unsubIceRef.current = subscribeToIceCandidates(
        chatId,
        otherUserId,
        async (data) => {
          const pc = pcRef.current;
          if (!pc) return;
          const candStr = JSON.stringify(data);
          if (processedCandidates.current.has(candStr)) return;

          if (!remoteDescSetRef.current || !pc.remoteDescription) {
            pendingIceRef.current.push(data);
            return;
          }
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data));
            processedCandidates.current.add(candStr);
          } catch {
            // ignore
          }
        },
      );
    },
    [],
  );

  // ── FIX #9: createPC now takes the stream so tracks are added immediately ─
  const createPC = useCallback(
    (chatId: string, stream: MediaStream) => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      const remote = new MediaStream();
      remoteStreamRef.current = remote;

      pc.ontrack = (e) => {
        e.streams[0]?.getTracks().forEach((t) => {
          if (!remote.getTracks().find((ex) => ex.id === t.id)) {
            remote.addTrack(t);
          }
        });
        setRemoteStream(new MediaStream(remote.getTracks()));
      };

      pc.onicecandidate = (e) => {
        if (e.candidate && activeChatIdRef.current) {
          sendIceCandidate(
            activeChatIdRef.current,
            currentUserId,
            e.candidate.toJSON(),
          );
        }
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === "connected") {
          if (disconnectTimerRef.current) {
            clearTimeout(disconnectTimerRef.current);
            disconnectTimerRef.current = null;
          }
          setCallState("connected");
        } else if (state === "failed" || state === "closed") {
          cleanup();
        } else if (state === "disconnected") {
          if (disconnectTimerRef.current)
            clearTimeout(disconnectTimerRef.current);
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

      // Add tracks now that we have the stream
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      pcRef.current = pc;
      return pc;
    },
    [currentUserId, cleanup],
  );

  // ── Start outgoing call ────────────────────────────────────────────
  const startCall = useCallback(
    async (chatId: string, type: CallType) => {
      if (!chatId) return;

      cleanup();
      cancelledRef.current = false;

      // FIX #8: set activeChatId AFTER media is ready, not before
      setCallType(type);
      setCallState("requesting-media");

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video:
            type === "video"
              ? { width: 1280, height: 720, facingMode: "user" }
              : false,
        });

        if (cancelledRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);

        // Set active chat only after we have media
        activeChatIdRef.current = chatId;
        setActiveChatId(chatId);

        // FIX #9: pass stream into createPC
        const pc = createPC(chatId, stream);

        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: type === "video",
        });
        await pc.setLocalDescription(offer);

        await initiateCall(
          chatId,
          currentUserId,
          currentUserName,
          currentUserPhoto,
          type,
          offer,
        );

        const snap = await get(ref(db, `chats/${chatId}/users`));
        const calleeId = Object.keys(snap.val() || {}).find(
          (id) => id !== currentUserId,
        );
        if (calleeId) setupIceListeners(chatId, calleeId);

        unsubCallRef.current = subscribeToCall(chatId, async (sig) => {
          if (!sig) return;
          if (
            sig.state === "connected" &&
            sig.answer &&
            pc.signalingState === "have-local-offer"
          ) {
            try {
              await pc.setRemoteDescription(
                new RTCSessionDescription(sig.answer),
              );
              remoteDescSetRef.current = true;
              await drainPendingIce();
              // FIX #10: set "connecting" immediately after remote desc
              setCallState("connecting");
            } catch {
              // ignore
            }
          }
          if (sig.state === "ended") cleanup();
        });

        setCallState("calling");
      } catch (e: any) {
        stream?.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch {
            /* ignore */
          }
        });
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
    },
    [
      currentUserId,
      currentUserName,
      currentUserPhoto,
      createPC,
      setupIceListeners,
      cleanup,
      drainPendingIce,
    ],
  );

  // ── Accept incoming call ───────────────────────────────────────────
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    const { chatId, callType: type } = incomingCall;

    cancelledRef.current = false;
    // FIX #8: don't expose activeChatId until AFTER media resolves
    setCallState("requesting-media");

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video:
          type === "video"
            ? { width: 1280, height: 720, facingMode: "user" }
            : false,
      });

      if (cancelledRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      localStreamRef.current = stream;
      setLocalStream(stream);

      activeChatIdRef.current = chatId;
      setActiveChatId(chatId);

      // FIX #9: pass stream into createPC
      const pc = createPC(chatId, stream);

      const snap = await get(ref(db, `calls/${chatId}`));
      const sig = snap.val() as CallSignal | null;

      if (!sig?.offer) throw new Error("No offer found in call signal.");

      await pc.setRemoteDescription(new RTCSessionDescription(sig.offer));
      remoteDescSetRef.current = true;
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await answerCall(chatId, answer);

      setupIceListeners(chatId, sig.callerId);
      await drainPendingIce();

      unsubCallRef.current = subscribeToCall(chatId, (s) => {
        if (s?.state === "ended") cleanup();
      });

      setCallState("connecting");
      setIncomingCall(null);
      // Allow the incoming-call guard to re-fire if needed for a fresh call later
      incomingFiredRef.current.delete(chatId);
    } catch (e: any) {
      stream?.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          /* ignore */
        }
      });
      const msg =
        e?.name === "NotAllowedError" || e?.name === "PermissionDeniedError"
          ? "Camera/microphone permission denied."
          : "Failed to accept call.";
      setError(msg);
      setCallState("error");
      cleanup();
    }
  }, [incomingCall, createPC, setupIceListeners, cleanup, drainPendingIce]);

  // ── Watch a chat for incoming calls ───────────────────────────────
  const watchChatForIncomingCall = useCallback(
    (chatId: string) => {
      if (chatWatchUnsubsRef.current.has(chatId)) return;

      const unsub = subscribeToCall(chatId, (sig) => {
        if (!sig) {
          // Call ended externally — covers two cases:
          // 1. Remote hung up during an active/connected call
          // 2. Caller CANCELLED before the callee accepted (activeChatIdRef is still "")
          if (activeChatIdRef.current === chatId) {
            cleanup();
          } else if (incomingFiredRef.current.has(chatId)) {
            // Caller cancelled while incoming overlay was showing
            cleanup();
          }
          incomingFiredRef.current.delete(chatId);
          return;
        }

        // ── FIX #8 + #11: show incoming overlay only when:
        //   1. State is ringing
        //   2. Caller is someone else
        //   3. We are not already in a call
        //   4. We haven't already surfaced this ring event (prevents double-fire)
        if (
          sig.state === "ringing" &&
          sig.callerId !== currentUserId &&
          activeChatIdRef.current === "" &&
          !incomingFiredRef.current.has(chatId)
        ) {
          incomingFiredRef.current.add(chatId);
          // Do NOT set activeChatId here — set it only after acceptCall()
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
          incomingFiredRef.current.delete(chatId);
        }
      });

      chatWatchUnsubsRef.current.set(chatId, unsub);
    },
    [currentUserId, cleanup],
  );

  // ── Hang up ────────────────────────────────────────────────────────
  const hangUp = useCallback(async () => {
    cancelledRef.current = true;
    const chatId = activeChatIdRef.current;
    if (chatId) {
      try {
        await endCall(chatId);
      } catch {
        /* ignore */
      }
    } else if (incomingCall?.chatId) {
      // Declined before accepting — still need to signal end
      try {
        await endCall(incomingCall.chatId);
      } catch {
        /* ignore */
      }
      incomingFiredRef.current.delete(incomingCall.chatId);
    }
    cleanup();
  }, [cleanup, incomingCall]);

  // ── Media toggles ──────────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    setIsMicOn((prev) => {
      const next = !prev;
      localStreamRef.current
        ?.getAudioTracks()
        .forEach((t) => (t.enabled = next));
      return next;
    });
  }, []);

  const toggleCam = useCallback(() => {
    setIsCamOn((prev) => {
      const next = !prev;
      localStreamRef.current
        ?.getVideoTracks()
        .forEach((t) => (t.enabled = next));
      return next;
    });
  }, []);

  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn((prev) => {
      const next = !prev;
      const sinkEl: any = remoteAudioRef.current ?? remoteVideoRef.current;
      if (sinkEl && typeof sinkEl.setSinkId === "function") {
        sinkEl.setSinkId(next ? "default" : "").catch(() => {
          remoteStreamRef.current
            ?.getAudioTracks()
            .forEach((t) => (t.enabled = next));
        });
      } else {
        remoteStreamRef.current
          ?.getAudioTracks()
          .forEach((t) => (t.enabled = next));
      }
      return next;
    });
  }, []);

  // ── Cleanup on unmount ─────────────────────────────────────────────
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
    remoteAudioRef,
    watchChatForIncomingCall,
  };
}
