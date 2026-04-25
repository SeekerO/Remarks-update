// src/app/message/lib/hooks/useCallRingTone.tsx
// Modern Web Audio API ringtones:
//   - "online"  : smooth modern phone ring (sine + soft harmonics, subtle reverb)
//   - "offline" : gentle unavailable tone (descending soft chime)
//   - "incoming": warm melodic pulse (like Signal / WhatsApp modern ring)

"use client";

import { useRef, useCallback, useEffect } from "react";

type RingtoneMode = "online" | "offline" | "incoming";

export function useCallRingtone() {
  const ctxRef = useRef<AudioContext | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const activeRef = useRef(false);
  const scheduledTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const getCtx = () => {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  };

  // ── Clear all scheduled timeouts ──────────────────────────────────────────
  const clearAllTimeouts = useCallback(() => {
    scheduledTimeoutsRef.current.forEach((t) => clearTimeout(t));
    scheduledTimeoutsRef.current = [];
  }, []);

  const stop = useCallback(() => {
    clearAllTimeouts();
    if (stopRef.current) {
      stopRef.current();
      stopRef.current = null;
    }
    activeRef.current = false;
  }, [clearAllTimeouts]);

  // ── Helper: create a soft reverb convolver ─────────────────────────────────
  const createReverb = useCallback((ctx: AudioContext, duration = 0.8, decay = 2): ConvolverNode => {
    const convolver = ctx.createConvolver();
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = ctx.createBuffer(2, length, sampleRate);

    for (let c = 0; c < 2; c++) {
      const channel = impulse.getChannelData(c);
      for (let i = 0; i < length; i++) {
        channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    convolver.buffer = impulse;
    return convolver;
  }, []);

  // ── Helper: play a single soft tone with attack/release envelope ───────────
  const playTone = useCallback((
    ctx: AudioContext,
    destination: AudioNode,
    freq: number,
    startTime: number,
    duration: number,
    gainPeak: number,
    type: OscillatorType = "sine",
    detune = 0
  ) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    osc.detune.setValueAtTime(detune, startTime);

    const attack = Math.min(0.03, duration * 0.1);
    const release = Math.min(0.15, duration * 0.4);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(gainPeak, startTime + attack);
    gain.gain.setValueAtTime(gainPeak, startTime + duration - release);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }, []);

  // ── ONLINE ring: modern smooth dual-pulse ring ─────────────────────────────
  // Inspired by iPhone/Pixel — two short melodic pulses, then silence
  const playOnlineRing = useCallback((ctx: AudioContext): (() => void) => {
    let cancelled = false;

    const reverb = createReverb(ctx, 0.6, 3);
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.55, ctx.currentTime);

    const dryGain = ctx.createGain();
    dryGain.gain.setValueAtTime(0.7, ctx.currentTime);

    const wetGain = ctx.createGain();
    wetGain.gain.setValueAtTime(0.3, ctx.currentTime);

    reverb.connect(wetGain);
    wetGain.connect(masterGain);
    dryGain.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Two-tone chord: perfect fifth (G4 + D5) — warm, modern
    const ringFreqs = [392.0, 587.3]; // G4, D5
    const pulseGap = 0.22; // gap between the two pulses

    const ring = () => {
      if (cancelled) return;
      const t = ctx.currentTime;

      // Pulse 1
      ringFreqs.forEach((freq, i) => {
        playTone(ctx, dryGain, freq, t, 0.35, 0.18 - i * 0.04, "sine");
        playTone(ctx, reverb, freq, t, 0.35, 0.12 - i * 0.03, "sine");
        // Soft harmonic shimmer
        playTone(ctx, dryGain, freq * 2, t + 0.02, 0.28, 0.025, "sine", 5);
      });

      // Pulse 2 (slightly softer)
      const t2 = t + 0.35 + pulseGap;
      ringFreqs.forEach((freq, i) => {
        playTone(ctx, dryGain, freq, t2, 0.3, 0.14 - i * 0.03, "sine");
        playTone(ctx, reverb, freq, t2, 0.3, 0.09 - i * 0.02, "sine");
        playTone(ctx, dryGain, freq * 2, t2 + 0.02, 0.24, 0.02, "sine", 5);
      });

      // Repeat every 3.2s
      if (!cancelled) {
        const id = setTimeout(() => ring(), 3200);
        scheduledTimeoutsRef.current.push(id);
      }
    };

    ring();

    return () => {
      cancelled = true;
      try { masterGain.disconnect(); } catch {}
      try { dryGain.disconnect(); } catch {}
      try { wetGain.disconnect(); } catch {}
      try { reverb.disconnect(); } catch {}
    };
  }, [createReverb, playTone]);

  // ── OFFLINE ring: gentle descending "unavailable" tone ────────────────────
  // Three descending soft notes — communicates "not reachable" gently
  const playOfflineRing = useCallback((ctx: AudioContext): (() => void) => {
    let cancelled = false;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.35, ctx.currentTime);
    masterGain.connect(ctx.destination);

    const reverb = createReverb(ctx, 1.2, 2.5);
    const wetGain = ctx.createGain();
    wetGain.gain.setValueAtTime(0.45, ctx.currentTime);
    reverb.connect(wetGain);
    wetGain.connect(masterGain);

    // Descending minor triad: C5, A4, F4 — soft and melancholic
    const notes = [523.25, 440.0, 349.23];

    const beep = () => {
      if (cancelled) return;
      const t = ctx.currentTime;

      notes.forEach((freq, i) => {
        const noteTime = t + i * 0.22;
        playTone(ctx, masterGain, freq, noteTime, 0.28, 0.1 - i * 0.01, "sine");
        playTone(ctx, reverb, freq, noteTime, 0.28, 0.07, "sine");
        // Subtle sub-octave warmth
        playTone(ctx, masterGain, freq / 2, noteTime, 0.2, 0.02, "sine");
      });

      if (!cancelled) {
        const id = setTimeout(() => beep(), 3800);
        scheduledTimeoutsRef.current.push(id);
      }
    };

    beep();

    return () => {
      cancelled = true;
      try { masterGain.disconnect(); } catch {}
      try { wetGain.disconnect(); } catch {}
      try { reverb.disconnect(); } catch {}
    };
  }, [createReverb, playTone]);

  // ── INCOMING ring: warm melodic rising pulse (Signal/WhatsApp-like) ────────
  // Ascending four-note arpeggio with a lush, warm character
  const playIncomingRing = useCallback((ctx: AudioContext): (() => void) => {
    let cancelled = false;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.5, ctx.currentTime);
    masterGain.connect(ctx.destination);

    const reverb = createReverb(ctx, 1.0, 2.8);
    const wetGain = ctx.createGain();
    wetGain.gain.setValueAtTime(0.35, ctx.currentTime);
    reverb.connect(wetGain);
    wetGain.connect(masterGain);

    // Rising major 7th arpeggio: C5, E5, G5, B5 — bright, optimistic
    const arpNotes = [523.25, 659.25, 783.99, 987.77];
    const noteSpacing = 0.10; // 100ms between notes
    const noteDuration = 0.22;

    const chime = () => {
      if (cancelled) return;
      const t = ctx.currentTime;

      arpNotes.forEach((freq, i) => {
        const noteTime = t + i * noteSpacing;
        const peakGain = 0.15 + i * 0.02; // crescendo through the arp

        // Primary tone
        playTone(ctx, masterGain, freq, noteTime, noteDuration, peakGain, "sine");
        // Soft 2nd harmonic shimmer
        playTone(ctx, masterGain, freq * 2, noteTime + 0.01, noteDuration - 0.04, peakGain * 0.12, "sine", 3);
        // Reverb send
        playTone(ctx, reverb, freq, noteTime, noteDuration + 0.05, peakGain * 0.5, "sine");
      });

      // Short pause then repeat
      if (!cancelled) {
        const id = setTimeout(() => chime(), 2800);
        scheduledTimeoutsRef.current.push(id);
      }
    };

    chime();

    return () => {
      cancelled = true;
      try { masterGain.disconnect(); } catch {}
      try { wetGain.disconnect(); } catch {}
      try { reverb.disconnect(); } catch {}
    };
  }, [createReverb, playTone]);

  // ── Public: play ──────────────────────────────────────────────────────────
  const play = useCallback(
    (mode: RingtoneMode) => {
      stop(); // stop any existing ringtone first

      try {
        const ctx = getCtx();
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
        // AudioContext not available (SSR or restricted environment)
      }
    },
    [stop, playOnlineRing, playOfflineRing, playIncomingRing]
  );

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stop();
      ctxRef.current?.close().catch(() => {});
    };
  }, [stop]);

  return { play, stop, isPlaying: () => activeRef.current };
}