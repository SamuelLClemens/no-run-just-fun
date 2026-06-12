// Developer visual QA, reachable via ?dev=poses / ?dev=anim / ?dev=garden.
// Renders every pose (one shared WebGL context), every animation as a
// phase strip, or every garden stage as a reviewable grid. Not in the UI.

import { EXERCISES } from './data/exercises.js';
import { POSES } from './data/poses.js';
import { gardenSVG } from './data/garden.js';
import { CHARACTERS } from './characters.js';

export async function runDev(mode) {
  const app = document.getElementById('app');
  if (mode === 'garden') {
    app.innerHTML = '<div class="dev-grid">' + Array.from({ length: 9 }, (_, i) =>
      `<div class="dev-cell"><div class="garden-svg">${gardenSVG(i)}</div><small>stage ${i}</small></div>`,
    ).join('') + '</div>';
    return;
  }
  if (mode === 'anim') {
    // each exercise as a strip of loop phases — motion review in one image
    const { Avatar } = await import('./avatar.js');
    const work = document.createElement('canvas');
    work.width = 260; work.height = 260;
    work.style.cssText = 'position:fixed;left:-9999px;width:260px;height:260px';
    document.body.appendChild(work);
    const av = new Avatar(work, CHARACTERS[0]);
    av.resize();
    const PHASES = [0.06, 0.3, 0.55, 0.8];
    const rows = [];
    for (const ex of EXERCISES) {
      const pose = POSES[ex.id];
      if (!pose) { rows.push(`<div class="dev-cell"><div class="dev-missing">NO POSE</div><small>${ex.id}</small></div>`); continue; }
      const imgs = PHASES.map((ph) => {
        av.showPose(pose, ph);
        return `<img src="${av.renderer.domElement.toDataURL()}" width="130" height="130" alt="${ex.id} @${ph}">`;
      }).join('');
      rows.push(`<div class="dev-cell" style="grid-column:1/-1"><div style="display:flex;gap:4px">${imgs}</div><small>${ex.id} — ${pose.frames.length} frames over ${pose.loopSecs}s${pose.mirrorHalfway ? ' (sided)' : ''}</small></div>`);
    }
    av.dispose();
    work.remove();
    app.innerHTML = '<div class="dev-grid">' + rows.join('') + '</div>';
    return;
  }
  if (mode === 'poses') {
    const { Avatar } = await import('./avatar.js');
    const work = document.createElement('canvas');
    work.width = 300; work.height = 300;
    work.style.cssText = 'position:fixed;left:-9999px;width:300px;height:300px';
    document.body.appendChild(work);
    const av = new Avatar(work, CHARACTERS[0]);
    av.resize();
    const cells = [];
    const phaseParam = parseFloat(new URLSearchParams(location.search).get('phase') || '0.35');
    for (const ex of EXERCISES) {
      const pose = POSES[ex.id];
      let img = '';
      if (pose) {
        av.showPose(pose, phaseParam);
        img = `<img src="${av.renderer.domElement.toDataURL()}" width="220" height="220" alt="${ex.id}">`;
      } else {
        img = '<div class="dev-missing">NO POSE</div>';
      }
      cells.push(`<div class="dev-cell">${img}<small>${ex.id} (${pose ? pose.base : '—'})</small></div>`);
    }
    av.dispose();
    work.remove();
    app.innerHTML = '<div class="dev-grid">' + cells.join('') + '</div>';
  }
}
