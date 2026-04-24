// src/app/message/lib/call/useWebRTC.ts
//
// Manages the full WebRTC lifecycle:
//   - getUserMedia (local stream)
//   - RTCPeerConnection setup + ICE handling
//   - Firebase signaling (offer / answer / ICE candidates)
//   - Call state machine

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ref, get } from "firebase/database";
import { db } from "@/lib/firebase/firebase";
import {
    initiateCall,
    answerCall,
    endCall,
    sendIceCandidate,
    subscribeToCall,
    subscribeToIceCandidates,
    type CallType,
    type CallState,
    type CallSignal,
} from "../call/callSignaling";

// ─── Public STUN servers (Google) ────────────────────────────────
const ICE_SERVERS: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
];

export type UseWebRTCCallState =
    | "idle"
    | "requesting-media"   // asking for getUserMedia permission
    | "calling"            // caller: offer sent, waiting for answer
    | "incoming"           // callee: offer received, waiting for user to accept
    | "connecting"         // ICE negotiation in progress
    | "connected"          // call live
    | "ended"              // call finished
    | "error";

export interface IncomingCallInfo {
    callerName: string;
    callerPhoto: string | null;
    callType: CallType;
    chatId: string;
}

interface UseWebRTCOptions {
    chatId: string;
    currentUserId: string;
    currentUserName: string;
    currentUserPhoto: string | null;
}

export interface UseWebRTCReturn {
    callState: UseWebRTCCallState;
    callType: CallType;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    incomingCall: IncomingCallInfo | null;
    isMicOn: boolean;
    isCamOn: boolean;
    isSpeakerOn: boolean;
    error: string | null;
    /** Caller initiates a video or audio call */
    startCall: (type: CallType) => Promise<void>;
    /** Callee accepts an incoming call */
    acceptCall: () => Promise<void>;
    /** Either side ends / declines the call */
    hangUp: () => Promise<void>;
    toggleMic: () => void;
    toggleCam: () => void;
    toggleSpeaker: () => void;
    localVideoRef: React.RefObject<HTMLVideoElement | null>;
    remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
}

