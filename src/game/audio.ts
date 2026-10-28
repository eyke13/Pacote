import { CharacterId, StageId } from './types';

export class ProceduralAudioEngine {
  private ctx: AudioContext | null = null;
  private bgmTimer: number | null = null;
  private stepIdx = 0;
  private currentStage: StageId = 'estudio';
  public sfxVolume = 0.7;
  public bgmVolume = 0.4;
  public muted = false;
  public announcerEnabled = true;
  public barbaraHpRatio = 1.0;

  public unlock(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public playHit(heavy: boolean, isSpecial: boolean): void {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const dur = heavy ? 0.16 : 0.08;

    // Filtered noise burst + punchy low sine drop
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(heavy ? 520 : 1100, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime((heavy ? 0.45 : 0.28) * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);

    if (heavy || isSpecial) {
      const osc = this.ctx.createOscillator();
      const oGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isSpecial ? 180 : 130, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + dur);
      oGain.gain.setValueAtTime(0.35 * this.sfxVolume, now);
      oGain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc.connect(oGain);
      oGain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + dur);
    }
  }

  public playBlock(): void {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(920, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.06);
    gain.gain.setValueAtTime(0.22 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  public playParry(): void {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Crisp high bell chime (SF3 style)
    for (const freq of [1318.5, 1975.5, 2637]) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    }
  }

  public playSpecial(charId: CharacterId, moveId: string): void {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;

    if (charId === 'cassandra' && moveId.startsWith('rajada')) {
      // Rapid SMG burst
      for (let i = 0; i < 4; i++) {
        const t = now + i * 0.045;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.035);
        gain.gain.setValueAtTime(0.22 * this.sfxVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.04);
      }
      return;
    }

    if (charId === 'boris') {
      // Dagger whistle
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.14);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
      return;
    }

    if (charId === 'gnhoif') {
      // Solar beam sweep
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
      return;
    }

    // Barbara Visitor summon chime
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.07);
    gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.21);
  }

  public playSuperFlash(): void {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    for (const freq of [220, 440, 659.25, 880]) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.38);
      gain.gain.setValueAtTime(0.16 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  }

  public playKo(): void {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.75);
    gain.gain.setValueAtTime(0.45 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.78);
  }

  public announce(text: string): void {
    if (this.muted || !this.announcerEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'pt-BR';
      utter.rate = 1.05;
      utter.pitch = 0.85;
      utter.volume = Math.min(1, this.sfxVolume);
      window.speechSynthesis.speak(utter);
    } catch {
      // Ignore speechSynthesis errors in headless environments
    }
  }

  public startStageMusic(stage: StageId): void {
    this.stopMusic();
    this.currentStage = stage;
    this.stepIdx = 0;
    if (typeof window === 'undefined') return;

    this.bgmTimer = window.setInterval(() => {
      if (this.muted || !this.ctx || this.bgmVolume <= 0.01) return;
      this.playSequencerStep();
    }, 210);
  }

  public stopMusic(): void {
    if (this.bgmTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  private playSequencerStep(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const s = this.stepIdx % 16;
    this.stepIdx++;

    // Stage-specific scales & instruments
    if (this.currentStage === 'estudio') {
      // 60s spy jazz + surf guitar walking bassline
      const spyBass = [110, 130.8, 146.8, 155.6, 146.8, 130.8, 110, 98];
      const freq = spyBass[s % spyBass.length];
      this.triggerNote(freq, 'triangle', 0.16, 0.12 * this.bgmVolume, 0);
      if (s % 4 === 0) {
        this.triggerNote(freq * 2, 'sawtooth', 0.12, 0.08 * this.bgmVolume, 0);
      }
    } else if (this.currentStage === 'clareira') {
      // Eastern European harmonic minor folk
      const folkNotes = [146.8, 164.8, 174.6, 220, 233.1, 277.2, 293.7, 220];
      const freq = folkNotes[s % folkNotes.length];
      this.triggerNote(freq, 'sawtooth', 0.18, 0.1 * this.bgmVolume, 0);
    } else if (this.currentStage === 'sanatorio') {
      // Music box that detunes as Barbara's HP drops!
      const boxNotes = [523.25, 659.25, 783.99, 659.25, 587.33, 493.88, 440, 493.88];
      const freq = boxNotes[s % boxNotes.length];
      const detuneCents = (1 - this.barbaraHpRatio) * ((s % 2 === 0 ? 1 : -1) * 95);
      this.triggerNote(freq, 'sine', 0.2, 0.12 * this.bgmVolume, detuneCents);
    } else {
      // Observatório do Eclipse: deep drone + synthesized choir
      const choirNotes = [73.42, 110, 146.83, 155.56];
      const freq = choirNotes[s % choirNotes.length];
      this.triggerNote(freq, 'sawtooth', 0.35, 0.1 * this.bgmVolume, 0);
    }
  }

  private triggerNote(
    freq: number,
    type: OscillatorType,
    dur: number,
    vol: number,
    detuneCents: number
  ): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.detune.setValueAtTime(detuneCents, now);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.01);
  }
}
