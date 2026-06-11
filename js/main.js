// You Got This! — app shell and screens.
// Private by design: every byte of your data lives in localStorage on this
// device. No accounts, no analytics, no tracking, no server. Ever.

import { store, save, resetAll, todayKey } from './state.js';
import { CHARACTERS, getCharacter } from './characters.js';
import { coach, personalize, pick } from './tts.js';
import { sound, music } from './audio.js';
import { buildSession, TRANSITION_SECS } from './sessionEngine.js';
import { streakInfo, levelInfo, gardenStage, checkBadges, recordSession, LEVELS } from './gamify.js';
import { Player } from './player.js';
import { celebrate } from './confetti.js';
import { EXERCISES } from './data/exercises.js';
import { PHRASES } from './data/phrases.js';
import { BADGES } from './data/badges.js';
import { gardenSVG, GARDEN_STAGE_SESSIONS } from './data/garden.js';
import { POSES } from './data/poses.js';

const app = document.getElementById('app');
let avatar = null;        // lazy three.js instance, one at a time
let player = null;

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function go(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

// ---------------------------------------------------------------- home

function homeScreen() {
  const p = store.progress;
  const streak = streakInfo(p.sessions);
  const lvl = levelInfo(p.totalMins);
  const stage = gardenStage(p.sessions.length, GARDEN_STAGE_SESSIONS);
  const name = store.profile.name;

  const streakChip = streak.count > 0
    ? `<div class="chip chip-streak" role="status">🔥 ${streak.count}-day streak${streak.pendingToday ? ' — move today to keep it growing' : ''}</div>`
    : `<div class="chip" role="status">Your garden is ready when you are</div>`;

  const grace = streak.usedGraceRecently && streak.count > 0
    ? `<p class="grace-note">${esc(pick(PHRASES.micro.streakSafe))}</p>` : '';

  app.innerHTML = `
    <header class="topbar">
      <div class="brand"><img src="icons/icon-192.png" alt="" width="34" height="34"> <span>You Got This!</span></div>
      <nav class="topnav">
        <a href="#badges">Badges</a>
        <a href="#settings" aria-label="Settings">Settings</a>
      </nav>
    </header>
    <main class="home">
      <section class="garden-card" aria-label="Your garden">
        <div class="garden-svg">${gardenSVG(stage)}</div>
        ${streakChip}
        ${grace}
        <p class="garden-caption">${p.sessions.length === 0
          ? `Hi${name ? ' ' + esc(name) : ''}! Every session you finish grows this garden. Consistency makes it bloom — never intensity.`
          : `${p.sessions.length} session${p.sessions.length === 1 ? '' : 's'} grown so far. Keep watering.`}</p>
      </section>

      <section class="level-card" aria-label="Your level">
        <div class="level-row">
          <strong>Level ${lvl.level}: ${lvl.title}</strong>
          <span>${p.totalMins} min moved</span>
        </div>
        <div class="level-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(lvl.pct * 100)}" aria-label="Progress to next level">
          <div class="level-fill" style="width:${Math.round(lvl.pct * 100)}%"></div>
        </div>
        ${lvl.nextTitle ? `<p class="level-next">${lvl.minsToNext} min to ${lvl.nextTitle}</p>` : '<p class="level-next">Top of the garden. Legend.</p>'}
      </section>

      <section class="start-card">
        <h2>How long do you have?</h2>
        <div class="duration-grid">
          <button class="duration-btn" data-mins="7"><span class="d-num">7</span><span class="d-label">quick reset</span></button>
          <button class="duration-btn" data-mins="15"><span class="d-num">15</span><span class="d-label">solid stretch</span></button>
          <button class="duration-btn" data-mins="30"><span class="d-num">30</span><span class="d-label">full bloom</span></button>
          <button class="duration-btn" data-mins="45"><span class="d-num">45</span><span class="d-label">the deluxe</span></button>
        </div>
        <p class="start-note">minutes of stretch + strength, no equipment, coached by ${esc(getCharacter(store.profile.character).name)}</p>
      </section>

      <footer class="privacy-note">
        <p>🌱 <strong>Private by design.</strong> Your progress lives only on this device. No account, no tracking, no data ever leaves your phone. <a href="#safety">Safety notice</a></p>
      </footer>
    </main>`;

  app.querySelectorAll('.duration-btn').forEach((b) => {
    b.addEventListener('click', () => {
      sound.unlock();
      go('#session-' + b.dataset.mins);
    });
  });

  if (!store.profile.seenSafety) showSafetyOverlay();
}

// ---------------------------------------------------------------- safety

function safetyHTML() {
  return `
    <h2>Quick word before we begin 💚</h2>
    <p>This app offers gentle exercise guidance — it is not medical advice.</p>
    <ul>
      <li>Check with your doctor before starting a new exercise program — especially if you are within 12 weeks of giving birth, or have pelvic floor symptoms, diastasis recti, or any health concern.</li>
      <li>If a move hurts, stop. Discomfort that feels wrong beats any streak.</li>
      <li>Every single move has a skip button. Use it freely — skipping is self-care, not failure.</li>
    </ul>
    <p>All moves here are low-impact and chosen to be kind to postpartum bodies: no crunches, no sit-ups, no full planks.</p>`;
}

function showSafetyOverlay() {
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.setAttribute('role', 'dialog');
  ov.setAttribute('aria-modal', 'true');
  ov.setAttribute('aria-label', 'Safety notice');
  ov.innerHTML = `<div class="overlay-card">${safetyHTML()}
    <button class="btn btn-primary" id="safety-ok">I understand — let's go</button></div>`;
  document.body.appendChild(ov);
  const btn = ov.querySelector('#safety-ok');
  btn.focus();
  // modal focus trap: the confirm button is the only focusable element
  ov.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') { e.preventDefault(); btn.focus(); }
  });
  btn.addEventListener('click', () => {
    store.profile.seenSafety = true;
    save();
    ov.remove();
  });
}

