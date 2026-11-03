/* Musique synthétisée — aucune ressource audio externe.
 * Séquenceur WebAudio : 3 thèmes d'intro au choix + 1 thème de jeu.
 * Le contexte est créé au premier geste utilisateur (politique navigateur). */

export interface IntroTrack {
  id: string;
  name: string;
  mood: string;
}

export const INTRO_TRACKS: IntroTrack[] = [
  { id: "neon", name: "NEON DRIZZLE", mood: "synthwave · 92 BPM" },
  { id: "court", name: "MIDNIGHT COURT", mood: "chill · 78 BPM" },
  { id: "hype", name: "SPLAT HYPE", mood: "arcade · 112 BPM" },
];

type Note = [number, number]; // [demi-tons depuis la racine, durée en temps]

interface Theme {
  bpm: number;
  root: number; // fréquence de la tonique
  scale: number[];
  chords: number[][];
  bass: number[];
  arp: Note[];
  wave: OscillatorType;
  padWave: OscillatorType;
  drums: "soft" | "club" | "none";
  padLevel: number;
  arpLevel: number;
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const DORIAN = [0, 2, 3, 5, 7, 9, 10];

const INTRO_THEMES: Record<string, Theme> = {
  neon: {
    bpm: 92,
    root: 110,
    scale: MINOR,
    chords: [
      [0, 3, 7, 10],
      [-2, 1, 5, 8],
      [3, 7, 10, 14],
      [5, 8, 12, 15],
    ],
    bass: [0, 0, 5, 5, 3, 3, -2, -2],
    arp: [
      [12, 0.5], [15, 0.5], [19, 0.5], [22, 0.5],
      [19, 0.5], [15, 0.5], [12, 0.5], [10, 0.5],
      [15, 0.5], [19, 0.5], [24, 0.5], [19, 0.5],
      [17, 0.5], [14, 0.5], [10, 0.5], [7, 0.5],
    ],
    wave: "sawtooth",
    padWave: "triangle",
    drums: "soft",
    padLevel: 0.055,
    arpLevel: 0.07,
  },
  court: {
    bpm: 78,
    root: 98,
    scale: DORIAN,
    chords: [
      [0, 4, 7, 11],
      [5, 9, 12, 16],
      [-3, 0, 4, 7],
      [2, 5, 9, 12],
    ],
    bass: [0, 5, 3, -2, 0, 7, 5, -2],
    arp: [
      [12, 1], [16, 1], [19, 1], [23, 1],
      [17, 1], [21, 1], [24, 1], [19, 1],
    ],
    wave: "sine",
    padWave: "sine",
    drums: "none",
    padLevel: 0.07,
    arpLevel: 0.06,
  },
  hype: {
    bpm: 112,
    root: 123.47,
    scale: MAJOR,
    chords: [
      [0, 4, 7, 11],
      [7, 11, 14, 18],
      [5, 9, 12, 16],
      [7, 11, 14, 18],
    ],
    bass: [0, 0, 7, 7, 5, 5, 3, 7],
    arp: [
      [12, 0.25], [16, 0.25], [19, 0.25], [24, 0.25],
      [19, 0.25], [16, 0.25], [19, 0.25], [23, 0.25],
      [17, 0.25], [21, 0.25], [24, 0.25], [28, 0.25],
      [19, 0.25], [23, 0.25], [26, 0.25], [31, 0.25],
    ],
    wave: "square",
    padWave: "triangle",
    drums: "club",
    padLevel: 0.045,
    arpLevel: 0.055,
  },
};

const GAME_THEME: Theme = {
  bpm: 128,
  root: 98,
  scale: MINOR,
  chords: [
    [0, 3, 7, 10],
    [5, 8, 12, 15],
    [3, 7, 10, 14],
    [-2, 2, 5, 8],
  ],
  bass: [0, 0, 0, 3, 5, 5, 3, 7],
  arp: [
    [12, 0.25], [15, 0.25], [19, 0.25], [22, 0.25],
    [19, 0.25], [15, 0.25], [22, 0.25], [19, 0.25],
    [17, 0.25], [20, 0.25], [24, 0.25], [27, 0.25],
    [24, 0.25], [20, 0.25], [27, 0.25], [24, 0.25],
  ],
  wave: "sawtooth",
  padWave: "triangle",
  drums: "club",
  padLevel: 0.04,
  arpLevel: 0.05,
};

class MusicPlayer {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private timer: number | null = null;
  private nextTime = 0;
  private bar = 0;
  private mode: "none" | "intro" | "game" = "none";
  private introIndex = 0;
  enabled = true;

  constructor() {
    try {
      this.introIndex = Math.min(
        INTRO_TRACKS.length - 1,
        Math.max(0, Number(localStorage.getItem("pb.music.intro") ?? 0) || 0)
      );
      this.enabled = localStorage.getItem("pb.music") !== "0";
    } catch {
      this.enabled = true;
    }
  }

  get track() {
    return INTRO_TRACKS[this.introIndex] ?? INTRO_TRACKS[0];
  }
  get introTrackIndex() {
    return this.introIndex;
  }
  get playing() {
    return this.mode !== "none";
  }

