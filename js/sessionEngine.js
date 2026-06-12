// Assembles a session from the tagged library, shaped like a home yoga
// practice: a seated breath arrival, ~20% gentle warm-up, ~60% main block
// alternating strength/mobility/stretch, ~20% wind-down, and a breathing +
// kind-thoughts close. Arrive, move, settle, close. Every time.

const TRANSITION_SECS = 6; // "get ready" gap between moves

// Seated breath moves that can open a practice (the close stays unique).
const ARRIVAL_IDS = ['box-breath', 'pelvic-breath'];

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fillFromPool(pool, budget, used, allowRepeats = false, exclude = new Set()) {
  const out = [];
  let remaining = budget;
  let candidates = shuffle(pool.filter((e) => !used.has(e.id) && !exclude.has(e.id)));
  while (remaining > 20) {
    if (!candidates.length) {
      if (!allowRepeats) break;
      const lastId = out.length ? out[out.length - 1].id : '';
      candidates = shuffle(pool.filter((e) => e.id !== lastId && !exclude.has(e.id)));
      if (!candidates.length) break;
    }
    const ex = candidates.shift();
    out.push(ex);
    used.add(ex.id);
    remaining -= ex.secs + TRANSITION_SECS;
  }
  return out;
}

// Alternate strength with mobility/stretch so the main block has rhythm.
function alternate(strength, soft) {
  const out = [];
  const s = strength.slice();
  const m = soft.slice();
  let turn = 'strength';
  while (s.length || m.length) {
    if (turn === 'strength' && s.length) out.push(s.shift());
    else if (m.length) out.push(m.shift());
    else if (s.length) out.push(s.shift());
    turn = turn === 'strength' ? 'soft' : 'strength';
  }
  return out;
}

export function buildSession(durationMins, exercises, { lastCloseId = '' } = {}) {
  const total = durationMins * 60;
  const used = new Set();

  // 1) the close — always last, always breath (picked first so the
  //    arrival never duplicates it)
  const closePool = exercises.filter((e) => e.blocks.includes('close'));
  let closeChoices = closePool.filter((e) => e.id !== lastCloseId);
  if (!closeChoices.length) closeChoices = closePool;
  const close = shuffle(closeChoices)[0];
  used.add(close.id);
  const reserved = new Set([close.id]); // the close may never appear mid-session

  // 2) the arrival — every practice begins seated, with breath
  const arrival = shuffle(
    exercises.filter((e) => ARRIVAL_IDS.includes(e.id) && e.id !== close.id),
  )[0];
  used.add(arrival.id);
  reserved.add(arrival.id);

  const warmBudget = Math.max(total * 0.2 - (arrival.secs + TRANSITION_SECS), 0);
  const windBudget = Math.max(total * 0.2 - (close.secs + TRANSITION_SECS), 0);
  const mainBudget = total * 0.6;

  // long sessions may revisit moves once a pool runs dry
  const allowRepeats = durationMins >= 30;

  // 3) warm-up
  const warm = fillFromPool(
    exercises.filter((e) => e.blocks.includes('warmup')),
    warmBudget, used, allowRepeats, reserved,
  );

  // 4) main block, alternating
  const mainPool = exercises.filter((e) => e.blocks.includes('main'));
  const strengthPool = mainPool.filter((e) => e.tags.includes('strength'));
  const softPool = mainPool.filter((e) => !e.tags.includes('strength'));
  const pickedStrength = fillFromPool(strengthPool, mainBudget * 0.55, used, allowRepeats, reserved);
  const pickedSoft = fillFromPool(softPool, mainBudget * 0.45, used, allowRepeats, reserved);
  const main = alternate(pickedStrength, pickedSoft);

  // 5) wind-down
  const wind = fillFromPool(
    exercises.filter((e) => e.blocks.includes('winddown')),
    windBudget, used, allowRepeats, reserved,
  );

  const asItem = (block) => (ex) => ({ ex, secs: ex.secs, block });
  const items = [
    asItem('arrive')(arrival),
    ...warm.map(asItem('warmup')),
    ...main.map(asItem('main')),
    ...wind.map(asItem('winddown')),
    asItem('close')(close),
  ];

  const totalSecs = items.reduce((s, i) => s + i.secs + TRANSITION_SECS, 0);
  return { items, totalSecs, durationKey: durationMins, closeId: close.id };
}

export { TRANSITION_SECS };