function safetyScreen() {
  app.innerHTML = `
    <header class="topbar"><a class="back" href="#">← Back</a></header>
    <main class="narrow"><section class="card">${safetyHTML()}</section></main>`;
}

// ---------------------------------------------------------------- session

function sessionScreen(mins) {
  const plan = buildSession(mins, EXERCISES, { lastCloseId: store.progress.lastCloseId });
  const profile = store.profile;

  app.innerHTML = `
    <main class="session">
      <div class="stage">
        <canvas id="avatar-canvas" aria-label="Your coach demonstrating the move"></canvas>
        <div class="caption-bubble" id="caption" aria-live="polite"></div>
      </div>
      <section class="move-card">
        <div class="move-head">
          <div>
            <span class="chip chip-block" id="block-chip"></span>
            <h2 id="move-name">Get ready…</h2>
          </div>
          <div class="ring-wrap">
            <svg viewBox="0 0 120 120" class="ring" aria-hidden="true">
              <circle cx="60" cy="60" r="54" class="ring-bg"/>
              <circle cx="60" cy="60" r="54" class="ring-fg" id="ring-fg"/>
            </svg>
            <span class="ring-num" id="ring-num" role="timer" aria-label="Seconds remaining"></span>
          </div>
        </div>
        <div class="progress-dots" id="dots" role="img" aria-label="Session progress"></div>
        <div class="controls">
          <button class="btn" id="btn-pause">Pause</button>
          <button class="btn btn-skip" id="btn-skip">Skip this move</button>
        </div>
        <button class="linkish" id="btn-end">End session</button>
      </section>
    </main>`;

  const captionEl = document.getElementById('caption');
  coach.onCaption = (t) => { captionEl.textContent = t; };
  coach.enabled = profile.voiceOn;
  coach.voiceURI = profile.voiceURI;
  sound.sfxOn = profile.sfxOn;
  music.volume = profile.musicVol;

  // avatar (graceful fallback if WebGL is unavailable)
  const canvas = document.getElementById('avatar-canvas');
  try {
    avatar = new Avatar(canvas, getCharacter(profile.character));
    avatar.start();
  } catch (e) {
    console.warn('avatar unavailable:', e);
    canvas.closest('.stage').classList.add('no-webgl');
  }

  const dots = document.getElementById('dots');
  dots.innerHTML = plan.items.map((it, i) =>
    `<span class="dot" data-i="${i}" title="${esc(it.ex.name)}"></span>`).join('');

  const ringFg = document.getElementById('ring-fg');
  const CIRC = 2 * Math.PI * 54;
  ringFg.style.strokeDasharray = String(CIRC);

  player = new Player({
    plan,
    phrases: PHRASES,
    name: profile.name,
    style: profile.style,
    musicOn: profile.musicOn,
    hooks: {
      moveStart(item, idx) {
        document.getElementById('move-name').textContent = item.ex.name;
        document.getElementById('block-chip').textContent =
          { warmup: 'warm-up', main: 'main', winddown: 'wind-down', close: 'breathe' }[item.block] || '';
        dots.setAttribute('aria-label', `Move ${idx + 1} of ${plan.items.length}: ${item.ex.name}`);
        dots.querySelectorAll('.dot').forEach((d, i) => {
          d.classList.toggle('done', i < idx);
          d.classList.toggle('now', i === idx);
        });
        if (avatar) avatar.setPose(POSES[item.ex.id] || null);
      },
      mirror(m) { if (avatar) avatar.setMirrored(m); },
      render(pl) {
        const item = pl.plan.items[pl.idx];
        const total = pl.phase === 'ready' ? TRANSITION_SECS : (item ? item.secs : 1);
        const frac = Math.max(pl.remaining / total, 0);
        ringFg.style.strokeDashoffset = String(CIRC * (1 - frac));
        document.getElementById('ring-num').textContent = pl.phase === 'paused' ? '⏸' : String(Math.max(pl.remaining, 0));
        document.getElementById('btn-pause').textContent = pl.phase === 'paused' ? 'Resume' : 'Pause';
      },
      done(stats) { finishSession(stats); },
    },
  });

  window.__nrjf = { player, store, avatar };   // QA handle (local-only, harmless)

  document.getElementById('btn-pause').addEventListener('click', () => {
    if (player.phase === 'paused') player.resume();
    else player.pause();
  });
  document.getElementById('btn-skip').addEventListener('click', () => player.skip());
  document.getElementById('btn-end').addEventListener('click', () => {
    if (confirm('End this session?')) player.endEarly();
  });

  player.start();
}

