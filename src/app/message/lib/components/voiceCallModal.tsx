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
  Phone,
} from "lucide-react";
import type { UseWebRTCReturn } from "../hooks/useWebRTC";

interface VideoCallModalProps {
  webRTC: UseWebRTCReturn;
  calleeName: string;
  calleePhoto?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

// ─── Timer ────────────────────────────────────────────────────────
function useTimer(running: boolean) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!running) {
      setSecs(0);
      return;
    }
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

// ─── Avatar / Initials ────────────────────────────────────────────
function CalleeAvatar({
  name,
  photo,
  size = 88,
  pulse = false,
}: {
  name: string;
  photo?: string | null;
  size?: number;
  pulse?: boolean;
}) {
  const letters = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {pulse && (
        <>
          <span
            className="absolute inset-0 rounded-full border border-indigo-400/25 animate-ping"
            style={{ animationDuration: "1.8s" }}
          />
          <span
            className="absolute inset-0 rounded-full border border-indigo-400/15 animate-ping"
            style={{ animationDuration: "1.8s", animationDelay: "0.5s" }}
          />
        </>
      )}
      {photo ? (
        <img
          src={photo}
          alt={name}
          className="rounded-full object-cover relative z-10"
          style={{
            width: size,
            height: size,
            boxShadow: "0 0 0 3px rgba(99,102,241,0.35)",
          }}
        />
      ) : (
        <div
          className="rounded-full flex items-center justify-center text-white font-semibold relative z-10"
          style={{
            width: size,
            height: size,
            fontSize: size * 0.32,
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            boxShadow: "0 0 0 3px rgba(99,102,241,0.35)",
          }}
        >
          {letters}
        </div>
      )}
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
  size = "md",
}: {
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  label?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const btnSize =
    size === "lg"
      ? "w-16 h-16"
      : size === "sm"
        ? "w-10 h-10"
        : "w-12 h-12";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={onClick}
        className={[
          "flex items-center justify-center rounded-full transition-all duration-150 focus:outline-none active:scale-95",
          btnSize,
          danger
            ? "bg-red-500 hover:bg-red-600 text-white"
            : active
              ? "bg-white/[0.14] hover:bg-white/[0.22] text-white"
              : "bg-white/[0.05] hover:bg-white/[0.1] text-white/40",
        ].join(" ")}
        style={danger ? { boxShadow: "0 4px 20px rgba(239,68,68,0.45)" } : undefined}
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

// ─── Audio waveform animation ─────────────────────────────────────
function AudioWave() {
  return (
    <div className="flex items-end gap-[3px] h-5">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-indigo-400/60"
          style={{
            height: "100%",
            animation: `audioBar 0.9s ease-in-out ${i * 0.08}s infinite alternate`,
            minHeight: 3,
          }}
        />
      ))}
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
  const [isMobile, setIsMobile] = useState(false);
  const timer = useTimer(callState === "connected");

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Animate in/out
  useEffect(() => {
    if (isOpen) requestAnimationFrame(() => setVisible(true));
    else setVisible(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const isVideo = callType === "video";
  const isCalling = callState === "calling";
  const isConnected = callState === "connected" || callState === "connecting";
  const isRequestingMedia = callState === "requesting-media";
  const hasRemoteVideo = isConnected && !!remoteStream && isVideo;

  const statusLabel = () => {
    if (error) return `Error: ${error}`;
    switch (callState) {
      case "requesting-media": return "Starting…";
      case "calling": return "Calling…";
      case "connecting": return "Connecting…";
      case "connected": return timer;
      default: return "";
    }
  };

  const handleEnd = async () => {
    await hangUp();
    onClose();
  };

  // ── Shared control bar ────────────────────────────────────────
  const Controls = () => (
    <div
      className={[
        "flex items-center justify-between flex-shrink-0",
        isMobile
          ? "px-8 pt-4 pb-10"
          : "px-7 pt-4 pb-7",
      ].join(" ")}
      style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)" }}
    >
      <CtrlButton onClick={toggleMic} active={isMicOn} label={isMicOn ? "Mute" : "Unmute"}>
        {isMicOn
          ? <Mic className="w-[18px] h-[18px]" />
          : <MicOff className="w-[18px] h-[18px]" />}
      </CtrlButton>

      {isVideo && (
        <CtrlButton onClick={toggleCam} active={isCamOn} label={isCamOn ? "Camera" : "Off"}>
          {isCamOn
            ? <Video className="w-[18px] h-[18px]" />
            : <VideoOff className="w-[18px] h-[18px]" />}
        </CtrlButton>
      )}

      <CtrlButton onClick={handleEnd} danger size="lg" label="End">
        <PhoneOff className="w-6 h-6" />
      </CtrlButton>

      <CtrlButton onClick={toggleSpeaker} active={isSpeakerOn} label="Speaker">
        {isSpeakerOn
          ? <Volume2 className="w-[18px] h-[18px]" />
          : <VolumeX className="w-[18px] h-[18px]" />}
      </CtrlButton>

      <CtrlButton onClick={() => {}} label="More">
        <MoreHorizontal className="w-[18px] h-[18px]" />
      </CtrlButton>
    </div>
  );

  // ── VIDEO CALL LAYOUT ─────────────────────────────────────────
  if (isVideo) {
    return (
      <div
        className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center"
        style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}
      >
        {/* Backdrop — only on desktop */}
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-xl hidden md:block transition-opacity duration-300"
          style={{ opacity: visible ? 1 : 0 }}
        />

        {/* Mobile: full screen black bg */}
        <div
          className="absolute inset-0 bg-[#08080f] md:hidden"
          style={{ opacity: visible ? 1 : 0, transition: "opacity 0.3s" }}
        />

        {/* Card — fullscreen on mobile, modal on desktop */}
        <div
          className={[
            "relative z-10 flex flex-col overflow-hidden transition-all duration-300",
            // Mobile: true fullscreen
            "w-full h-full md:h-auto",
            // Desktop: constrained modal
            "md:w-[380px] md:max-w-[90vw] md:rounded-[28px]",
            "rounded-none",
          ].join(" ")}
          style={{
            background: "linear-gradient(160deg,#0d0d1f 0%,#08080f 100%)",
            border: isMobile ? "none" : "0.5px solid rgba(255,255,255,0.08)",
            boxShadow: isMobile ? "none" : "0 48px 96px rgba(0,0,0,0.9)",
            transform: visible
              ? "translateY(0) scale(1)"
              : isMobile
                ? "translateY(100%)"
                : "translateY(20px) scale(0.96)",
            opacity: visible ? 1 : 0,
            transition: "transform 0.38s cubic-bezier(0.16,1,0.3,1), opacity 0.28s ease",
          }}
        >
          {/* Top accent */}
          <div
            className="h-px w-full flex-shrink-0 hidden md:block"
            style={{ background: "linear-gradient(90deg,transparent,rgba(99,102,241,0.55),transparent)" }}
          />

          {/* Video area */}
          <div
            className="relative flex-1 overflow-hidden bg-[#08080f] md:flex-none"
            style={{ minHeight: isMobile ? 0 : 260 }}
          >
            {/* Remote video */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              style={{ display: hasRemoteVideo ? "block" : "none" }}
            />

            {/* Placeholder while waiting */}
            {!hasRemoteVideo && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
                <CalleeAvatar
                  name={calleeName}
                  photo={calleePhoto}
                  size={isMobile ? 112 : 88}
                  pulse={isCalling || isRequestingMedia}
                />
                <div className="text-center">
                  <p className="text-white/90 font-semibold text-lg tracking-tight">{calleeName}</p>
                  <p className="text-white/35 text-xs mt-1">{statusLabel()}</p>
                </div>
              </div>
            )}

            {/* Bottom gradient overlay */}
            <div
              className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
              style={{ background: "linear-gradient(to top,rgba(8,8,15,0.95),transparent)" }}
            />

            {/* Connected timer */}
            {isConnected && hasRemoteVideo && (
              <div
                className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
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

            {/* Name overlay when video is active */}
            {hasRemoteVideo && (
              <div className="absolute bottom-4 left-4">
                <p className="text-white/85 font-semibold text-sm">{calleeName}</p>
              </div>
            )}

            {/* Local PiP */}
            <div
              className="absolute bottom-4 right-4 rounded-2xl overflow-hidden"
              style={{
                width: isMobile ? 90 : 80,
                height: isMobile ? 120 : 108,
                border: "1.5px solid rgba(255,255,255,0.15)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
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
          </div>

          {/* Controls */}
          <Controls />
        </div>

        <style>{`
          @keyframes audioBar {
            from { transform: scaleY(0.15); }
            to   { transform: scaleY(1); }
          }
        `}</style>
      </div>
    );
  }

  // ── AUDIO-ONLY CALL LAYOUT ────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center"
      style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}
    >
      {/* Backdrop — desktop only */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-2xl hidden md:block transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      />

      {/* Mobile full-screen bg */}
      <div
        className="absolute inset-0 md:hidden"
        style={{
          background: "linear-gradient(160deg,#0d0d1f 0%,#08080f 100%)",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.3s",
        }}
      />

      {/* Decorative background glow — mobile only */}
      <div className="absolute inset-0 md:hidden pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: 300,
            height: 300,
            background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Card */}
      <div
        className={[
          "relative z-10 flex flex-col overflow-hidden transition-all duration-300",
          // Mobile: full screen
          "w-full h-full md:h-auto",
          // Desktop: compact modal
          "md:w-[360px] md:max-w-[90vw] md:rounded-[28px]",
          "rounded-none",
        ].join(" ")}
        style={{
          background: "linear-gradient(160deg,#0d0d1f 0%,#0a0a18 100%)",
          border: isMobile ? "none" : "0.5px solid rgba(255,255,255,0.08)",
          boxShadow: isMobile ? "none" : "0 48px 96px rgba(0,0,0,0.85), inset 0 0 0 0.5px rgba(255,255,255,0.04)",
          transform: visible
            ? "translateY(0) scale(1)"
            : isMobile
              ? "translateY(100%)"
              : "translateY(20px) scale(0.96)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.38s cubic-bezier(0.16,1,0.3,1), opacity 0.28s ease",
        }}
      >
        {/* Top accent line — desktop */}
        <div
          className="h-px w-full flex-shrink-0 hidden md:block"
          style={{ background: "linear-gradient(90deg,transparent,rgba(99,102,241,0.55),transparent)" }}
        />

        {/* Content area — centered */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 gap-8">
          {/* Phone icon badge */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
            style={{
              background: "rgba(99,102,241,0.15)",
              border: "0.5px solid rgba(99,102,241,0.3)",
            }}
          >
            <Phone className="w-4 h-4 text-indigo-400" />
          </div>

          {/* Profile picture / initials — large */}
          <CalleeAvatar
            name={calleeName}
            photo={calleePhoto}
            size={isMobile ? 128 : 104}
            pulse={isCalling || isRequestingMedia}
          />

          {/* Name & status */}
          <div className="text-center space-y-2">
            <p
              className="text-white/92 font-semibold tracking-tight"
              style={{ fontSize: isMobile ? 24 : 20, letterSpacing: "-0.025em" }}
            >
              {calleeName}
            </p>
            <p className="text-sm text-white/35 font-medium">{statusLabel()}</p>

            {/* Audio wave when connected */}
            {isConnected && (
              <div className="flex justify-center pt-1">
                <AudioWave />
              </div>
            )}
          </div>

          {/* Call quality indicator when connected */}
          {isConnected && (
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                background: "rgba(16,185,129,0.08)",
                border: "0.5px solid rgba(16,185,129,0.2)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-emerald-400/80 font-medium">Connected · {timer}</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <Controls />
      </div>

      <style>{`
        @keyframes audioBar {
          from { transform: scaleY(0.12); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}