// You Got This! - garden.js
// A flat-illustration garden bed that grows with the user, stage 0 through 8.
// Pure SVG strings, single-quoted attributes, palette colors only, no scripts,
// no external references. Each stage accumulates everything from the stage
// before it - nothing ever disappears from the garden.

// Palette
const GREEN = '#5BA869';
const YELLOW = '#FFD45C';
const SKY = '#7EC4E8';
const CORAL = '#F58F7C';
const DARK = '#1F4D2E';
const CREAM = '#FDF9F0';

// Ground line where plants are rooted
const G = 162;

// ---------- shared shape helpers ----------

function sky() {
  return `<rect x='0' y='0' width='360' height='200' fill='${SKY}'/>` +
    cloud(74, 34, 1) +
    cloud(196, 22, 0.7);
}

function cloud(x, y, k) {
  return `<g fill='${CREAM}' opacity='0.9'>` +
    `<ellipse cx='${x}' cy='${y}' rx='${22 * k}' ry='${9 * k}'/>` +
    `<ellipse cx='${x - 13 * k}' cy='${y + 3 * k}' rx='${13 * k}' ry='${6 * k}'/>` +
    `<ellipse cx='${x + 14 * k}' cy='${y + 3 * k}' rx='${12 * k}' ry='${5.5 * k}'/>` +
    `</g>`;
}

function sun() {
  let rays = '';
  for (let a = 0; a < 360; a += 45) {
    rays += `<line x1='300' y1='12' x2='300' y2='5' stroke='${YELLOW}' stroke-width='3.5' stroke-linecap='round' transform='rotate(${a} 300 42)'/>`;
  }
  return `<g>` +
    `<circle cx='300' cy='42' r='29' fill='${YELLOW}' opacity='0.3'/>` +
    `<circle cx='300' cy='42' r='21' fill='${YELLOW}'/>` +
    rays +
    `</g>`;
}

function soil() {
  return `<path d='M0 160 Q 90 150 180 152 Q 270 154 360 160 L 360 200 L 0 200 Z' fill='${DARK}'/>` +
    `<path d='M0 160 Q 90 150 180 152 Q 270 154 360 160 L 360 170 Q 270 164 180 162 Q 90 160 0 170 Z' fill='${GREEN}'/>`;
}

function star(x, y, r) {
  const i = r * 0.38;
  return `<path d='M${x} ${y - r} L${x + i} ${y - i} L${x + r} ${y} L${x + i} ${y + i} L${x} ${y + r} L${x - i} ${y + i} L${x - r} ${y} L${x - i} ${y - i} Z' fill='${YELLOW}' stroke='${CORAL}' stroke-width='1' stroke-linejoin='round'/>`;
}

function leafPair(x, y) {
  return `<g fill='${GREEN}'>` +
    `<ellipse cx='${x - 7}' cy='${y}' rx='7' ry='3.6' transform='rotate(-24 ${x - 7} ${y})'/>` +
    `<ellipse cx='${x + 7}' cy='${y}' rx='7' ry='3.6' transform='rotate(24 ${x + 7} ${y})'/>` +
    `</g>`;
}

function sprout(x) {
  return `<g>` +
    `<path d='M${x} ${G} Q ${x - 2} ${G - 10} ${x} ${G - 20}' stroke='${GREEN}' stroke-width='3.5' fill='none' stroke-linecap='round'/>` +
    leafPair(x, G - 16) +
    `</g>`;
}

function bud(x) {
  const top = G - 28;
  return `<g>` +
    `<path d='M${x} ${G} Q ${x + 2} ${G - 14} ${x} ${top + 8}' stroke='${GREEN}' stroke-width='3' fill='none' stroke-linecap='round'/>` +
    leafPair(x, G - 12) +
    `<ellipse cx='${x}' cy='${top}' rx='5' ry='8' fill='${CORAL}'/>` +
    `<path d='M${x - 4.5} ${top + 5} Q ${x} ${top + 11} ${x + 4.5} ${top + 5} Q ${x} ${top + 7.5} ${x - 4.5} ${top + 5} Z' fill='${GREEN}'/>` +
    `</g>`;
}