export function useWebRTC({
    chatId,
    currentUserId,
    currentUserName,
    currentUserPhoto,
}: UseWebRTCOptions): UseWebRTCReturn {
    const [callState, setCallState] = useState<UseWebRTCCallState>("idle");
    const [callType, setCallType] = useState<CallType>("video");
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [incomingCall, setIncomingCall] = useState<IncomingCallInfo | null>(null);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCamOn, setIsCamOn] = useState(true);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const pcRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteStreamRef = useRef<MediaStream | null>(null);
    const unsubCallRef = useRef<(() => void) | null>(null);
    const unsubIceRef = useRef<(() => void) | null>(null);
    const isCallerRef = useRef(false);
    const callTypeRef = useRef<CallType>("video");
    const processedCandidatesRef = useRef<Set<string>>(new Set());

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    // ── Attach stream to video element ────────────────────────────
    const attachStream = useCallback(
        (el: HTMLVideoElement | null, stream: MediaStream | null) => {
            if (!el || !stream) return;
            el.srcObject = stream;
        },
        []
    );

    useEffect(() => {
        attachStream(localVideoRef.current, localStream);
    }, [localStream, attachStream]);

    useEffect(() => {
        attachStream(remoteVideoRef.current, remoteStream);
    }, [remoteStream, attachStream]);

    // ── Create & configure RTCPeerConnection ──────────────────────
    const createPeerConnection = useCallback((): RTCPeerConnection => {
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        // Remote tracks → remoteStream
        const remote = new MediaStream();
        remoteStreamRef.current = remote;
        setRemoteStream(remote);

        pc.ontrack = (event) => {
            event.streams[0]?.getTracks().forEach((track) => {
                remote.addTrack(track);
            });
        };

        // ICE candidates → Firebase
        pc.onicecandidate = async ({ candidate }) => {
            if (candidate) {
                try {
                    await sendIceCandidate(chatId, currentUserId, candidate.toJSON());
                } catch { /* ignore */ }
            }
        };

        pc.onconnectionstatechange = () => {
            const s = pc.connectionState;
            if (s === "connected") setCallState("connected");
            if (s === "disconnected" || s === "failed" || s === "closed") {
                cleanup();
            }
        };

        pc.oniceconnectionstatechange = () => {
            if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
                setCallState("connected");
            }
        };

        pcRef.current = pc;
        return pc;
    }, [chatId, currentUserId]);

    // ── Get local media ───────────────────────────────────────────
    const getLocalStream = useCallback(async (type: CallType): Promise<MediaStream> => {
        const constraints: MediaStreamConstraints = {
            audio: true,
            video: type === "video" ? { width: 1280, height: 720, facingMode: "user" } : false,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = stream;
        setLocalStream(stream);
        return stream;
    }, []);

    // ── Subscribe to ICE from the OTHER user ──────────────────────
    const subscribeToRemoteIce = useCallback(
        (otherUserId: string) => {
            if (unsubIceRef.current) unsubIceRef.current();
            unsubIceRef.current = subscribeToIceCandidates(
                chatId,
                otherUserId,
                async (candidate) => {
                    const key = JSON.stringify(candidate);
                    if (processedCandidatesRef.current.has(key)) return;
                    processedCandidatesRef.current.add(key);
                    if (pcRef.current && pcRef.current.remoteDescription) {
                        try {
                            await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                        } catch { /* ignore timing issues */ }
                    }
                }
            );
        },
        [chatId]
    );

    // ── Clean up everything ───────────────────────────────────────
    const cleanup = useCallback(() => {
        pcRef.current?.close();
        pcRef.current = null;
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
        setLocalStream(null);
        setRemoteStream(null);
        remoteStreamRef.current = null;
        processedCandidatesRef.current.clear();
        isCallerRef.current = false;
        if (unsubIceRef.current) { unsubIceRef.current(); unsubIceRef.current = null; }
        setCallState("idle");
        setIncomingCall(null);
        setError(null);
    }, []);

    const callerIdRef = useRef<string>("");

    // ── Subscribe to call document (detect incoming / state changes)
    useEffect(() => {
        if (!chatId || !currentUserId) return;

        const unsub = subscribeToCall(chatId, async (signal: CallSignal | null) => {
            if (!signal) {
                if (callState !== "idle") cleanup();
                return;
            }

            const { state, callerId, callerName, callerPhoto, callType: ct } = signal;
            callerIdRef.current = callerId;

            if (state === "ended") {
                cleanup();
                return;
            }

            // Callee: detect incoming call
            if (
                state === "ringing" &&
                callerId !== currentUserId &&
                callState === "idle"
            ) {
                setIncomingCall({ callerName, callerPhoto, callType: ct, chatId });
                setCallType(ct);
                callTypeRef.current = ct;
                setCallState("incoming");
                return;
            }

            // Caller: callee answered → set remote description + subscribe to callee's ICE
            if (
                state === "connected" &&
                isCallerRef.current &&
                signal.answer &&
                pcRef.current &&
                !pcRef.current.currentRemoteDescription
            ) {
                try {
                    await pcRef.current.setRemoteDescription(
                        new RTCSessionDescription(signal.answer)
                    );
                    // Now subscribe to callee's ICE candidates.
                    // Callee is anyone in this chat who is NOT the caller.
                    // We get the callee ID from the chat participants via Firebase.
                    const chatSnap = await get(ref(db, `chats/${chatId}/users`));
                    if (chatSnap.exists()) {
                        const uids = Object.keys(chatSnap.val());
                        const calleeId = uids.find((uid) => uid !== currentUserId);
                        if (calleeId) subscribeToRemoteIce(calleeId);
                    }
                    setCallState("connecting");
                } catch {
                    setError("Failed to set remote answer.");
                }
            }
        });

        unsubCallRef.current = unsub;
        return () => { unsub(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chatId, currentUserId]);

    // ── Start call (caller) ───────────────────────────────────────
    const startCall = useCallback(async (type: CallType) => {
        setError(null);
        setCallState("requesting-media");
        setCallType(type);
        callTypeRef.current = type;
        isCallerRef.current = true;

        try {
            const stream = await getLocalStream(type);
            const pc = createPeerConnection();

            stream.getTracks().forEach((track) => pc.addTrack(track, stream));

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
                offer
            );

            // Subscribe to callee's ICE candidates immediately
            const chatSnap = await get(ref(db, `chats/${chatId}/users`));
            if (chatSnap.exists()) {
                const uids = Object.keys(chatSnap.val());
                const calleeId = uids.find((uid) => uid !== currentUserId);
                if (calleeId) subscribeToRemoteIce(calleeId);
            }

            setCallState("calling");
        } catch (err: any) {
            setError(err.message || "Failed to start call.");
            setCallState("error");
            cleanup();
        }
    }, [chatId, currentUserId, currentUserName, currentUserPhoto, getLocalStream, createPeerConnection, subscribeToRemoteIce, cleanup]);

    // ── Accept call (callee) ──────────────────────────────────────
    const acceptCall = useCallback(async () => {
        if (!incomingCall) return;
        setError(null);
        setCallState("requesting-media");

        try {
            // Read current signal to get offer
            const { getCallSignal: getSignal } = await import("../call/callSignaling");
            const signal = await getSignal(chatId);
            if (!signal?.offer) throw new Error("No offer found.");

            const stream = await getLocalStream(signal.callType);
            const pc = createPeerConnection();

            // Add local tracks
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));

            // Set remote description (offer)
            await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));

            // Create answer
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            // Push answer to Firebase
            await answerCall(chatId, answer);

            // Subscribe to caller's ICE
            subscribeToRemoteIce(signal.callerId);

            setCallState("connecting");
            setIncomingCall(null);
        } catch (err: any) {
            setError(err.message || "Failed to accept call.");
            setCallState("error");
            cleanup();
        }
    }, [incomingCall, chatId, getLocalStream, createPeerConnection, subscribeToRemoteIce, cleanup]);

    // ── Hang up (either side) ─────────────────────────────────────
    const hangUp = useCallback(async () => {
        try { await endCall(chatId); } catch { /* ignore */ }
        cleanup();
    }, [chatId, cleanup]);

    // ── Media controls ────────────────────────────────────────────
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
            // Mute/unmute remote audio tracks
            remoteStreamRef.current
                ?.getAudioTracks()
                .forEach((t) => (t.enabled = next));
            return next;
        });
    }, []);

    // ── Cleanup on unmount ────────────────────────────────────────
    useEffect(() => {
        return () => {
            if (unsubCallRef.current) unsubCallRef.current();
            if (unsubIceRef.current) unsubIceRef.current();
            pcRef.current?.close();
            localStreamRef.current?.getTracks().forEach((t) => t.stop());
        };
    }, []);

    return {
        callState,
        callType,
        localStream,
        remoteStream,
        incomingCall,
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
    };
}