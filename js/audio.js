// All sound is generated with the Web Audio API — zero audio assets,
// zero licensing risk. The context unlocks on first user gesture (iOS rule).

let ctx = null;
let musicNodes = null;
let musicGain = null;

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function pluck(freq, time, dur, gain, type = 'sine') {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(gain, time + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  o.connect(g).connect(ctx.destination);
  o.start(time);
  o.stop(time + dur + 0.05);
}

export const sound = {
  sfxOn: true,

  unlock() { ensureCtx(); },

  // Soft single chime — move transitions.
  chime() {
    if (!this.sfxOn || !ensureCtx()) return;
    const t = ctx.currentTime;
    pluck(660, t, 1.2, 0.12);
    pluck(990, t, 1.0, 0.05);
  },

  // Cheerful rising arpeggio — session complete / level up.
  fanfare() {
    if (!this.sfxOn || !ensureCtx()) return;
    const t = ctx.currentTime;
    [523, 659, 784, 1047].forEach((f, i) => {
      pluck(f, t + i * 0.13, 1.4, 0.14, 'triangle');
      pluck(f * 2, t + i * 0.13, 0.8, 0.04);
    });
  },

  // Sparkle — badge earned.
  sparkle() {
    if (!this.sfxOn || !ensureCtx()) return;
    const t = ctx.currentTime;
    [1319, 1760, 2093].forEach((f, i) => pluck(f, t + i * 0.09, 0.7, 0.07));
  },

  // Gentle tick at halfway / side switch.
  tick() {
    if (!this.sfxOn || !ensureCtx()) return;
    pluck(880, ctx.currentTime, 0.5, 0.08);
  },
};

// ---- generative ambient music: slow detuned pad drifting through a
// I–vi–IV–V progression, low-passed, very quiet. ----

const CHORDS = [
  [261.63, 329.63, 392.0],   // C
  [220.0, 261.63, 329.63],   // Am
  [174.61, 220.0, 261.63],   // F
  [196.0, 246.94, 293.66],   // G
];

export const music = {
  on: false,
  volume: 0.5,

  start() {
    if (!ensureCtx() || musicNodes) return;
    musicGain = ctx.createGain();
    musicGain.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    filter.Q.value = 0.4;
    musicGain.connect(ctx.destination);
    filter.connect(musicGain);

    const oscs = [];
    for (let v = 0; v < 3; v++) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = v === 2 ? 'triangle' : 'sine';
      g.gain.value = v === 2 ? 0.04 : 0.085;
      o.connect(g).connect(filter);
      o.start();
      oscs.push(o);
    }
    // slow shimmer
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.07;
    lfoGain.gain.value = 220;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();

    let step = 0;
    const scheduleChord = () => {
      if (!musicNodes) return;
      const chord = CHORDS[step % CHORDS.length];
      const t = ctx.currentTime;
      oscs.forEach((o, i) => {
        o.frequency.cancelScheduledValues(t);
        o.frequency.setTargetAtTime(chord[i] * (i === 2 ? 0.5 : 1) * (1 + (i - 1) * 0.0015), t, 2.5);
      });
      step++;
      musicNodes.timer = setTimeout(scheduleChord, 9000);
    };
    musicNodes = { oscs, lfo, filter, timer: 0 };
    scheduleChord();
    musicGain.gain.setTargetAtTime(0.16 * this.volume, ctx.currentTime, 1.5);
    this.on = true;
  },

  stop() {
    if (!musicNodes) { this.on = false; return; }
    const nodes = musicNodes;
    musicNodes = null;
    this.on = false;
    clearTimeout(nodes.timer);
    if (musicGain) musicGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.4);
    setTimeout(() => {
      nodes.oscs.forEach((o) => { try { o.stop(); } catch { /* already stopped */ } });
      try { nodes.lfo.stop(); } catch { /* already stopped */ }
    }, 1200);
  },

  setVolume(v) {
    this.volume = v;
    if (musicNodes && musicGain) musicGain.gain.setTargetAtTime(0.16 * v, ctx.currentTime, 0.3);
  },
};
