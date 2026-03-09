'use client';

/**
 * CloudCode SoundManager
 * All sounds generated via Web Audio API — zero external files.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private _muted = false;
  private _volume = 0.5;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._muted ? 0 : this._volume;
      this.masterGain.connect(this.ctx.destination);
    }
    // Resume if suspended (browser autoplay policy)
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  private gain(): GainNode {
    this.getCtx();
    return this.masterGain!;
  }

  // ── Primitives ─────────────────────────────────────────────────────────────

  private tone(
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainValue = 0.3,
    fadeOut = true,
  ) {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    g.gain.setValueAtTime(gainValue, startTime);
    if (fadeOut) {
      g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    }

    osc.connect(g);
    g.connect(this.gain());

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  private noise(startTime: number, duration: number, gainValue = 0.1) {
    const ctx = this.getCtx();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const g = ctx.createGain();
    g.gain.setValueAtTime(gainValue, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 0.5;

    source.connect(filter);
    filter.connect(g);
    g.connect(this.gain());
    source.start(startTime);
  }

  // ── Public sounds ──────────────────────────────────────────────────────────

  /** 🔔 Match found — ascending arpeggio */
  matchFound() {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const notes = [440, 554, 659, 880]; // A4, C#5, E5, A5
    notes.forEach((freq, i) => {
      this.tone(freq, t + i * 0.1, 0.3, 'sine', 0.25);
    });
    // Final chord shimmer
    this.tone(880, t + 0.45, 0.5, 'sine', 0.2);
    this.tone(1108, t + 0.45, 0.5, 'sine', 0.15);
  }

  /** ⚡ Submit — quick whoosh */
  submit() {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.15);

    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(g);
    g.connect(this.gain());
    osc.start(t);
    osc.stop(t + 0.25);

    this.noise(t, 0.15, 0.05);
  }

  /** 🏆 Win — victory fanfare */
  win() {
    const ctx = this.getCtx();
    const t = ctx.currentTime;

    // Fanfare melody
    const melody = [
      [523, 0,    0.15], // C5
      [659, 0.15, 0.15], // E5
      [784, 0.30, 0.15], // G5
      [1047, 0.45, 0.5], // C6
    ] as [number, number, number][];

    melody.forEach(([freq, delay, dur]) => {
      this.tone(freq, t + delay, dur, 'sine', 0.3);
      this.tone(freq * 1.5, t + delay, dur * 0.8, 'sine', 0.1);
    });

    // Drum hit on the final note
    this.noise(t + 0.45, 0.1, 0.15);

    // Sustained chord at end
    [523, 659, 784, 1047].forEach(freq => {
      this.tone(freq, t + 0.95, 1.0, 'sine', 0.12);
    });
  }

  /** 💀 Lose — descending sad notes */
  lose() {
    const ctx = this.getCtx();
    const t = ctx.currentTime;

    const notes = [440, 370, 311, 262]; // A4, F#4, Eb4, C4
    notes.forEach((freq, i) => {
      this.tone(freq, t + i * 0.18, 0.35, 'sine', 0.2);
    });

    this.tone(220, t + 0.75, 0.8, 'sine', 0.15);
  }

  /** 🤝 Draw — neutral resolution */
  draw() {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const notes = [392, 440, 392, 349]; // G4, A4, G4, F4
    notes.forEach((freq, i) => {
      this.tone(freq, t + i * 0.15, 0.25, 'sine', 0.2);
    });
  }

  /** ⚠️ Anticheat warning — sharp buzz */
  anticheatWarning() {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    this.tone(220, t, 0.08, 'square', 0.25);
    this.tone(196, t + 0.1, 0.08, 'square', 0.25);
    this.tone(174, t + 0.2, 0.15, 'square', 0.2);
  }

  /** ⏱️ Timer urgent beep (< 30s) */
  timerBeep() {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    this.tone(880, t, 0.06, 'sine', 0.15);
  }

  /** 🖱️ Button click — soft tick */
  click() {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    this.noise(t, 0.04, 0.12);
    this.tone(1200, t, 0.04, 'sine', 0.08);
  }

  /** Queue joined — waiting pulse */
  queueJoined() {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    this.tone(440, t, 0.1, 'sine', 0.15);
    this.tone(550, t + 0.12, 0.1, 'sine', 0.12);
  }

  /** Opponent submitted — alert ping */
  opponentSubmitted() {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    this.tone(660, t, 0.08, 'sine', 0.2);
    this.tone(880, t + 0.1, 0.12, 'sine', 0.15);
  }

  // ── Volume / mute ──────────────────────────────────────────────────────────

  setVolume(v: number) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.masterGain && !this._muted) {
      this.masterGain.gain.value = this._volume;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('cc_volume', String(this._volume));
    }
  }

  setMuted(muted: boolean) {
    this._muted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : this._volume;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('cc_muted', String(muted));
    }
  }

  get muted() { return this._muted; }
  get volume() { return this._volume; }

  loadPrefs() {
    if (typeof window === 'undefined') return;
    const vol = localStorage.getItem('cc_volume');
    const muted = localStorage.getItem('cc_muted');
    if (vol) this._volume = parseFloat(vol);
    if (muted) this._muted = muted === 'true';
  }
}

// Singleton
export const sounds = new SoundManager();