function teardownSession() {
  if (player) { try { player.dispose(); } catch { /* ok */ } }
  player = null;
  coach.cancel();
  coach.onCaption = null;
  music.stop();
  if (avatar) { avatar.dispose(); avatar = null; }
}

function finishSession(stats) {
  const lvlBefore = levelInfo(store.progress.totalMins).level;
  const stageBefore = gardenStage(store.progress.sessions.length, GARDEN_STAGE_SESSIONS);
  let newBadges = [];
  if (stats.minsMoved >= 1 && stats.completedIds.length > 0) {
    recordSession(store, stats);
    newBadges = checkBadges(store, GARDEN_STAGE_SESSIONS);
    save();
  }
  const lvlAfter = levelInfo(store.progress.totalMins);
  const stageAfter = gardenStage(store.progress.sessions.length, GARDEN_STAGE_SESSIONS);
  const leveledUp = lvlAfter.level > lvlBefore;
  const grew = stageAfter > stageBefore;
  const streak = streakInfo(store.progress.sessions);

  if (avatar) { avatar.dispose(); avatar = null; }
  player = null;
  // leave the #session hash so a reload cannot silently auto-start a new session
  history.replaceState(null, '', location.pathname + location.search + '#done');

  if (!stats.minsMoved || !stats.completedIds.length) {
    go('#');
    return;
  }

  celebrate();
  if (newBadges.length) setTimeout(() => sound.sparkle(), 700);

  const badgeCards = newBadges.map((id) => {
    const b = BADGES.find((x) => x.id === id);
    return b ? `<div class="badge-pop">${b.icon}<div><strong>${esc(b.name)}</strong><br><small>${esc(b.desc)}</small></div></div>` : '';
  }).join('');

  app.innerHTML = `
    <main class="narrow done-screen">
      <section class="card center">
        <div class="garden-svg small">${gardenSVG(stageAfter)}</div>
        <h2>That was lovely. 🌼</h2>
        <p class="done-stats"><strong>${stats.minsMoved} min</strong> moved · streak <strong>${streak.count} day${streak.count === 1 ? '' : 's'}</strong></p>
        ${grew ? '<p class="grew">Your garden just grew. Go look at it.</p>' : ''}
        ${leveledUp ? `<p class="grew">Level up! You are now <strong>${lvlAfter.title}</strong>.</p>` : ''}
        ${badgeCards ? `<div class="badge-pops"><h3>New badge${newBadges.length > 1 ? 's' : ''}!</h3>${badgeCards}</div>` : ''}
        <button class="btn btn-primary" id="btn-home">Back to my garden</button>
      </section>
    </main>`;
  document.getElementById('btn-home').addEventListener('click', () => go('#'));
}

