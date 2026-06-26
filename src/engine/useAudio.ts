import { useEffect, useRef } from 'react';

// Procedural Web Audio SFX. No audio files needed — every sound is synthesized,
// which keeps the foundation self-contained and lets each game request named
// effects. Honors a global mute flag (wired to the pause menu's Sound row).

export type SfxName =
  | 'shoot'
  | 'hit'
  | 'denied' // pause-menu locked-difficulty buzzer
  | 'coin'
  | 'lose' // possession destroyed / life lost
  | 'payday'
  | 'select'
  | 'glitch';

type ToneSpec = {
  type: OscillatorType;
  freq: number;
  freqEnd?: number;
  dur: number;
  gain?: number;
  delay?: number;
};

const PRESETS: Record<SfxName, ToneSpec[]> = {
  shoot: [{ type: 'square', freq: 880, freqEnd: 220, dur: 0.1, gain: 0.18 }],
  hit: [{ type: 'square', freq: 200, freqEnd: 60, dur: 0.12, gain: 0.22 }],
  denied: [
    { type: 'square', freq: 120, freqEnd: 80, dur: 0.18, gain: 0.25 },
    { type: 'square', freq: 90, freqEnd: 55, dur: 0.18, gain: 0.25, delay: 0.12 },
  ],
  coin: [
    { type: 'square', freq: 988, dur: 0.06, gain: 0.16 },
    { type: 'square', freq: 1319, dur: 0.1, gain: 0.16, delay: 0.06 },
  ],
  lose: [{ type: 'sawtooth', freq: 300, freqEnd: 40, dur: 0.4, gain: 0.25 }],
  payday: [
    { type: 'square', freq: 523, dur: 0.12, gain: 0.2 },
    { type: 'square', freq: 659, dur: 0.12, gain: 0.2, delay: 0.12 },
    { type: 'square', freq: 784, dur: 0.12, gain: 0.2, delay: 0.24 },
    { type: 'square', freq: 1047, dur: 0.25, gain: 0.22, delay: 0.36 },
  ],
  select: [{ type: 'square', freq: 660, freqEnd: 990, dur: 0.08, gain: 0.16 }],
  glitch: [
    { type: 'sawtooth', freq: 80, freqEnd: 400, dur: 0.3, gain: 0.2 },
    { type: 'square', freq: 1200, freqEnd: 100, dur: 0.3, gain: 0.12, delay: 0.05 },
  ],
};

let ctx: AudioContext | null = null;
let muted = false;

function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function playTone(ac: AudioContext, spec: ToneSpec, startAt: number) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = spec.type;
  const t0 = startAt + (spec.delay ?? 0);
  const peak = spec.gain ?? 0.2;
  osc.frequency.setValueAtTime(spec.freq, t0);
  if (spec.freqEnd != null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, spec.freqEnd), t0 + spec.dur);
  }
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + spec.dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + spec.dur + 0.02);
}

export function playSfx(name: SfxName): void {
  if (muted) return;
  const ac = ensureCtx();
  if (!ac) return;
  const now = ac.currentTime;
  for (const spec of PRESETS[name]) playTone(ac, spec, now);
}

export function setMuted(value: boolean): void {
  muted = value;
}

export function isMuted(): boolean {
  return muted;
}

/**
 * Returns a stable `play` function. First user gesture resumes the context
 * (browsers block autoplay until then).
 */
export function useAudio() {
  const ref = useRef({ play: playSfx, setMuted, isMuted });
  useEffect(() => {
    const unlock = () => ensureCtx();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);
  return ref.current;
}
