// Coach voice via the Web Speech API. Handles Safari/iOS quirks:
// async voice loading, long-utterance cutoffs (sentence chunking),
// and Chrome's pause-after-15s bug (periodic resume).
// An optional in-browser natural voice (see natural-voice.js) takes over
// when the user has enabled it and its model is loaded; any failure there
// falls straight back to the system voice mid-sentence.

import { naturalVoice } from './natural-voice.js';

const synth = ('speechSynthesis' in window) ? window.speechSynthesis : null;

let voices = [];
let resumeTimer = 0;

function refreshVoices() {
  if (!synth) return;
  const all = synth.getVoices() || [];
  // Prefer English voices; fall back to whatever exists.
  let en = all.filter((v) => /^en/i.test(v.lang));
  if (!en.length) en = all;
  // Privacy: prefer on-device voices — network voices send spoken text
  // (including the user's name) to the browser vendor. Only fall back to
  // network voices when the device offers no local ones.
  const local = en.filter((v) => v.localService);
  voices = local.length ? local : en;
}

if (synth) {
  refreshVoices();
  synth.addEventListener?.('voiceschanged', refreshVoices);
  // Safari sometimes only populates after a tick
  setTimeout(refreshVoices, 250);
  setTimeout(refreshVoices, 1500);
}

export const coach = {
  voiceURI: '',
  rate: 1.0,
  enabled: true,
  naturalOn: false,          // user opt-in; engages only once the model is ready
  onCaption: null,           // (text) => void — captions always render, even muted
  _sgen: 0,                  // bumped by cancel() so in-flight speech stops cleanly

  listVoices() {
    refreshVoices();
    return voices.map((v) => ({ uri: v.voiceURI, name: v.name, lang: v.lang, default: v.default }));
  },

  supported: !!synth,

  cancel() {
    this._sgen += 1;
    naturalVoice.cancel();
    if (synth) synth.cancel();
    clearInterval(resumeTimer);
  },

  // Speak text (string or array of strings). Captions fire regardless of
  // whether audio is enabled. Resolves when finished or cancelled.
  speak(text, { interrupt = false } = {}) {
    const parts = (Array.isArray(text) ? text : [text]).filter(Boolean);
    if (!parts.length) return Promise.resolve();
    const caption = parts.join(' ');
    if (this.onCaption) this.onCaption(caption);
    if (!this.enabled) return Promise.resolve();
    if (interrupt) this.cancel();

    // Chunk by sentence: iOS Safari can truncate long utterances, and the
    // natural voice keeps latency low by generating one sentence at a time.
    const chunks = [];
    for (const p of parts) {
      const sentences = p.match(/[^.!?]+[.!?]*/g) || [p];
      for (const s of sentences) {
        const t = s.trim();
        if (t) chunks.push(t);
      }
    }

    // Two cancellation counters on purpose: naturalVoice._gen stops queued
    // and playing audio inside the voice module; coach._sgen stops THIS
    // method's fallback from speaking a line the user already cancelled.
    if (this.naturalOn && naturalVoice.available) {
      const gen = this._sgen;
      return naturalVoice.speak(chunks).catch(() => {
        // generation broke — retire the natural voice for this visit and
        // let the system voice repeat the line and handle all future ones
        naturalVoice.retire();
        if (gen === this._sgen) return this._webSpeak(chunks);
      });
    }

    return this._webSpeak(chunks);
  },

  _webSpeak(chunks) {
    if (!synth || !chunks.length) return Promise.resolve();
    const voice = voices.find((v) => v.voiceURI === this.voiceURI) || null;
    return new Promise((resolve) => {
      let i = 0;
      const next = () => {
        if (i >= chunks.length) { clearInterval(resumeTimer); resolve(); return; }
        const u = new SpeechSynthesisUtterance(chunks[i++]);
        if (voice) u.voice = voice;
        u.rate = this.rate;
        u.pitch = 1.05;
        u.onend = next;
        u.onerror = next;
        synth.speak(u);
      };
      // Chrome desktop pauses long speech; nudge it along.
      clearInterval(resumeTimer);
      resumeTimer = setInterval(() => { if (synth.paused) synth.resume(); }, 5000);
      next();
    });
  },
};

// Replace tokens: '{name}' only ever appears as ', {name}' per content spec.
export function personalize(line, name, move = '') {
  let out = line;
  if (out.includes('{name}')) {
    out = name ? out.replaceAll('{name}', name) : out.replaceAll(', {name}', '');
  }
  if (move) out = out.replaceAll('{move}', move);
  return out;
}

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
