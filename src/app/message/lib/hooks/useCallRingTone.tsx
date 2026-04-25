// src/lib/hooks/useCallRingtone.ts
// Generates Web Audio API ringtones:
//   - "online"  : classic phone ring (dual-tone pattern)
//   - "offline" : busy/unavailable tone (monotone slow beep)
//   - "incoming": ascending chime pattern

"use client";

import { useRef, useCallback, useEffect } from "react";

type RingtoneMode = "online" | "offline" | "incoming";

export function useCallRingtone() {
  const ctxRef = useRef<AudioContext | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const activeRef = useRef(false);

  const getCtx = () => {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  };

  const stop = useCallback(() => {
    if (stopRef.current) {
      stopRef.current();
      stopRef.current = null;
    }
    activeRef.current = false;
  }, []);

  // ── Online ring: dual-tone DTMF-style ring (400Hz + 450Hz) ────────────────
  const playOnlineRing = useCallback((ctx: AudioContext): (() => void) => {
    let cancelled = false;
    const nodes: AudioNode[] = [];

    const ring = () => {
      if (cancelled) return;

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.connect(ctx.destination);

      const freqs = [400, 450];
      freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq;
        osc.connect(gainNode);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.8);
        nodes.push(osc);
      });

      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.75);

      // ring: 0.8s on, 4s off
      if (!cancelled) {
        setTimeout(() => ring(), 4800);
      }
    };

    ring();

    return () => {
      cancelled = true;
      nodes.forEach((n) => {
        try { (n as OscillatorNode).stop(); } catch {}
      });
    };
  }, []);

  // ── Offline ring: slow monotone beep (350Hz) ──────────────────────────────
  const playOfflineRing = useCallback((ctx: AudioContext): (() => void) => {
    let cancelled = false;

    const beep = () => {
      if (cancelled) return;

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      gainNode.connect(ctx.destination);

      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 350;
      osc.connect(gainNode);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);

      if (!cancelled) {
        setTimeout(() => beep(), 3000);
      }
    };

    beep();

    return () => { cancelled = true; };
  }, []);

  // ── Incoming ring: ascending chime (musical, pleasant) ────────────────────
  const playIncomingRing = useCallback((ctx: AudioContext): (() => void) => {
    let cancelled = false;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6

    const chime = () => {
      if (cancelled) return;

      notes.forEach((freq, i) => {
        const t = ctx.currentTime + i * 0.12;
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0, t);
        gainNode.gain.linearRampToValueAtTime(0.1, t + 0.04);
        gainNode.gain.linearRampToValueAtTime(0, t + 0.35);
        gainNode.connect(ctx.destination);

        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq;
        osc.connect(gainNode);
        osc.start(t);
        osc.stop(t + 0.4);
      });

      // repeat ascending chime every 2.5s
      if (!cancelled) {
        setTimeout(() => chime(), 2500);
      }
    };

    chime();
    return () => { cancelled = true; };
  }, []);

  const play = useCallback(
    (mode: RingtoneMode) => {
      stop(); // stop any existing

      try {
        const ctx = getCtx();
        // Safari / mobile requires resume
        if (ctx.state === "suspended") ctx.resume();

        let cleanup: () => void;

        switch (mode) {
          case "online":
            cleanup = playOnlineRing(ctx);
            break;
          case "offline":
            cleanup = playOfflineRing(ctx);
            break;
          case "incoming":
            cleanup = playIncomingRing(ctx);
            break;
        }

        activeRef.current = true;
        stopRef.current = cleanup!;
      } catch {
        // AudioContext not available (SSR or restricted)
      }
    },
    [stop, playOnlineRing, playOfflineRing, playIncomingRing]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      ctxRef.current?.close().catch(() => {});
    };
  }, [stop]);

  return { play, stop, isPlaying: () => activeRef.current };
}