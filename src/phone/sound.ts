// Tiny Web Audio helper — all tones generated in code, no asset files.
// Ported from the BugHunter demo and trimmed to the arena's needs.

let ctx: AudioContext | null = null;

function ac(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
  }
  return ctx;
}

/** Browsers only allow audio after a user gesture — call on first tap. */
export function resumeAudio(): void {
  const c = ac();
  if (c.state === "suspended") void c.resume();
}

function tone(freq: number, dur: number, type: OscillatorType, vol = 0.18, when = 0): void {
  const c = ac();
  const t = c.currentTime + when;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.linearRampToValueAtTime(vol, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export const Sound = {
  /** A prop landed — pitch rises with the combo. */
  prop(combo = 1): void {
    const base = 440 + Math.min(combo, 12) * 40;
    tone(base, 0.1, "square", 0.14);
    tone(base * 2, 0.06, "sine", 0.05);
  },
  /** Golden prop — sparkly arpeggio. */
  gold(): void {
    [660, 880, 1320].forEach((f, i) => tone(f, 0.16, "triangle", 0.13, i * 0.06));
  },
  /** Tapped an error — harsh low buzz (it backfired!). */
  error(): void {
    tone(150, 0.25, "sawtooth", 0.22);
    tone(90, 0.3, "sawtooth", 0.16, 0.02);
  },
  /** Big crowd Spirit Bomb landed. */
  bomb(): void {
    [220, 440, 880].forEach((f, i) => tone(f, 0.28, "square", 0.18, i * 0.05));
  },
  /** Victory fanfare. */
  victory(): void {
    [330, 440, 550, 660, 880].forEach((f, i) => tone(f, 0.2, "triangle", 0.16, i * 0.1));
  },
};