// ---------------------------------------------------------------- badges

function badgesScreen() {
  const earned = store.progress.badges;
  app.innerHTML = `
    <header class="topbar"><a class="back" href="#">← Back</a><h1 class="page-title">Badges</h1></header>
    <main class="narrow">
      <div class="badge-grid">
        ${BADGES.map((b) => {
          const got = earned[b.id];
          return `<div class="badge-cell ${got ? 'earned' : 'locked'}">
            <div class="badge-icon">${b.icon}</div>
            <strong>${esc(b.name)}</strong>
            <small>${esc(b.desc)}</small>
            ${got ? `<span class="badge-date">${new Date(got).toLocaleDateString()}</span>` : '<span class="badge-lock" aria-label="Locked">🔒</span>'}
          </div>`;
        }).join('')}
      </div>
    </main>`;
}

// ---------------------------------------------------------------- settings

function portraitSVG(c) {
  return `<svg viewBox="0 0 64 64" aria-hidden="true">
    <circle cx="32" cy="36" r="17" fill="${c.skin}"/>
    <path d="M14 34 a18 18 0 0 1 36 0 l-3 -10 a16 16 0 0 0 -30 0 z" fill="${c.hair}"/>
    <circle cx="32" cy="20" r="11" fill="${c.hair}"/>
    <circle cx="26" cy="36" r="2" fill="#27201b"/><circle cx="38" cy="36" r="2" fill="#27201b"/>
    <path d="M27 43 q5 4 10 0" stroke="#27201b" stroke-width="2" fill="none" stroke-linecap="round"/>
    <rect x="20" y="52" width="24" height="10" rx="5" fill="${c.top}"/>
  </svg>`;
}