  /** À appeler depuis un geste utilisateur. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    try {
      const AC: typeof AudioContext =
        (window as unknown as { AudioContext: typeof AudioContext }).AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      const master = ctx.createGain();
      master.gain.value = this.enabled ? 1 : 0;
      master.connect(ctx.destination);
      const bus = ctx.createGain();
      bus.gain.value = 0.0001;
      bus.connect(master);
      this.ctx = ctx;
      this.master = master;
      this.musicBus = bus;
    } catch {
      this.ctx = null;
    }
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    try {
      localStorage.setItem("pb.music", on ? "1" : "0");
    } catch {
      /* stockage indisponible */
    }
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(on ? 1 : 0, this.ctx.currentTime, 0.08);
    }
    if (!on) this.stopScheduler();
    else if (this.mode !== "none") this.startScheduler();
  }

  cycleIntro(dir = 1) {
    this.introIndex = (this.introIndex + dir + INTRO_TRACKS.length) % INTRO_TRACKS.length;
    try {
      localStorage.setItem("pb.music.intro", String(this.introIndex));
    } catch {
      /* stockage indisponible */
    }
    if (this.mode === "intro") {
      this.stopScheduler();
      this.playIntro();
    }
    return this.track;
  }

  playIntro() {
    this.start("intro");
  }
  playGame() {
    this.start("game");
  }

  pause() {
    if (!this.ctx || !this.musicBus) {
      this.mode = "none";
      this.stopScheduler();
      return;
    }
    this.musicBus.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.12);
    this.stopScheduler();
  }

  resume() {
    if (this.mode === "none") return;
    this.startScheduler();
  }

  stop() {
    this.mode = "none";
    this.stopScheduler();
    if (this.ctx && this.musicBus) this.musicBus.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.15);
  }

  private start(mode: "intro" | "game") {
    this.mode = mode;
    if (!this.ctx || !this.musicBus || !this.enabled) return;
    if (this.ctx.state === "suspended") void this.ctx.resume();
    this.bar = 0;
    this.nextTime = this.ctx.currentTime + 0.08;
    this.musicBus.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musicBus.gain.setTargetAtTime(mode === "intro" ? 0.5 : 0.42, this.ctx.currentTime, 0.35);
    this.startScheduler();
  }

  private startScheduler() {
    if (this.timer !== null || !this.ctx) return;
    this.nextTime = Math.max(this.nextTime, this.ctx.currentTime + 0.05);
    this.timer = window.setInterval(() => this.tick(), 110);
    this.tick();
  }

  private stopScheduler() {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  private theme(): Theme {
    return this.mode === "intro" ? INTRO_THEMES[this.track.id] ?? INTRO_THEMES.neon : GAME_THEME;
  }

  private tick() {
    const ctx = this.ctx;
    if (!ctx || !this.musicBus) return;
    if (this.mode === "none") return;
    const theme = this.theme();
    const beat = 60 / theme.bpm;
    const barDur = beat * 4;
    while (this.nextTime < ctx.currentTime + 0.35) {
      this.scheduleBar(theme, this.bar, this.nextTime, beat);
      this.nextTime += barDur;
      this.bar++;
    }
  }

  /** Planifie une mesure (4 temps) : basse, arpège, nappe, batterie. */
  private scheduleBar(theme: Theme, bar: number, at: number, beat: number) {
    const ctx = this.ctx!;
    const bus = this.musicBus!;
    const chord = theme.chords[bar % theme.chords.length];
    const semi = (n: number) => theme.root * Math.pow(2, n / 12);

    // nappe : accord tenu sur la mesure
    for (const n of chord) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.value = 1400;
      osc.type = theme.padWave;
      osc.frequency.value = semi(n + 12);
      osc.detune.value = (Math.random() - 0.5) * 8;
      const t0 = at;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(theme.padLevel, t0 + 0.35);
      g.gain.linearRampToValueAtTime(theme.padLevel * 0.7, t0 + beat * 4 - 0.1);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + beat * 4);
      osc.connect(filt);
      filt.connect(g);
      g.connect(bus);
      osc.start(t0);
      osc.stop(t0 + beat * 4 + 0.05);
    }

    // basse : croches
    theme.bass.forEach((n, i) => {
      const t0 = at + (i * beat) / 2;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(semi(n), t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.11, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + beat * 0.5);
      osc.connect(g);
      g.connect(bus);
      osc.start(t0);
      osc.stop(t0 + beat * 0.55);
    });

    // arpège
    let cursor = 0;
    for (const [n, dur] of theme.arp) {
      const t0 = at + cursor * beat;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = theme.wave;
      osc.frequency.setValueAtTime(semi(n + 12), t0);
      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.setValueAtTime(3200, t0);
      filt.frequency.exponentialRampToValueAtTime(900, t0 + dur * beat);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(theme.arpLevel, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur * beat * 0.95);
      osc.connect(filt);
      filt.connect(g);
      g.connect(bus);
      osc.start(t0);
      osc.stop(t0 + dur * beat + 0.02);
      cursor += dur;
    }

    // batterie
    if (theme.drums !== "none") {
      const steps = theme.drums === "club" ? 4 : 2;
      for (let i = 0; i < steps; i++) {
        const t0 = at + (i * beat * 4) / steps;
        this.kick(t0, i % 2 === 0 ? 0.22 : 0.12, theme.drums === "club" ? 52 : 44);
        this.hat(t0 + beat / 2, 0.03);
      }
    }
  }

  private kick(at: number, vol: number, freq: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq * 2.6, at);
    osc.frequency.exponentialRampToValueAtTime(freq, at + 0.13);
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.22);
    osc.connect(g);
    g.connect(this.musicBus!);
    osc.start(at);
    osc.stop(at + 0.24);
  }

  private hat(at: number, vol: number) {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * 0.06);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = "highpass";
    filt.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(filt);
    filt.connect(g);
    g.connect(this.musicBus!);
    src.start(at);
  }
}

let instance: MusicPlayer | null = null;
export function getMusic(): MusicPlayer {
  if (!instance) instance = new MusicPlayer();
  return instance;
}
export type { MusicPlayer };
