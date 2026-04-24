// src/app/message/lib/hooks/useWebRTC.ts
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
    type CallSignal,
} from "../call/callSignaling";

const ICE_SERVERS: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
];

export type UseWebRTCCallState =
    | "idle"
    | "requesting-media"
    | "calling"
    | "incoming"
    | "connecting"
    | "connected"
    | "error";

export interface IncomingCallInfo {
    callerName: string;
    callerPhoto: string | null;
    callType: CallType;
    chatId: string;
}

interface UseWebRTCOptions {
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
    activeChatId: string;
    isMicOn: boolean;
    isCamOn: boolean;
    isSpeakerOn: boolean;
    error: string | null;
    /** Caller initiates a video or audio call. chatId must be passed directly to avoid stale state. */
    startCall: (chatId: string, type: CallType) => Promise<void>;
    /** Callee accepts the current incoming call */
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
    currentUserId,
    currentUserName,
    currentUserPhoto,
}: UseWebRTCOptions): UseWebRTCReturn {
    const [callState, setCallState] = useState<UseWebRTCCallState>("idle");
    const [callType, setCallType] = useState<CallType>("video");
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [incomingCall, setIncomingCall] = useState<IncomingCallInfo | null>(null);
    const [activeChatId, setActiveChatId] = useState<string>("");
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCamOn, setIsCamOn] = useState(true);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Refs — stable across renders, no stale closure issues
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteStreamRef = useRef<MediaStream | null>(null);
    const activeChatIdRef = useRef<string>("");   // single source of truth for current call chatId
    const isCallerRef = useRef(false);
    const callTypeRef = useRef<CallType>("video");
    const processedCandidatesRef = useRef<Set<string>>(new Set());
    const unsubCallRef = useRef<(() => void) | null>(null);
    const unsubIceRef = useRef<(() => void) | null>(null);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    // ── Attach stream to video element ────────────────────────────
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // ── Clean up everything ───────────────────────────────────────
    const cleanup = useCallback(() => {
        if (unsubCallRef.current) { unsubCallRef.current(); unsubCallRef.current = null; }
        if (unsubIceRef.current) { unsubIceRef.current(); unsubIceRef.current = null; }
        pcRef.current?.close();
        pcRef.current = null;
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
        setLocalStream(null);
        setRemoteStream(null);
        remoteStreamRef.current = null;
        processedCandidatesRef.current.clear();
        isCallerRef.current = false;
        activeChatIdRef.current = "";
        setActiveChatId("");
        setCallState("idle");
        setIncomingCall(null);
        setError(null);
    }, []);

    // ── Create & configure RTCPeerConnection ──────────────────────
    const createPeerConnection = useCallback((chatId: string): RTCPeerConnection => {
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        const remote = new MediaStream();
        remoteStreamRef.current = remote;
        setRemoteStream(remote);

        pc.ontrack = (event) => {
            event.streams[0]?.getTracks().forEach((track) => {
                remote.addTrack(track);
            });
        };

        pc.onicecandidate = async ({ candidate }) => {
            if (candidate && activeChatIdRef.current) {
                try {
                    await sendIceCandidate(activeChatIdRef.current, currentUserId, candidate.toJSON());
                } catch { /* ignore */ }
            }
        };

        pc.onconnectionstatechange = () => {
            const s = pc.connectionState;
            if (s === "connected") setCallState("connected");
            if (s === "disconnected" || s === "failed" || s === "closed") cleanup();
        };

        pc.oniceconnectionstatechange = () => {
            if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
                setCallState("connected");
            }
        };

        pcRef.current = pc;
        return pc;
    }, [currentUserId, cleanup]);

    // ── Get local media ───────────────────────────────────────────
    const getLocalStream = useCallback(async (type: CallType): Promise<MediaStream> => {
        const constraints: MediaStreamConstraints = {
            audio: true,
            video: type === "video"
                ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }
                : false,
        };

        // Check API availability first
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("Camera/microphone not supported in this browser or requires HTTPS.");
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = stream;
        setLocalStream(stream);
        return stream;
    }, []);

    // ── Subscribe to ICE from the other user ──────────────────────
    const subscribeToRemoteIce = useCallback((chatId: string, otherUserId: string) => {
        if (unsubIceRef.current) { unsubIceRef.current(); }
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
    }, []);

    // ── Subscribe to call document for a specific chatId ─────────
    const subscribeToCallForChat = useCallback((chatId: string) => {
        // Tear down any existing subscription first
        if (unsubCallRef.current) { unsubCallRef.current(); unsubCallRef.current = null; }

        const unsub = subscribeToCall(chatId, async (signal: CallSignal | null) => {
            if (!signal) {
                if (activeChatIdRef.current === chatId) cleanup();
                return;
            }

            const { state, callerId, callerName, callerPhoto, callType: ct } = signal;

            if (state === "ended") {
                if (activeChatIdRef.current === chatId) cleanup();
                return;
            }

            // Callee: incoming call detected
            if (state === "ringing" && callerId !== currentUserId && callState === "idle") {
                setIncomingCall({ callerName, callerPhoto, callType: ct, chatId });
                setCallType(ct);
                callTypeRef.current = ct;
                activeChatIdRef.current = chatId;
                setActiveChatId(chatId);
                setCallState("incoming");
                return;
            }

            // Caller: callee answered → set remote description
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
                    const chatSnap = await get(ref(db, `chats/${chatId}/users`));
                    if (chatSnap.exists()) {
                        const uids = Object.keys(chatSnap.val());
                        const calleeId = uids.find((uid) => uid !== currentUserId);
                        if (calleeId) subscribeToRemoteIce(chatId, calleeId);
                    }
                    setCallState("connecting");
                } catch {
                    setError("Failed to set remote answer.");
                }
            }
        });

        unsubCallRef.current = unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUserId, cleanup, subscribeToRemoteIce]);

    // ── Listen for incoming calls across all user chats ───────────
    // This is now handled externally via page.tsx watching Firebase
    // and calling startCall / the acceptCall flow.

    // ── Start call (caller) ───────────────────────────────────────
    const startCall = useCallback(async (chatId: string, type: CallType) => {
        // Guard: chatId must be a non-empty valid string
        if (!chatId || typeof chatId !== "string" || chatId.trim() === "") {
            console.error("[useWebRTC] startCall called with invalid chatId:", chatId);
            setError("Invalid chat — cannot start call.");
            return;
        }

        // Guard: don't double-start
        if (callState !== "idle") {
            console.warn("[useWebRTC] startCall ignored — already in state:", callState);
            return;
        }

        setError(null);
        setCallState("requesting-media");
        setCallType(type);
        callTypeRef.current = type;
        isCallerRef.current = true;
        activeChatIdRef.current = chatId;
        setActiveChatId(chatId);

        // Subscribe to this chat's call document BEFORE writing the offer
        subscribeToCallForChat(chatId);

        try {
            const stream = await getLocalStream(type);
            const pc = createPeerConnection(chatId);

            stream.getTracks().forEach((track) => pc.addTrack(track, stream));

            const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: type === "video",
            });
            await pc.setLocalDescription(offer);

            await initiateCall(chatId, currentUserId, currentUserName, currentUserPhoto, type, offer);

            // Subscribe to callee's ICE candidates
            const chatSnap = await get(ref(db, `chats/${chatId}/users`));
            if (chatSnap.exists()) {
                const uids = Object.keys(chatSnap.val());
                const calleeId = uids.find((uid) => uid !== currentUserId);
                if (calleeId) subscribeToRemoteIce(chatId, calleeId);
            }

            setCallState("calling");
        } catch (err: any) {
            console.error("[useWebRTC] startCall error:", err);

            // User-friendly error messages
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                setError("Camera/microphone permission denied. Please allow access and try again.");
            } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                setError("No camera or microphone found on this device.");
            } else if (err.name === "NotReadableError") {
                setError("Camera or microphone is already in use by another application.");
            } else {
                setError(err.message || "Failed to start call.");
            }

            setCallState("error");
            // Clean up partial state but don't full-cleanup (let user see error)
            localStreamRef.current?.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
            setLocalStream(null);
            isCallerRef.current = false;
            activeChatIdRef.current = "";
            setActiveChatId("");
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [callState, currentUserId, currentUserName, currentUserPhoto, getLocalStream, createPeerConnection, subscribeToRemoteIce, subscribeToCallForChat]);

    // ── Accept call (callee) ──────────────────────────────────────
    const acceptCall = useCallback(async () => {
        if (!incomingCall) return;
        const chatId = incomingCall.chatId;

        setError(null);
        setCallState("requesting-media");

        try {
            const { getCallSignal: getSignal } = await import("../call/callSignaling");
            const signal = await getSignal(chatId);
            if (!signal?.offer) throw new Error("No offer found.");

            const stream = await getLocalStream(signal.callType);
            const pc = createPeerConnection(chatId);

            stream.getTracks().forEach((track) => pc.addTrack(track, stream));

            await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await answerCall(chatId, answer);

            subscribeToRemoteIce(chatId, signal.callerId);

            setCallState("connecting");
            setIncomingCall(null);
        } catch (err: any) {
            console.error("[useWebRTC] acceptCall error:", err);
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                setError("Camera/microphone permission denied.");
            } else {
                setError(err.message || "Failed to accept call.");
            }
            setCallState("error");
            cleanup();
        }
    }, [incomingCall, getLocalStream, createPeerConnection, subscribeToRemoteIce, cleanup]);

    // ── Hang up (either side) ─────────────────────────────────────
    const hangUp = useCallback(async () => {
        const chatId = activeChatIdRef.current;
        if (chatId) {
            try { await endCall(chatId); } catch { /* ignore */ }
        }
        cleanup();
    }, [cleanup]);

    // ── Media controls ────────────────────────────────────────────
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

    const toggleSpeaker = useCallback(() => {
        setIsSpeakerOn((prev) => {
            const next = !prev;
            remoteStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = next));
            return next;
        });
    }, []);

    // ── Watch for incoming calls across ALL user chats ────────────
    // Subscribes to each chat's call node; page.tsx no longer needs to do this.
    const watchedChatsRef = useRef<Set<string>>(new Set());
    const chatWatchUnsubsRef = useRef<Map<string, () => void>>(new Map());

    const watchChatForIncomingCall = useCallback((chatId: string) => {
        if (watchedChatsRef.current.has(chatId)) return;
        watchedChatsRef.current.add(chatId);

        const unsub = subscribeToCall(chatId, (signal) => {
            if (!signal) return;
            if (
                signal.state === "ringing" &&
                signal.callerId !== currentUserId &&
                activeChatIdRef.current === "" // not already in a call
            ) {
                activeChatIdRef.current = chatId;
                setActiveChatId(chatId);
                setIncomingCall({
                    callerName: signal.callerName,
                    callerPhoto: signal.callerPhoto,
                    callType: signal.callType,
                    chatId,
                });
                setCallType(signal.callType);
                callTypeRef.current = signal.callType;
                setCallState("incoming");

                // Subscribe to this chat's full call document for state changes
                subscribeToCallForChat(chatId);
            }
        });

        chatWatchUnsubsRef.current.set(chatId, unsub);
    }, [currentUserId, subscribeToCallForChat]);

    // ── Cleanup on unmount ────────────────────────────────────────
    useEffect(() => {
        return () => {
            if (unsubCallRef.current) unsubCallRef.current();
            if (unsubIceRef.current) unsubIceRef.current();
            chatWatchUnsubsRef.current.forEach((u) => u());
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
        // Expose so page.tsx can register chats to watch
        _watchChatForIncomingCall: watchChatForIncomingCall,
    } as UseWebRTCReturn & { _watchChatForIncomingCall: (chatId: string) => void };
}