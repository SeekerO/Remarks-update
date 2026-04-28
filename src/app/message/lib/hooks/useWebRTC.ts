"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
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
  const incomingFiredRef = useRef(new Set<string>());
  const chatWatchUnsubsRef = useRef<Map<string, Unsubscribe>>(new Map());

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteDescSetRef = useRef(false);
  const cancelledRef = useRef(false);
  const disconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // FIX #13: timer to auto-reset "error" state back to "idle"
  const errorResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (errorResetTimerRef.current) {
      clearTimeout(errorResetTimerRef.current);
      errorResetTimerRef.current = null;
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

  // ── FIX #13: set error state then auto-reset to idle after 3s ─────
  const setErrorAndReset = useCallback((msg: string) => {
    setError(msg);
    setCallState("error");

    // Stop any media tracks still running
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
    setLocalStream(null);
    activeChatIdRef.current = "";
    setActiveChatId("");

    // Auto-reset to idle so user can retry
    if (errorResetTimerRef.current) clearTimeout(errorResetTimerRef.current);
    errorResetTimerRef.current = setTimeout(() => {
      setCallState("idle");
      setError(null);
    }, 3000);
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

  // ── createPC ───────────────────────────────────────────────────────
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

      setCallType(type);
      setCallState("requesting-media");

      let stream: MediaStream | null = null;
      try {
        // ── Step 1: acquire media ──────────────────────────────────
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

        // ── Step 2: set up peer connection ─────────────────────────
        const pc = createPC(chatId, stream);

        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: type === "video",
        });
        await pc.setLocalDescription(offer);

        // ── Step 3: FIX #14 — clear any stale Firebase call node ──
        // If a previous call was not cleaned up properly, initiateCall
        // will throw "Call already in progress". Silently wipe it first.
        try {
          await endCall(chatId);
        } catch {
          /* ignore — node may not exist */
        }

        // Small delay to let Firebase propagate the removal
        await new Promise((r) => setTimeout(r, 300));

        if (cancelledRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        // ── Step 4: signal the callee ──────────────────────────────
        await initiateCall(
          chatId,
          currentUserId,
          currentUserName,
          currentUserPhoto,
          type,
          offer,
        );

        // ── Step 5: watch for answer ───────────────────────────────
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
              setCallState("connecting");
            } catch {
              // ignore
            }
          }
          if (sig.state === "ended") cleanup();
        });

        setCallState("calling");
      } catch (e: any) {
        // Stop any tracks that got acquired
        stream?.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch {
            /* ignore */
          }
        });

        // ── FIX #12: surface the REAL error message ───────────────
        let msg: string;

        if (
          e?.name === "NotAllowedError" ||
          e?.name === "PermissionDeniedError"
        ) {
          msg =
            "Camera/microphone permission denied. Please allow access and try again.";
        } else if (e?.name === "NotFoundError") {
          msg = "No camera or microphone found on this device.";
        } else if (
          e?.name === "NotReadableError" ||
          e?.name === "TrackStartError"
        ) {
          msg = "Camera or mic is already in use by another app.";
        } else if (e?.name === "OverconstrainedError") {
          msg = "Camera doesn't support the requested resolution.";
        } else if (e?.message?.includes("Call already in progress")) {
          msg =
            "A call is already active in this chat. Please wait a moment and try again.";
        } else if (e?.message?.includes("aborted")) {
          msg = "Call was cancelled.";
        } else {
          // Surface the real message for easier debugging
          msg = e?.message
            ? `Call failed: ${e.message}`
            : "Failed to start call. Please try again.";
        }

        console.error("[useWebRTC] startCall error:", e?.name, e?.message, e);
        setErrorAndReset(msg);
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
      setErrorAndReset,
    ],
  );

  // ── Accept incoming call ───────────────────────────────────────────
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    const { chatId, callType: type } = incomingCall;

    // FIX #15: always reset cancelled flag before accepting
    cancelledRef.current = false;
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
      incomingFiredRef.current.delete(chatId);
    } catch (e: any) {
      stream?.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          /* ignore */
        }
      });

      let msg: string;
      if (
        e?.name === "NotAllowedError" ||
        e?.name === "PermissionDeniedError"
      ) {
        msg =
          "Camera/microphone permission denied. Please allow access and try again.";
      } else if (e?.name === "NotFoundError") {
        msg = "No camera or microphone found on this device.";
      } else if (e?.name === "NotReadableError") {
        msg = "Camera or mic is already in use by another app.";
      } else {
        msg = e?.message
          ? `Failed to accept call: ${e.message}`
          : "Failed to accept call. Please try again.";
      }

      console.error("[useWebRTC] acceptCall error:", e?.name, e?.message, e);
      setErrorAndReset(msg);
    }
  }, [
    incomingCall,
    createPC,
    setupIceListeners,
    cleanup,
    drainPendingIce,
    setErrorAndReset,
  ]);

  // ── Watch a chat for incoming calls ───────────────────────────────
  const watchChatForIncomingCall = useCallback(
    (chatId: string) => {
      if (chatWatchUnsubsRef.current.has(chatId)) return;

      const unsub = subscribeToCall(chatId, (sig) => {
        if (!sig) {
          if (activeChatIdRef.current === chatId) {
            cleanup();
          } else if (incomingFiredRef.current.has(chatId)) {
            cleanup();
          }
          incomingFiredRef.current.delete(chatId);
          return;
        }

        if (
          sig.state === "ringing" &&
          sig.callerId !== currentUserId &&
          activeChatIdRef.current === "" &&
          !incomingFiredRef.current.has(chatId)
        ) {
          incomingFiredRef.current.add(chatId);
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

  return useMemo(
    () => ({
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
    }),
    [
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
      watchChatForIncomingCall,
      // refs are stable — localVideoRef, remoteVideoRef, remoteAudioRef excluded intentionally
    ],
  );
}
