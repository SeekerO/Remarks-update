"use client";

// src/app/message/lib/call/VideoCallModal.tsx

import React, { useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  MoreHorizontal,
} from "lucide-react";
import type { UseWebRTCReturn } from "../hooks/useWebRTC";

interface VideoCallModalProps {
  webRTC: UseWebRTCReturn;
  /** Name of the person on the other end */
  calleeName: string;
  calleePhoto?: string | null;
  isOpen: boolean;
  /** Called when the user dismisses/ends the call from the modal UI.
   *  The parent is responsible for calling webRTC.hangUp() — do NOT
   *  call it here to avoid the double-hangup loop. */
  onClose: () => void;
}

// ─── Timer ────────────────────────────────────────────────────────
function useTimer(running: boolean) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!running) { setSecs(0); return; }
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

// ─── Initials avatar ──────────────────────────────────────────────
function Initials({ name, size = 72, pulse = false }: { name: string; size?: number; pulse?: boolean }) {
  const letters = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {pulse && (
        <>
          <span className="absolute inset-0 rounded-full border border-indigo-400/25 animate-ping" style={{ animationDuration: "1.8s" }} />
          <span className="absolute inset-0 rounded-full border border-indigo-400/15 animate-ping" style={{ animationDuration: "1.8s", animationDelay: "0.5s" }} />
        </>
      )}
      <div
        className="rounded-full flex items-center justify-center text-white font-semibold relative z-10 overflow-hidden"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.32,
          background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
          boxShadow: "0 0 0 2.5px rgba(99,102,241,0.3)",
        }}
      >
        {letters}
      </div>
    </div>
  );
}