const PETAL_OFFSETS = [[0, -8], [7.6, -2.5], [4.7, 6.5], [-4.7, 6.5], [-7.6, -2.5]];

function flower(x, color, h) {
  const cy = G - h;
  const center = color === YELLOW ? CORAL : YELLOW;
  let head = '';
  for (const [dx, dy] of PETAL_OFFSETS) {
    head += `<circle cx='${x + dx}' cy='${cy + dy}' r='6' fill='${color}'/>`;
  }
  return `<g>` +
    `<path d='M${x} ${G} Q ${x - 3} ${G - h / 2} ${x} ${cy + 6}' stroke='${GREEN}' stroke-width='3' fill='none' stroke-linecap='round'/>` +
    leafPair(x, G - h * 0.45) +
    head +
    `<circle cx='${x}' cy='${cy}' r='4.5' fill='${center}'/>` +
    `</g>`;
}

function tuft(x) {
  const g = G + 1;
  return `<g stroke='${GREEN}' stroke-width='2.5' stroke-linecap='round' fill='none'>` +
    `<path d='M${x} ${g} Q ${x - 3} ${g - 7} ${x - 5} ${g - 11}'/>` +
    `<path d='M${x} ${g} Q ${x} ${g - 8} ${x} ${g - 13}'/>` +
    `<path d='M${x} ${g} Q ${x + 3} ${g - 7} ${x + 5} ${g - 11}'/>` +
    `</g>`;
}

function butterfly(x, y) {
  return `<g>` +
    `<ellipse cx='${x - 6}' cy='${y - 4}' rx='7' ry='5' fill='${CORAL}' transform='rotate(-28 ${x - 6} ${y - 4})'/>` +
    `<ellipse cx='${x + 6}' cy='${y - 4}' rx='7' ry='5' fill='${CORAL}' transform='rotate(28 ${x + 6} ${y - 4})'/>` +
    `<ellipse cx='${x - 5}' cy='${y + 4}' rx='5' ry='4' fill='${YELLOW}' transform='rotate(20 ${x - 5} ${y + 4})'/>` +
    `<ellipse cx='${x + 5}' cy='${y + 4}' rx='5' ry='4' fill='${YELLOW}' transform='rotate(-20 ${x + 5} ${y + 4})'/>` +
    `<ellipse cx='${x}' cy='${y}' rx='1.8' ry='6' fill='${DARK}'/>` +
    `<path d='M${x - 1} ${y - 6} Q ${x - 4} ${y - 10} ${x - 5} ${y - 12}' stroke='${DARK}' stroke-width='1' fill='none' stroke-linecap='round'/>` +
    `<path d='M${x + 1} ${y - 6} Q ${x + 4} ${y - 10} ${x + 5} ${y - 12}' stroke='${DARK}' stroke-width='1' fill='none' stroke-linecap='round'/>` +
    `</g>`;
}

function bee(x, y) {
  return `<g>` +
    `<ellipse cx='${x - 3}' cy='${y - 6}' rx='4' ry='2.5' fill='${CREAM}' opacity='0.85' transform='rotate(-30 ${x - 3} ${y - 6})'/>` +
    `<ellipse cx='${x + 3}' cy='${y - 6}' rx='4' ry='2.5' fill='${CREAM}' opacity='0.85' transform='rotate(30 ${x + 3} ${y - 6})'/>` +
    `<ellipse cx='${x}' cy='${y}' rx='7' ry='5' fill='${YELLOW}'/>` +
    `<path d='M${x - 2} ${y - 4.6} Q ${x - 3.5} ${y} ${x - 2} ${y + 4.6}' stroke='${DARK}' stroke-width='2' fill='none'/>` +
    `<path d='M${x + 2} ${y - 4.6} Q ${x + 3.5} ${y} ${x + 2} ${y + 4.6}' stroke='${DARK}' stroke-width='2' fill='none'/>` +
    `<circle cx='${x + 6.5}' cy='${y - 1}' r='1.2' fill='${DARK}'/>` +
    `</g>`;
}

