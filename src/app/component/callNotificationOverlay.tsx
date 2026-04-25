"use client";

// src/app/component/CallNotificationOverlay.tsx
// Global sidebar overlay for:
//  - Incoming call notifications (shown everywhere except the message page)
//  - Outgoing call status with 15-second ring timeout
//  - Online/offline awareness during calls

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { usePathname } from "next/navigation";
import { useWebRTC } from "@/app/message/lib/hooks/useWebRTC";
import { useCallRingtone } from "@/app/message/lib/hooks/useCallRingTone";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase/firebase";
import { useUserChats } from "@/app/message/lib/hooks/useUserChats";
import VideoCallModal from "@/app/message/lib/components/voiceCallModal";
import type { CallType } from "@/app/message/lib/call/callSignaling";
import {
  Phone,
  PhoneOff,
  PhoneMissed,
  Video,
  Wifi,
  WifiOff,
  Clock,
} from "lucide-react";

const RING_TIMEOUT_MS = 15_000; // 15 seconds

// ── Online status pill ────────────────────────────────────────────────────────
const OnlinePill = ({ isOnline }: { isOnline: boolean }) => (
  <span
    className={`flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${
      isOnline
        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
        : "bg-slate-500/15 border-slate-500/30 text-slate-400"
    }`}
  >
    {isOnline ? (
      <Wifi className="w-2.5 h-2.5" />
    ) : (
      <WifiOff className="w-2.5 h-2.5" />
    )}
    {isOnline ? "Online" : "Offline"}
  </span>
);

// ── Ring countdown bar ────────────────────────────────────────────────────────
const RingCountdown = ({
  durationMs,
  startedAt,
}: {
  durationMs: number;
  startedAt: number;
}) => {
  const [pct, setPct] = useState(100);

  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - startedAt;
      setPct(Math.max(0, 100 - (elapsed / durationMs) * 100));
    };
    tick();
    const id = setInterval(tick, 50);
    return () => clearInterval(id);
  }, [durationMs, startedAt]);

  return (
    <div className="h-0.5 w-full bg-white/[0.06] rounded-full overflow-hidden mt-2">
      <div
        className="h-full bg-indigo-400/60 rounded-full transition-none"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

// ── Avatar initials ───────────────────────────────────────────────────────────
const CallAvatar = ({
  name,
  photo,
  pulse,
  size = 44,
}: {
  name: string;
  photo?: string | null;
  pulse?: boolean;
  size?: number;
}) => {
  const letters = name
    .split(" ")
    .map((n) => n[0] || "")
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {pulse && (
        <>
          <span
            className="absolute inset-0 rounded-full border border-indigo-400/30 animate-ping"
            style={{ animationDuration: "1.6s" }}
          />
          <span
            className="absolute inset-0 rounded-full border border-indigo-400/15 animate-ping"
            style={{ animationDuration: "1.6s", animationDelay: "0.6s" }}
          />
        </>
      )}
      {photo ? (
        <img
          src={photo}
          alt={name}
          className="w-full h-full rounded-full object-cover relative z-10"
        />
      ) : (
        <div
          className="w-full h-full rounded-full flex items-center justify-center text-white font-bold relative z-10"
          style={{
            fontSize: size * 0.32,
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            boxShadow: "0 0 0 2px rgba(99,102,241,0.25)",
          }}
        >
          {letters}
        </div>
      )}
    </div>
  );
};

// ── EXPORTED CONTEXT so message/page.tsx can reach into this ─────────────────
export interface GlobalCallContextValue {
  startCall: (
    name: string,
    photo: string | null,
    chatId: string,
    type?: CallType
  ) => void;
  webRTC: ReturnType<typeof useWebRTC> | null;
}

export const GlobalCallContext =
  React.createContext<GlobalCallContextValue | null>(null);

