// Optional "natural voice" upgrade: Kokoro TTS running fully in-browser.
// One-time download (~90 MB) of a public voice model via the kokoro-js ESM
// bundle on jsDelivr. Pure enhancement: if anything fails — offline, old
// device, blocked CDN — the regular system voice takes over automatically.
// Privacy: the only network activity is fetching the public model files;
// nothing the user types, says, or does is ever sent anywhere.

import { sharedAudioContext } from './audio.js';

const KOKORO_ESM = 'https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/+esm';
const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';
const VOICE = 'af_heart';     // warm, calm female voice
const VERDICT_KEY = 'nrjf.nv'; // persisted speed verdict so probes run once, not every launch
const MAX_RATIO = 1.5;        // generation slower than 1.5x realtime → cues land too late

function readVerdict() {
  try {
    const v = JSON.parse(localStorage.getItem(VERDICT_KEY));
    return v && v.model === MODEL_ID ? v.verdict : null;
  } catch { return null; }
}

function writeVerdict(verdict) {
  try { localStorage.setItem(VERDICT_KEY, JSON.stringify({ model: MODEL_ID, verdict })); } catch { /* ok */ }
}

export const naturalVoice = {
  state: 'off',           // off | loading | ready | slow | failed
  progress: 0,            // 0..1 while loading
  onProgress: null,       // (state, progress) => void — UI hook, re-bound per screen
  _tts: null,
  _src: null,
  _gen: 0,                // bumped ONLY by cancel(); kills queued + playing speech
  _queue: Promise.resolve(),

  get available() { return this.state === 'ready'; },

  // reprobe: true re-measures device speed (explicit user toggle);
  // false trusts the persisted verdict from a previous launch.
  async enable({ reprobe = false } = {}) {
    if (this.state === 'ready') return true;
    if (this.state === 'loading') return false;

    // a device already measured too slow stays on the system voice without
    // paying the download/startup cost again — unless the user re-asks
    if (!reprobe && readVerdict() === 'slow') {
      this.state = 'slow';
      this._emit();
      return false;
    }

    this.state = 'loading';
    this.progress = 0;
    this._emit();
    try {
      const mod = await import(/* one CDN fetch, only after opt-in */ KOKORO_ESM);
      const files = {};
      this._tts = await mod.KokoroTTS.from_pretrained(MODEL_ID, {
        dtype: 'q8',
        progress_callback: (p) => {
          if (p.status === 'progress' && p.file && p.total) {
            files[p.file] = { loaded: p.loaded || 0, total: p.total };
            let loaded = 0, total = 0;
            for (const f of Object.values(files)) { loaded += f.loaded; total += f.total; }
            this.progress = total ? loaded / total : 0; // byte-weighted: never jumps backwards
            this._emit();
          }
        },
      });

      if (reprobe || readVerdict() !== 'ready') {
        // Honest speed check: live coaching needs near-realtime generation.
        // First call warms the engine; the second is timed. The verdict is
        // saved so future launches skip both probes entirely.
        await this._tts.generate('Hello there.', { voice: VOICE });
        const t0 = performance.now();
        const probe = await this._tts.generate('Notice your breath, and let your shoulders soften.', { voice: VOICE });
        const ratio = (performance.now() - t0) / (probe.audio.length / probe.sampling_rate * 1000);
        writeVerdict(ratio > MAX_RATIO ? 'slow' : 'ready');
        if (ratio > MAX_RATIO) {
          this.state = 'slow';
          this._emit();
          return false;
        }
      }

      this.state = 'ready';
      this.progress = 1;
      this._emit();
      return true;
    } catch (e) {
      console.warn('natural voice unavailable, staying on system voice:', e);
      this.state = 'failed'; // not persisted: a flaky network today can work tomorrow
      this._emit();
      return false;
    }
  },

  _emit() { if (this.onProgress) this.onProgress(this.state, this.progress); },

  // Called when generation breaks mid-session: stop offering the natural
  // voice for the rest of this page lifetime (next launch retries fresh).
  retire() {
    this.state = 'failed';
    this._emit();
  },

  cancel() {
    this._gen += 1;
    if (this._src) {
      try { this._src.stop(); } catch { /* already stopped */ }
      this._src = null;
    }
  },

  // Speak a list of chunks as ONE queued job. Jobs play strictly one after
  // another (the system-voice path queues utterances; this preserves that
  // contract, so the coach never talks over herself). Resolves when done or
  // cancelled; rejects if generation/playback breaks so the caller can fall
  // back to the system voice.
  speak(chunks) {
    const gen = this._gen;
    const job = this._queue.then(() => this._playChunks(chunks, gen));
    // keep the queue alive even when a job rejects (the caller handles it)
    this._queue = job.catch(() => {});
    return job;
  },

  async _playChunks(chunks, gen) {
    for (const text of chunks) {
      if (gen !== this._gen) return;
      if (!this._tts) throw new Error('natural voice not ready');
      const out = await this._tts.generate(text, { voice: VOICE });
      if (gen !== this._gen) return;
      const ctx = sharedAudioContext();
      if (!ctx) throw new Error('no audio context');
      if (ctx.state !== 'running') {
        await ctx.resume().catch(() => {});
        // still locked (iOS gesture rule) — throw so the system voice takes
        // over instead of hanging on audio that will never play
        if (ctx.state !== 'running') throw new Error('audio context locked');
      }
      const buf = ctx.createBuffer(1, out.audio.length, out.sampling_rate);
      buf.getChannelData(0).set(out.audio);
      if (gen !== this._gen) return;
      await new Promise((resolve) => {
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        let settled = false;
        const done = () => { if (!settled) { settled = true; if (this._src === src) this._src = null; resolve(); } };
        src.onended = done;
        // belt and braces: never let a swallowed onended hang the session
        setTimeout(done, buf.duration * 1000 + 1500);
        this._src = src;
        src.start();
      });
    }
  },
};