function sunflower(x) {
  const cy = 74;
  let petals = '';
  for (let a = 0; a < 360; a += 30) {
    petals += `<ellipse cx='${x}' cy='${cy - 17}' rx='5' ry='12' fill='${YELLOW}' transform='rotate(${a} ${x} ${cy})'/>`;
  }
  return `<g>` +
    `<path d='M${x} ${G} Q ${x + 5} ${(G + cy) / 2} ${x} ${cy + 14}' stroke='${GREEN}' stroke-width='5' fill='none' stroke-linecap='round'/>` +
    `<ellipse cx='${x - 10}' cy='${G - 34}' rx='11' ry='5' fill='${GREEN}' transform='rotate(-30 ${x - 10} ${G - 34})'/>` +
    `<ellipse cx='${x + 10}' cy='${G - 52}' rx='11' ry='5' fill='${GREEN}' transform='rotate(30 ${x + 10} ${G - 52})'/>` +
    petals +
    `<circle cx='${x}' cy='${cy}' r='11' fill='${DARK}'/>` +
    `<circle cx='${x - 3}' cy='${cy - 2}' r='1.5' fill='${GREEN}'/>` +
    `<circle cx='${x + 3.5}' cy='${cy + 2}' r='1.5' fill='${GREEN}'/>` +
    `<circle cx='${x + 2}' cy='${cy - 4}' r='1.5' fill='${GREEN}'/>` +
    `</g>`;
}

function arch() {
  const pts = [[150, 140], [150, 110], [156, 80], [180, 60], [204, 80], [210, 110], [210, 140]];
  let blooms = '';
  let i = 0;
  for (const [bx, by] of pts) {
    const c = i % 2 === 0 ? CORAL : YELLOW;
    blooms += `<circle cx='${bx}' cy='${by}' r='4' fill='${c}'/>`;
    blooms += `<circle cx='${bx + (i % 2 === 0 ? 5 : -5)}' cy='${by + 3}' r='2.2' fill='${GREEN}'/>`;
    i++;
  }
  return `<g>` +
    `<path d='M150 162 L150 100 Q 150 60 180 60 Q 210 60 210 100 L210 162' stroke='${DARK}' stroke-width='6' fill='none' stroke-linecap='round'/>` +
    blooms +
    `</g>`;
}

// ---------- stage composition ----------
// Index N holds only what stage N ADDS; gardenSVG concatenates 0..N so the
// garden accumulates and every earlier element stays put.

const STAGE_ADDS = [
  // 0: bare soil and one hopeful seed star
  [star(180, 158, 7)],
  // 1: the first sprout rises right where the seed was planted
  [sprout(180)],
  // 2: a second sprout and a fresh leaf pair on the first
  [sprout(240), leafPair(180, G - 22)],
  // 3: a small bud, still keeping its secret
  [bud(120)],
  // 4: the first flower opens
  [flower(268, CORAL, 40)],
  // 5: three flowers now
  [flower(96, YELLOW, 34), flower(308, CORAL, 30)],
  // 6: a proper flower bed, and the first butterfly arrives
  [flower(66, CORAL, 38), flower(340, YELLOW, 24), tuft(30), tuft(146), butterfly(132, 82)],
  // 7: lush bed, a second butterfly, and one busy bee
  [flower(170, CORAL, 50), flower(232, YELLOW, 36), butterfly(250, 62), bee(226, 92)],
  // 8: full bloom - tall sunflower, garden arch, one more flower under it
  [sunflower(46), arch(), flower(196, YELLOW, 30)],
];

export const GARDEN_STAGE_SESSIONS = [0, 1, 3, 6, 10, 15, 21, 28, 36];

export function gardenSVG(stage) {
  const n = Math.max(0, Math.min(8, Math.floor(Number(stage) || 0)));
  const parts = [sky(), sun(), soil()];
  for (let i = 0; i <= n; i++) {
    parts.push(STAGE_ADDS[i].join(''));
  }
  return `<svg viewBox='0 0 360 200' role='img' aria-label='Your garden at stage ${n} of 8'>` + parts.join('') + `</svg>`;
}