// ── Main component ────────────────────────────────────────────────────────────
export default function CallNotificationOverlay({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const ringtone = useCallRingtone();

  // User details cache
  const [currentUserName, setCurrentUserName] = useState("You");
  const [currentUserPhoto, setCurrentUserPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onValue(ref(db, `users/${user.uid}`), (snap) => {
      const d = snap.val();
      if (d) {
        setCurrentUserName(d.name || d.displayName || d.email || "You");
        setCurrentUserPhoto(d.photoURL || null);
      }
    });
    return () => unsub();
  }, [user?.uid]);

  // ── WebRTC ────────────────────────────────────────────────────────────────
  const webRTC = useWebRTC({
    currentUserId: user?.uid || "",
    currentUserName,
    currentUserPhoto,
  });

  // ── Online status of callee ───────────────────────────────────────────────
  const [calleeOnline, setCalleeOnline] = useState<boolean | null>(null);
  const calleeUidRef = useRef<string | null>(null);

  // ── Ring timeout for outgoing calls ──────────────────────────────────────
  const ringTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ringStartedAtRef = useRef<number>(0);
  const [ringStartedAt, setRingStartedAt] = useState(0);

  // ── Call modal open state ─────────────────────────────────────────────────
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [calleeDisplayName, setCalleeDisplayName] = useState("User");
  const [calleeDisplayPhoto, setCalleeDisplayPhoto] = useState<string | null>(null);

  // ── Outgoing: callee info for display ────────────────────────────────────
  const [outgoingChatId, setOutgoingChatId] = useState("");

  // ── Watch all user chats for incoming calls ───────────────────────────────
  const userChats = useUserChats(user?.uid || "");
  useEffect(() => {
    if (!user?.uid || userChats.length === 0) return;
    userChats.forEach((chat) => {
      webRTC.watchChatForIncomingCall(chat.id);
    });
  }, [user?.uid, userChats, webRTC.watchChatForIncomingCall]);

  // ── Resolve callee online status when a call starts ──────────────────────
  const resolveCalleeOnline = useCallback(
    (chatId: string) => {
      if (!user?.uid || !chatId) return;
      const unsub = onValue(ref(db, `chats/${chatId}/users`), (snap) => {
        const users = snap.val() || {};
        const otherId = Object.keys(users).find((id) => id !== user.uid);
        calleeUidRef.current = otherId || null;

        if (otherId) {
          const presenceUnsub = onValue(
            ref(db, `presence/${otherId}`),
            (ps) => {
              setCalleeOnline(ps.val()?.online === true);
            }
          );
          // single read is enough for initial display — keep live for duration
          return presenceUnsub;
        }
      });
      return unsub;
    },
    [user?.uid]
  );

  // ── Clear ring timer helper ───────────────────────────────────────────────
  const clearRingTimer = useCallback(() => {
    if (ringTimerRef.current) {
      clearTimeout(ringTimerRef.current);
      ringTimerRef.current = null;
    }
  }, []);

  // ── Start outgoing call ───────────────────────────────────────────────────
  const startCall = useCallback(
    (
      name: string,
      photo: string | null,
      chatId: string,
      type: CallType = "video"
    ) => {
      if (webRTC.callState !== "idle") return;

      setCalleeDisplayName(name);
      setCalleeDisplayPhoto(photo);
      setOutgoingChatId(chatId);

      // Resolve callee online status
      resolveCalleeOnline(chatId);

      // Start WebRTC call
      webRTC.startCall(chatId, type);

      // Start 15-second ring timeout
      const now = Date.now();
      ringStartedAtRef.current = now;
      setRingStartedAt(now);

      clearRingTimer();
      ringTimerRef.current = setTimeout(async () => {
        // Auto hang-up after 15 seconds of ringing
        if (
          webRTC.callState === "calling" ||
          webRTC.callState === "requesting-media"
        ) {
          await webRTC.hangUp();
        }
        clearRingTimer();
      }, RING_TIMEOUT_MS);
    },
    [webRTC, resolveCalleeOnline, clearRingTimer]
  );

  // ── Ringtone logic based on call state + callee online status ─────────────
  useEffect(() => {
    const { callState } = webRTC;

    if (callState === "calling") {
      // Outgoing call — ring mode depends on whether callee is online
      if (calleeOnline === false) {
        ringtone.play("offline");
      } else {
        // online or unknown — play standard online ring
        ringtone.play("online");
      }
    } else if (callState === "incoming") {
      ringtone.play("incoming");
    } else {
      ringtone.stop();
    }

    // When connected or idle — stop all ringtones and clear timer
    if (
      callState === "connected" ||
      callState === "idle" ||
      callState === "ended"
    ) {
      ringtone.stop();
      clearRingTimer();
    }
  }, [webRTC.callState, calleeOnline, ringtone, clearRingTimer]);

  // ── Open modal for active states ──────────────────────────────────────────
  useEffect(() => {
    const activeStates = [
      "calling",
      "requesting-media",
      "connecting",
      "connected",
    ];
    if (activeStates.includes(webRTC.callState)) {
      setCallModalOpen(true);
    }
  }, [webRTC.callState]);

  // ── Close modal when terminal state ──────────────────────────────────────
  useEffect(() => {
    if (webRTC.callState === "idle" || webRTC.callState === "ended") {
      setCallModalOpen(false);
      setCalleeOnline(null);
      calleeUidRef.current = null;
      clearRingTimer();
    }
  }, [webRTC.callState, clearRingTimer]);

  const handleHangUp = useCallback(async () => {
    clearRingTimer();
    await webRTC.hangUp();
  }, [webRTC, clearRingTimer]);

  // ── Suppress incoming overlay if on message page (handled there) ──────────
  const isOnMessagePage = pathname.startsWith("/message");

  // ── Context value for child pages ─────────────────────────────────────────
  const contextValue: GlobalCallContextValue = {
    startCall,
    webRTC,
  };

  return (
    <GlobalCallContext.Provider value={contextValue}>
      {children}

      {/* ── Global call modal ─────────────────────────────────────── */}
      <VideoCallModal
        isOpen={callModalOpen}
        onClose={handleHangUp}
        webRTC={webRTC}
        calleeName={
          webRTC.incomingCall?.callerName || calleeDisplayName
        }
        calleePhoto={
          webRTC.incomingCall?.callerPhoto || calleeDisplayPhoto
        }
      />

      {/* ── Incoming call overlay (shown outside /message) ──────── */}
      {!isOnMessagePage &&
        webRTC.callState === "incoming" &&
        webRTC.incomingCall && (
          <IncomingCallToast
            callerName={webRTC.incomingCall.callerName}
            callerPhoto={webRTC.incomingCall.callerPhoto}
            callType={webRTC.incomingCall.callType}
            onAccept={async () => {
              await webRTC.acceptCall();
              setCallModalOpen(true);
            }}
            onDecline={handleHangUp}
          />
        )}

      {/* ── Outgoing call mini overlay (shown everywhere) ─────────── */}
      {(webRTC.callState === "calling" ||
        webRTC.callState === "requesting-media") && (
        <OutgoingCallToast
          calleeName={calleeDisplayName}
          calleePhoto={calleeDisplayPhoto}
          calleeOnline={calleeOnline}
          ringStartedAt={ringStartedAt}
          callState={webRTC.callState}
          onCancel={handleHangUp}
        />
      )}
    </GlobalCallContext.Provider>
  );
}

