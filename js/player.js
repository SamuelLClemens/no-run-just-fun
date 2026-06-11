// Session player: runs the plan, times each move, schedules coach speech,
// keeps the screen awake, and reports progress to the UI layer.

import { coach, personalize, pick } from './tts.js';
import { sound, music } from './audio.js';
import { TRANSITION_SECS } from './sessionEngine.js';

export class Player {
  constructor({ plan, phrases, name, style, musicOn, hooks }) {
    this.plan = plan;
    this.phrases = phrases;
    this.name = name || '';
    this.style = phrases.styles[style] || phrases.styles.gentle;
    this.musicOn = musicOn;
    this.hooks = hooks; // { render, moveStart(item, idx), mirror(bool), done(stats) }

    this.idx = -1;
    this.phase = 'idle';        // idle | ready | move | paused | done
    this.remaining = 0;
    this.activeSecs = 0;        // seconds actually moved (for XP)
    this.completed = [];
    this.skipped = [];
    this.startHour = new Date().getHours();
    this._timer = 0;
    this._fired = {};
    this._prevPhase = 'move';
    this._wakeLock = null;
    this._onVis = () => {
      if (!document.hidden && this.phase !== 'done') this._requestWakeLock();
    };
  }

  async _requestWakeLock() {
    try {
      this._wakeLock = await navigator.wakeLock?.request('screen');
    } catch { /* unsupported or denied — not fatal */ }
  }

  start() {
    sound.unlock();
    if (this.musicOn) music.start();
    this._requestWakeLock();
    document.addEventListener('visibilitychange', this._onVis);
    const welcome = personalize(pick(this.style.welcome), this.name);
    coach.speak(welcome, { interrupt: true });
    this._next();
    this._timer = setInterval(() => this._tick(), 1000);
  }

  _next() {
    this.idx += 1;
    if (this.idx >= this.plan.items.length) return this._finish();
    this.phase = 'ready';
    this.remaining = TRANSITION_SECS;
    this._fired = {};
    const item = this.plan.items[this.idx];
    sound.chime();
    this.hooks.moveStart(item, this.idx);
    this.hooks.mirror(false);
    const ready = personalize(pick(this.phrases.micro.getReady), this.name, item.ex.name);
    coach.speak(ready, { interrupt: true });
    this.hooks.render(this);
  }

  _beginMove() {
    const item = this.plan.items[this.idx];
    this.phase = 'move';
    this.remaining = item.secs;
    const lines = [item.ex.why];
    if (this.idx === Math.floor(this.plan.items.length / 2)) {
      lines.push(personalize(pick(this.style.halfway), this.name));
    }
    coach.speak(lines, { interrupt: true });
    this.hooks.render(this);
  }

  _tick() {
    if (this.phase === 'paused' || this.phase === 'done' || this.phase === 'idle') return;
    this.remaining -= 1;
    if (this.phase === 'move') {
      this.activeSecs += 1;
      this._scheduleSpeech();
    }
    if (this.remaining <= 0) {
      if (this.phase === 'ready') return this._beginMove();
      // move finished
      const item = this.plan.items[this.idx];
      this.completed.push(item.ex.id);
      if (this.idx % 3 === 2) {
        coach.speak(personalize(pick(this.style.finishMove), this.name), { interrupt: true });
      }
      return this._next();
    }
    this.hooks.render(this);
  }

  _scheduleSpeech() {
    const item = this.plan.items[this.idx];
    const frac = 1 - this.remaining / item.secs;
    const fire = (key, fn) => {
      if (!this._fired[key]) { this._fired[key] = true; fn(); }
    };
    if (frac >= 0.25) fire('cue1', () => coach.speak(item.ex.cues[0]));
    if (item.ex.sided && frac >= 0.5) {
      fire('switch', () => {
        sound.tick();
        this.hooks.mirror(true);
        coach.speak(personalize(pick(this.phrases.micro.switchSides), this.name), { interrupt: true });
      });
    }
    if (frac >= 0.55) fire('mid', () => coach.speak(personalize(pick(this.style.mid), this.name)));
    if (frac >= 0.8) fire('cue2', () => coach.speak(item.ex.cues[1] || item.ex.cues[0]));
  }

  pause() {
    if (this.phase !== 'move' && this.phase !== 'ready') return;
    this._prevPhase = this.phase;
    this.phase = 'paused';
    coach.cancel();
    this.hooks.render(this);
  }

  resume() {
    if (this.phase !== 'paused') return;
    sound.unlock();
    this.phase = this._prevPhase || 'move';
    this.hooks.render(this);
  }

  skip() {
    if (this.phase === 'done') return;
    const item = this.plan.items[this.idx];
    if (item) this.skipped.push(item.ex.id);
    coach.speak(personalize(pick(this.style.skipAck), this.name), { interrupt: true });
    this._next();
  }

  endEarly() {
    this._finish(true);
  }

  // Abandon without reporting (navigation away mid-session).
  dispose() {
    clearInterval(this._timer);
    this.phase = 'done';
    document.removeEventListener('visibilitychange', this._onVis);
    try { this._wakeLock?.release(); } catch { /* ok */ }
  }

  _finish(early = false) {
    if (this._finished) return;
    this._finished = true;
    clearInterval(this._timer);
    this.phase = 'done';
    document.removeEventListener('visibilitychange', this._onVis);
    try { this._wakeLock?.release(); } catch { /* ok */ }
    music.stop();
    const lastItem = this.plan.items[this.plan.items.length - 1];
    const breathClose = !early && lastItem && this.completed.includes(lastItem.ex.id);
    if (!early) {
      sound.fanfare();
      coach.speak(personalize(pick(this.style.sessionDone), this.name), { interrupt: true });
    } else {
      coach.cancel();
    }
    this.hooks.done({
      early,
      minsMoved: Math.max(Math.round(this.activeSecs / 60), early ? 0 : 1),
      completedIds: this.completed,
      skippedIds: this.skipped,
      breathClose,
      startHour: this.startHour,
      closeId: this.plan.closeId,
      durationKey: this.plan.durationKey,
    });
  }
}
