// Streaks (with grace days), XP levels, garden stages, badges.
// Consistency makes the garden bloom — never intensity.

import { todayKey } from './state.js';

export const LEVELS = [
  { mins: 0,   title: 'Couch Sprout' },
  { mins: 15,  title: 'Seedling' },
  { mins: 45,  title: 'Gentle Mover' },
  { mins: 90,  title: 'Bloomer' },
  { mins: 150, title: 'Bendy Bean' },
  { mins: 230, title: 'Sunflower' },
  { mins: 330, title: 'Flexi Phenom' },
  { mins: 450, title: 'Mighty Mama' },
  { mins: 600, title: 'Zen Dynamo' },
  { mins: 800, title: 'Legend (Still No Running)' },
];

export function levelInfo(totalMins) {
  let level = 1;
  for (let i = 0; i < LEVELS.length; i++) {
    if (totalMins >= LEVELS[i].mins) level = i + 1;
  }
  const cur = LEVELS[level - 1];
  const next = LEVELS[level] || null;
  const span = next ? next.mins - cur.mins : 1;
  const into = totalMins - cur.mins;
  return {
    level,
    title: cur.title,
    nextTitle: next ? next.title : null,
    minsToNext: next ? next.mins - totalMins : 0,
    pct: next ? Math.min(into / span, 1) : 1,
  };
}

function shiftDay(key, delta) {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d + delta);
  return todayKey(dt);
}

// Streak rule: a missed day is forgiven (a "grace day") as long as no rolling
// 7-day stretch contains more than 2 misses. The streak is anchored on the
// most recent active day; up to 2 missed days between then and today keep it
// alive but "pending". Count = chain length (active + forgiven days).
export function streakInfo(sessions, today = todayKey()) {
  const dates = new Set(sessions.map((s) => s.date));
  const zero = { count: 0, graceDays: [], pendingToday: false, usedGraceRecently: false };
  if (!dates.size) return zero;
  const doneToday = dates.has(today);

  // find the most recent active day within forgivable reach of today
  let lastActive = null;
  let tailMisses = 0;
  for (let k = 0; k <= 3; k++) {
    const d = shiftDay(today, -k);
    if (dates.has(d)) { lastActive = d; tailMisses = Math.max(k - 1, 0); break; }
  }
  if (!lastActive) return zero;

  const windowArr = [];        // walked consecutive days, newest-first: true = miss
  for (let i = 0; i < tailMisses; i++) windowArr.push(true);
  const seq = [];              // chain from lastActive backward: true = active day
  const graceDays = [];
  let day = lastActive;
  for (let i = 0; i < 730; i++) {
    if (dates.has(day)) {
      seq.push(true);
      windowArr.push(false);
    } else {
      const recentMisses = windowArr.slice(-6).filter(Boolean).length;
      if (recentMisses + 1 > 2) break;
      seq.push(false);
      windowArr.push(true);
      graceDays.push(day);
    }
    if (windowArr.length > 7) windowArr.shift();
    day = shiftDay(day, -1);
  }
  // the chain must START on an active day — trim grace at the old end
  while (seq.length && !seq[seq.length - 1]) {
    seq.pop();
    graceDays.pop();
  }

  const recentCutoff = shiftDay(today, -3);
  return {
    count: seq.length,
    graceDays,
    pendingToday: !doneToday && seq.length > 0,
    usedGraceRecently: tailMisses > 0 || graceDays.some((d) => d >= recentCutoff),
  };
}

export function gardenStage(totalSessions, thresholds) {
  let stage = 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (totalSessions >= thresholds[i]) stage = i;
  }
  return stage;
}

function sessionsInLast7Days(sessions, today) {
  const cutoffs = new Set();
  for (let i = 0; i < 7; i++) cutoffs.add(shiftDay(today, -i));
  return sessions.filter((s) => cutoffs.has(s.date)).length;
}

// Evaluate all badge conditions; award anything newly earned.
// Returns array of newly earned badge ids (in canonical order).
export function checkBadges(store, gardenThresholds) {
  const p = store.progress;
  const today = todayKey();
  const streak = streakInfo(p.sessions, today);
  const lvl = levelInfo(p.totalMins);
  const stage = gardenStage(p.sessions.length, gardenThresholds);
  const last = p.sessions[p.sessions.length - 1];

  const conditions = {
    'first-session': p.sessions.length >= 1,
    'three-in-week': sessionsInLast7Days(p.sessions, today) >= 3,
    'streak-7': streak.count >= 7,
    'first-45': p.durationsTried.includes(45),
    'ten-breath-closes': p.breathCloses >= 10,
    'early-bird': !!last && last.startHour < 8,
    'night-owl': !!last && last.startHour >= 21,
    'comeback-queen': streak.usedGraceRecently && !!last && last.date === today && streak.count > 1,
    'garden-bloom': stage >= 6,
    'level-5': lvl.level >= 5,
    'sessions-25': p.sessions.length >= 25,
    'all-durations': [7, 15, 30, 45].every((d) => p.durationsTried.includes(d)),
    'bridge-toddlers': (p.moveCounts['bridge'] || 0) >= 10,
    'dog-days': (p.moveCounts['down-dog'] || 0) >= 10,
  };

  const earned = [];
  for (const [id, ok] of Object.entries(conditions)) {
    if (ok && !p.badges[id]) {
      p.badges[id] = new Date().toISOString();
      earned.push(id);
    }
  }
  return earned;
}

// Record a finished session into the store (caller saves + celebrates).
export function recordSession(store, { durationKey, minsMoved, completedIds, skippedIds, breathClose, startHour, closeId, early }) {
  const p = store.progress;
  p.sessions.push({
    date: todayKey(),
    mins: minsMoved,
    durationKey,
    startHour,
    breathClose: !!breathClose,
    completed: completedIds,
    skipped: skippedIds,
  });
  p.totalMins += minsMoved;
  if (breathClose) p.breathCloses += 1;
  // duration badges require actually finishing the session, not just starting it
  if (!early && !p.durationsTried.includes(durationKey)) p.durationsTried.push(durationKey);
  for (const id of completedIds) p.moveCounts[id] = (p.moveCounts[id] || 0) + 1;
  if (closeId) p.lastCloseId = closeId;
}