// ── Incoming call toast ───────────────────────────────────────────────────────
function IncomingCallToast({
  callerName,
  callerPhoto,
  callType,
  onAccept,
  onDecline,
}: {
  callerName: string;
  callerPhoto: string | null;
  callType: CallType;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div
      className="fixed top-4 right-4 z-[9998] pointer-events-none"
      aria-live="assertive"
    >
      <div
        className="pointer-events-auto"
        style={{
          transform: visible ? "translateX(0)" : "translateX(calc(100% + 24px))",
          opacity: visible ? 1 : 0,
          transition: "transform 0.42s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease",
        }}
      >
        <div
          className="w-[320px] flex flex-col gap-3 p-4 rounded-2xl"
          style={{
            background: "rgba(13,13,26,0.97)",
            border: "0.5px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(20px)",
            boxShadow:
              "0 24px 64px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(255,255,255,0.05)",
          }}
        >
          {/* Top accent */}
          <div
            className="h-px w-full rounded-full"
            style={{
              background:
                "linear-gradient(90deg,transparent,rgba(99,102,241,0.7),transparent)",
            }}
          />

          <div className="flex items-center gap-3">
            <CallAvatar
              name={callerName}
              photo={callerPhoto}
              pulse
              size={44}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white/85 truncate">
                {callerName}
              </p>
              <p className="text-[10px] text-indigo-300/70 mt-0.5 flex items-center gap-1">
                {callType === "video" ? (
                  <Video className="w-2.5 h-2.5" />
                ) : (
                  <Phone className="w-2.5 h-2.5" />
                )}
                Incoming {callType} call
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onDecline}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold
                bg-red-500/15 border border-red-500/25 text-red-400
                hover:bg-red-500/25 transition-colors"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              Decline
            </button>
            <button
              onClick={onAccept}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold
                bg-emerald-500/20 border border-emerald-500/30 text-emerald-400
                hover:bg-emerald-500/30 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Outgoing call toast ───────────────────────────────────────────────────────
function OutgoingCallToast({
  calleeName,
  calleePhoto,
  calleeOnline,
  ringStartedAt,
  callState,
  onCancel,
}: {
  calleeName: string;
  calleePhoto: string | null;
  calleeOnline: boolean | null;
  ringStartedAt: number;
  callState: string;
  onCancel: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(15);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    if (!ringStartedAt) return;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - ringStartedAt) / 1000);
      setSecondsLeft(Math.max(0, 15 - elapsed));
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [ringStartedAt]);

  const statusLabel =
    callState === "requesting-media" ? "Starting camera…" : "Calling…";

  return (
    <div className="fixed top-4 right-4 z-[9997] pointer-events-none">
      <div
        className="pointer-events-auto"
        style={{
          transform: visible ? "translateX(0)" : "translateX(calc(100% + 24px))",
          opacity: visible ? 1 : 0,
          transition:
            "transform 0.4s cubic-bezier(0.16,1,0.3,1), opacity 0.28s ease",
        }}
      >
        <div
          className="w-[300px] flex flex-col gap-3 p-4 rounded-2xl"
          style={{
            background: "rgba(13,13,26,0.97)",
            border: "0.5px solid rgba(255,255,255,0.09)",
            backdropFilter: "blur(20px)",
            boxShadow:
              "0 16px 48px rgba(0,0,0,0.65), 0 0 0 0.5px rgba(255,255,255,0.04)",
          }}
        >
          <div
            className="h-px w-full rounded-full"
            style={{
              background:
                "linear-gradient(90deg,transparent,rgba(99,102,241,0.5),transparent)",
            }}
          />

          <div className="flex items-center gap-3">
            <CallAvatar
              name={calleeName}
              photo={calleePhoto}
              pulse={callState === "calling"}
              size={40}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-white/85 truncate">
                  {calleeName}
                </p>
                {calleeOnline !== null && (
                  <OnlinePill isOnline={calleeOnline} />
                )}
              </div>
              <p className="text-[10px] text-white/40 mt-0.5">{statusLabel}</p>
            </div>
          </div>

          {/* Countdown */}
          {callState === "calling" && ringStartedAt > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-white/25 flex-shrink-0" />
              <div className="flex-1">
                <RingCountdown
                  durationMs={RING_TIMEOUT_MS}
                  startedAt={ringStartedAt}
                />
              </div>
              <span className="text-[9px] font-mono text-white/30 flex-shrink-0">
                {secondsLeft}s
              </span>
            </div>
          )}

          {/* Cancel */}
          <button
            onClick={onCancel}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold
              bg-red-500/12 border border-red-500/20 text-red-400
              hover:bg-red-500/22 transition-colors"
          >
            <PhoneMissed className="w-3.5 h-3.5" />
            Cancel Call
          </button>
        </div>
      </div>
    </div>
  );
}