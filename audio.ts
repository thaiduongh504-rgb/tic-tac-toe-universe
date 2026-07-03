/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private masterVolume: GainNode | null = null;
  private musicVolume: GainNode | null = null;
  private isMuted: boolean = false;
  private currentSeqTimer: any = null;

  constructor() {
    // Lazy initialize on first interaction to comply with browser autoplay policies
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterVolume = this.ctx.createGain();
        this.masterVolume.gain.setValueAtTime(0.3, this.ctx.currentTime);
        this.masterVolume.connect(this.ctx.destination);

        this.musicVolume = this.ctx.createGain();
        this.musicVolume.gain.setValueAtTime(0.08, this.ctx.currentTime);
        this.musicVolume.connect(this.masterVolume);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterVolume && this.ctx) {
      this.masterVolume.gain.setValueAtTime(this.isMuted ? 0 : 0.3, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  getMutedStatus(): boolean {
    return this.isMuted;
  }

  // Play a simple procedural note
  playNote(freq: number, type: OscillatorType, duration: number, delay: number = 0, volume: number = 0.5) {
    try {
      this.initCtx();
      if (!this.ctx || this.isMuted) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);

      gain.gain.setValueAtTime(volume, this.ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + duration);

      osc.connect(gain);
      gain.connect(this.masterVolume!);

      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + duration);
    } catch (e) {
      console.warn('Audio note play error:', e);
    }
  }

  playHover() {
    this.playNote(400, 'sine', 0.05, 0, 0.2);
  }

  playClick() {
    this.playNote(650, 'triangle', 0.08, 0, 0.4);
    this.playNote(1200, 'sine', 0.04, 0.02, 0.2);
  }

  playCountdown() {
    this.playNote(220, 'square', 0.1, 0, 0.3);
  }

  playCountdownWarning() {
    this.playNote(440, 'square', 0.15, 0, 0.4);
    this.playNote(880, 'square', 0.15, 0.05, 0.3);
  }

  playPlaceX() {
    // Sweeping frequency
    try {
      this.initCtx();
      if (!this.ctx || this.isMuted) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.masterVolume!);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {
      console.warn(e);
    }
  }

  playPlaceO() {
    try {
      this.initCtx();
      if (!this.ctx || this.isMuted) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.masterVolume!);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {
      console.warn(e);
    }
  }

  playVictory() {
    const root = 523.25; // C5
    const notes = [root, root * 1.25, root * 1.5, root * 2]; // Major arpeggio C-E-G-C
    notes.forEach((freq, idx) => {
      this.playNote(freq, 'sine', 0.3, idx * 0.1, 0.4);
    });
  }

  playDefeat() {
    const root = 392.00; // G4
    const notes = [root, root * 1.19, root * 1.33, root * 0.9]; // Minor downward sadness
    notes.forEach((freq, idx) => {
      this.playNote(freq, 'sawtooth', 0.4, idx * 0.12, 0.3);
    });
  }

  playDraw() {
    this.playNote(300, 'sine', 0.25, 0, 0.3);
    this.playNote(300, 'triangle', 0.25, 0.05, 0.3);
  }

  playBomb() {
    // Generate explosion noise using frequency sweeps
    try {
      this.initCtx();
      if (!this.ctx || this.isMuted) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.5);

      gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(this.masterVolume!);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch (e) {
      console.warn(e);
    }
  }

  playFreeze() {
    // Shimmering chimes
    this.playNote(1000, 'sine', 0.15, 0, 0.2);
    this.playNote(1300, 'sine', 0.15, 0.04, 0.2);
    this.playNote(1600, 'sine', 0.2, 0.08, 0.25);
  }

  playPortal() {
    // Sci-fi sweep
    try {
      this.initCtx();
      if (!this.ctx || this.isMuted) return;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.3);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterVolume!);

      osc1.start();
      osc2.start();
      osc1.stop(this.ctx.currentTime + 0.3);
      osc2.stop(this.ctx.currentTime + 0.3);
    } catch (e) {
      console.warn(e);
    }
  }

  // Play background loop
  startAmbientMusic() {
    try {
      this.initCtx();
      if (!this.ctx || this.isMuted) return;
      if (this.currentSeqTimer) return;

      // Clean retro background sequence
      const root = 130.81; // C3
      const scale = [1, 1.25, 1.33, 1.5, 1.87]; // C E F G B
      let step = 0;

      const playStep = () => {
        if (this.isMuted) return;
        const noteFactor = scale[Math.floor(Math.random() * scale.length)];
        const freq = root * noteFactor * (Math.random() > 0.85 ? 2 : 1);
        this.playMusicNote(freq, 'sine', 1.5, 0.12);
        
        step++;
        const nextTime = step % 4 === 0 ? 3000 : 1500;
        this.currentSeqTimer = setTimeout(playStep, nextTime);
      };

      playStep();
    } catch (e) {
      console.warn('Ambient music failed to start:', e);
    }
  }

  stopAmbientMusic() {
    if (this.currentSeqTimer) {
      clearTimeout(this.currentSeqTimer);
      this.currentSeqTimer = null;
    }
  }

  private playMusicNote(freq: number, type: OscillatorType, duration: number, volume: number) {
    if (!this.ctx || !this.musicVolume || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.musicVolume);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Ignored
    }
  }
}

export const sfx = new SoundSynthesizer();