function settingsScreen() {
  const p = store.profile;
  const voices = coach.listVoices();
  app.innerHTML = `
    <header class="topbar"><a class="back" href="#">← Back</a><h1 class="page-title">Settings</h1></header>
    <main class="narrow settings">
      <section class="card">
        <label for="set-name"><strong>Your first name</strong> <small>(optional — your coach will use it)</small></label>
        <input id="set-name" type="text" maxlength="20" autocomplete="given-name" value="${esc(p.name)}" placeholder="e.g. Dana">
      </section>

      <section class="card">
        <strong>Your coach</strong>
        <div class="char-grid">
          ${CHARACTERS.map((c) => `
            <button class="char-card ${c.id === p.character ? 'selected' : ''}" data-id="${c.id}" aria-pressed="${c.id === p.character}">
              ${portraitSVG(c)}<span>${c.name}</span><small>${c.blurb}</small>
            </button>`).join('')}
        </div>
      </section>

      <section class="card">
        <strong>Coach voice</strong>
        <div class="row">
          <select id="set-voice" aria-label="Voice">
            <option value="">System default</option>
            ${voices.map((v) => `<option value="${esc(v.uri)}" ${v.uri === p.voiceURI ? 'selected' : ''}>${esc(v.name)} (${esc(v.lang)})</option>`).join('')}
          </select>
          <button class="btn" id="btn-test-voice">Hear it</button>
        </div>
        <label class="toggle"><input type="checkbox" id="set-voiceon" ${p.voiceOn ? 'checked' : ''}> Voice on <small>(captions always stay on)</small></label>
      </section>

      <section class="card">
        <strong>Encouragement style</strong>
        <div class="style-row" role="group" aria-label="Encouragement style">
          ${['gentle', 'cheerleader', 'funny'].map((s) => `
            <button class="style-card ${p.style === s ? 'selected' : ''}" data-style="${s}" aria-pressed="${p.style === s}">
              <strong>${s[0].toUpperCase() + s.slice(1)}</strong>
              <small>${esc(pick(PHRASES.styles[s].mid))}</small>
            </button>`).join('')}
        </div>
      </section>

      <section class="card">
        <strong>Sound</strong>
        <label class="toggle"><input type="checkbox" id="set-sfx" ${p.sfxOn ? 'checked' : ''}> Gentle chimes</label>
        <label class="toggle"><input type="checkbox" id="set-music" ${p.musicOn ? 'checked' : ''}> Background music <small>(soft generated ambience)</small></label>
        <label for="set-vol" class="vol-label">Music volume</label>
        <input type="range" id="set-vol" min="0" max="1" step="0.05" value="${p.musicVol}">
      </section>

      <section class="card">
        <p><a href="#safety">Read the safety notice</a></p>
        <p class="privacy-inline">🌱 Everything you see in this app is stored only on this device. Nothing is ever uploaded, because there is nowhere to upload it to.</p>
        <button class="btn btn-danger" id="btn-reset">Reset my data</button>
      </section>
    </main>`;

  document.getElementById('set-name').addEventListener('change', (e) => {
    p.name = e.target.value.trim().slice(0, 20);
    save();
  });
  app.querySelectorAll('.char-card').forEach((b) => b.addEventListener('click', () => {
    p.character = b.dataset.id;
    save();
    settingsScreen();
  }));
  const voiceSel = document.getElementById('set-voice');
  voiceSel.addEventListener('change', (e) => {
    p.voiceURI = e.target.value;
    save();
  });
  // iOS/Safari load voices late — repopulate when the user opens the picker
  const repopulate = () => {
    const vs = coach.listVoices();
    if (vs.length + 1 === voiceSel.options.length) return;
    voiceSel.innerHTML = '<option value="">System default</option>' +
      vs.map((v) => `<option value="${esc(v.uri)}" ${v.uri === p.voiceURI ? 'selected' : ''}>${esc(v.name)} (${esc(v.lang)})</option>`).join('');
  };
  voiceSel.addEventListener('focus', repopulate);
  setTimeout(repopulate, 800);
  document.getElementById('btn-test-voice').addEventListener('click', () => {
    sound.unlock();
    coach.enabled = true;
    coach.voiceURI = p.voiceURI;
    coach.speak(personalize(pick(PHRASES.styles[p.style].welcome), p.name), { interrupt: true });
    coach.enabled = p.voiceOn;
  });
  document.getElementById('set-voiceon').addEventListener('change', (e) => {
    p.voiceOn = e.target.checked; coach.enabled = p.voiceOn; save();
  });
  app.querySelectorAll('.style-card').forEach((b) => b.addEventListener('click', () => {
    p.style = b.dataset.style;
    save();
    settingsScreen();
  }));
  document.getElementById('set-sfx').addEventListener('change', (e) => {
    p.sfxOn = e.target.checked; sound.sfxOn = p.sfxOn; save();
    if (p.sfxOn) { sound.unlock(); sound.chime(); }
  });
  document.getElementById('set-music').addEventListener('change', (e) => {
    p.musicOn = e.target.checked; save();
    if (p.musicOn) { sound.unlock(); music.volume = p.musicVol; music.start(); }
    else music.stop();
  });
  document.getElementById('set-vol').addEventListener('input', (e) => {
    p.musicVol = parseFloat(e.target.value);
    music.setVolume(p.musicVol);
    save();
  });
  document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm('Reset everything? Your garden, streak, badges and settings will start over. This cannot be undone.')) {
      resetAll();
      go('#');
    }
  });
}

// ---------------------------------------------------------------- router

let Avatar = null; // resolved lazily so the home screen renders instantly
let renderSeq = 0; // guards against concurrent renders across the async import

async function ensureAvatarClass() {
  if (!Avatar) {
    const mod = await import('./avatar.js');
    Avatar = mod.Avatar;
  }
}

async function render() {
  const seq = ++renderSeq;
  teardownSession();
  window.scrollTo(0, 0);
  const h = location.hash || '#';
  if (h.startsWith('#session-')) {
    const mins = parseInt(h.slice(9), 10);
    if ([7, 15, 30, 45].includes(mins)) {
      await ensureAvatarClass();
      if (seq !== renderSeq) return; // superseded while three.js loaded
      sessionScreen(mins);
      return;
    }
  }
  if (h === '#badges') return badgesScreen();
  if (h === '#settings') return settingsScreen();
  if (h === '#safety') return safetyScreen();
  homeScreen();
}

window.addEventListener('hashchange', render);

// dev visual QA: ?dev=poses or ?dev=garden
const devMode = new URLSearchParams(location.search).get('dev');
if (devMode) {
  import('./dev.js').then((m) => m.runDev(devMode));
} else {
  render();
}

// PWA service worker (registered late so first paint wins)
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline still optional */ });
  });
}