// ─── Control button ───────────────────────────────────────────────
function CtrlButton({
  onClick,
  active = true,
  danger = false,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={onClick}
        className={[
          "flex items-center justify-center rounded-full transition-all duration-150 focus:outline-none",
          danger
            ? "w-14 h-14 bg-red-500 hover:bg-red-600 text-white"
            : active
              ? "w-11 h-11 bg-white/[0.12] hover:bg-white/[0.2] text-white"
              : "w-11 h-11 bg-white/[0.04] hover:bg-white/[0.08] text-white/40",
        ].join(" ")}
        style={danger ? { boxShadow: "0 4px 18px rgba(239,68,68,0.4)" } : undefined}
      >
        {children}
      </button>
      {label && (
        <span className="text-[10px] text-white/35 font-medium tracking-wide select-none whitespace-nowrap">
          {label}
        </span>
      )}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────
export default function VideoCallModal({
  webRTC,
  calleeName,
  calleePhoto,
  isOpen,
  onClose,
}: VideoCallModalProps) {
  const {
    callState,
    callType,
    localStream,
    remoteStream,
    isMicOn,
    isCamOn,
    isSpeakerOn,
    error,
    hangUp,
    toggleMic,
    toggleCam,
    toggleSpeaker,
    localVideoRef,
    remoteVideoRef,
  } = webRTC;

  const [visible, setVisible] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const timer = useTimer(callState === "connected");

  // Animate in/out
  useEffect(() => {
    if (isOpen) requestAnimationFrame(() => setVisible(true));
    else { setVisible(false); setFullscreen(false); }
  }, [isOpen]);

  // NOTE: We deliberately do NOT call onClose() when callState becomes
  // "idle" or "ended" here. That caused a double-hangup loop because
  // onClose → hangUp → cleanup → callState="idle" → onClose again.
  // The parent (page.tsx) watches callState and closes the modal itself.

  if (!isOpen) return null;

  const isVideo = callType === "video";
  const isCalling = callState === "calling";
  const isConnected = callState === "connected" || callState === "connecting";
  const isRequestingMedia = callState === "requesting-media";
  const hasRemoteVideo = isConnected && !!remoteStream;

  const statusLabel = () => {
    if (error) return `Error: ${error}`;
    switch (callState) {
      case "requesting-media": return "Starting camera…";
      case "calling":          return "Calling…";
      case "connecting":       return "Connecting…";
      case "connected":        return timer;
      default:                 return "";
    }
  };

  const handleEnd = async () => {
    await hangUp();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-2xl transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      />

      {/* Modal card */}
      <div
        className={[
          "relative z-10 flex flex-col overflow-hidden transition-all duration-300",
          fullscreen ? "w-full h-full rounded-none" : "w-full max-w-[360px] mx-4 rounded-[28px]",
        ].join(" ")}
        style={{
          background: "linear-gradient(160deg,#0d0d1f 0%,#0a0a18 100%)",
          border: "0.5px solid rgba(255,255,255,0.08)",
          boxShadow: "0 48px 96px rgba(0,0,0,0.85), inset 0 0 0 0.5px rgba(255,255,255,0.04)",
          transform: visible ? "scale(1) translateY(0)" : "scale(0.96) translateY(14px)",
          opacity: visible ? 1 : 0,
        }}
      >
        {/* Top accent line */}
        <div
          className="h-px w-full flex-shrink-0"
          style={{ background: "linear-gradient(90deg,transparent,rgba(99,102,241,0.55),transparent)" }}
        />

        {/* ── Video area (only rendered for video calls) ── */}
        {isVideo && (
          <div
            className="relative flex-shrink-0 overflow-hidden bg-[#0b0b1c]"
            style={{ height: fullscreen ? "calc(100vh - 200px)" : 260 }}
          >
            {/* Remote video — always in DOM so the ref is stable, hidden until stream arrives */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              style={{ display: hasRemoteVideo ? "block" : "none" }}
            />

            {/* Placeholder avatar shown while waiting for remote stream */}
            {!hasRemoteVideo && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Initials name={calleeName} size={80} pulse={isCalling || isRequestingMedia} />
              </div>
            )}

            {/* Bottom gradient overlay */}
            <div
              className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
              style={{ background: "linear-gradient(to top,rgba(10,10,24,0.9),transparent)" }}
            />

            {/* Local PiP */}
            <div
              className="absolute bottom-3 right-3 rounded-xl overflow-hidden"
              style={{
                width: 80,
                height: 108,
                border: "1.5px solid rgba(255,255,255,0.12)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
              }}
            >
              {isCamOn && localStream ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />
              ) : (
                <div className="w-full h-full bg-white/[0.04] flex items-center justify-center">
                  <VideoOff className="w-4 h-4 text-white/20" />
                </div>
              )}
            </div>

            {/* Connected timer badge */}
            {isConnected && (
              <div
                className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{
                  background: "rgba(0,0,0,0.55)",
                  border: "0.5px solid rgba(255,255,255,0.1)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-mono text-white/65">{timer}</span>
              </div>
            )}

            {/* Fullscreen toggle */}
            <button
              onClick={() => setFullscreen((v) => !v)}
              className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
              style={{ background: "rgba(0,0,0,0.45)", border: "0.5px solid rgba(255,255,255,0.1)" }}
            >
              {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        {/* ── Info section ── */}
        <div className={["flex flex-col items-center text-center px-6", isVideo ? "py-4" : "py-10"].join(" ")}>
          {!isVideo && (
            <div className="mb-5">
              <Initials name={calleeName} size={88} pulse={isCalling || isRequestingMedia} />
            </div>
          )}
          <p
            className="text-white/90 font-semibold tracking-tight"
            style={{ fontSize: isVideo ? 15 : 21, letterSpacing: "-0.02em" }}
          >
            {calleeName}
          </p>
          <p className="text-[11px] text-white/35 font-medium mt-1 tracking-wide">
            {statusLabel()}
          </p>

          {/* Audio waveform for audio-only connected calls */}
          {!isVideo && isConnected && (
            <div className="flex items-end gap-0.5 mt-3 h-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full bg-indigo-400/70"
                  style={{
                    height: "100%",
                    animation: `audioBar 0.85s ease-in-out ${i * 0.1}s infinite alternate`,
                    minHeight: 3,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Controls ── */}
        <div
          className="flex items-center justify-between px-7 pt-3 pb-8 flex-shrink-0"
          style={{ borderTop: "0.5px solid rgba(255,255,255,0.05)" }}
        >
          <CtrlButton onClick={toggleMic} active={isMicOn} label={isMicOn ? "Mute" : "Unmuted"}>
            {isMicOn ? <Mic className="w-[17px] h-[17px]" /> : <MicOff className="w-[17px] h-[17px]" />}
          </CtrlButton>

          {isVideo && (
            <CtrlButton onClick={toggleCam} active={isCamOn} label={isCamOn ? "Camera" : "Off"}>
              {isCamOn ? <Video className="w-[17px] h-[17px]" /> : <VideoOff className="w-[17px] h-[17px]" />}
            </CtrlButton>
          )}

          <CtrlButton onClick={handleEnd} danger label="End">
            <PhoneOff className="w-5 h-5" />
          </CtrlButton>

          <CtrlButton onClick={toggleSpeaker} active={isSpeakerOn} label="Speaker">
            {isSpeakerOn ? <Volume2 className="w-[17px] h-[17px]" /> : <VolumeX className="w-[17px] h-[17px]" />}
          </CtrlButton>

          <CtrlButton onClick={() => {}} label="More">
            <MoreHorizontal className="w-[17px] h-[17px]" />
          </CtrlButton>
        </div>

        <style>{`
          @keyframes audioBar {
            from { transform: scaleY(0.12); }
            to   { transform: scaleY(1); }
          }
        `}</style>
      </div>
    </div>
  );
}