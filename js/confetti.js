// Reward moment: petals + circles burst on a canvas overlay.
// Respects prefers-reduced-motion (renders a gentle static bloom instead).

const COLORS = ['#5BA869', '#FFD45C', '#7EC4E8', '#F58F7C', '#A9D8B2', '#F4A300'];

export function celebrate(duration = 1800) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);

  if (reduced) {
    // single soft bloom, no motion
    ctx.globalAlpha = 0.85;
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = COLORS[i % COLORS.length];
      const a = (i / 40) * Math.PI * 2;
      const r = 60 + (i % 5) * 22;
      ctx.beginPath();
      ctx.arc(innerWidth / 2 + Math.cos(a) * r, innerHeight * 0.4 + Math.sin(a) * r, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    setTimeout(() => canvas.remove(), 1200);
    return;
  }

  const parts = [];
  for (let i = 0; i < 90; i++) {
    parts.push({
      x: innerWidth / 2 + (Math.random() - 0.5) * 80,
      y: innerHeight * 0.45,
      vx: (Math.random() - 0.5) * 9,
      vy: -Math.random() * 11 - 3,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      w: 6 + Math.random() * 7,
      h: 4 + Math.random() * 5,
      color: COLORS[i % COLORS.length],
      petal: Math.random() > 0.5,
    });
  }

  const t0 = performance.now();
  function frame(t) {
    const elapsed = t - t0;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.25;
      p.vx *= 0.99;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(1 - elapsed / duration, 0);
      if (p.petal) {
        ctx.beginPath();
        ctx.ellipse(0, 0, p.w / 2, p.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    }
    if (elapsed < duration) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}
