// The 3D instructor: a stylized low-poly humanoid built from Three.js
// primitives, posed by pure keyframe data (see docs/rig-spec.md).
// Budget: tiny scene, no shadows, clamped pixel ratio — 60fps on mid iPhones.

import * as THREE from '../lib/three.module.min.js';

export const JOINT_NAMES = [
  'spine', 'chest', 'neck', 'head',
  'shoulderL', 'shoulderR', 'elbowL', 'elbowR',
  'hipL', 'hipR', 'kneeL', 'kneeR', 'ankleL', 'ankleR',
];

const MIRROR_SWAP = {
  shoulderL: 'shoulderR', shoulderR: 'shoulderL',
  elbowL: 'elbowR', elbowR: 'elbowL',
  hipL: 'hipR', hipR: 'hipL',
  kneeL: 'kneeR', kneeR: 'kneeL',
  ankleL: 'ankleR', ankleR: 'ankleL',
};

// Base positions: root placement + supporting joints (degrees).
export const BASES = {
  stand: {
    root: { pos: [0, 0.89, 0], rot: [0, 0, 0] },
    joints: { shoulderL: [0, 0, 8], shoulderR: [0, 0, -8] },
  },
  tabletop: {
    root: { pos: [0, 0.47, 0], rot: [0, 0, 0] },
    joints: {
      spine: [45, 0, 0], chest: [45, 0, 0], head: [-55, 0, 0],
      shoulderL: [-100, 0, 6], shoulderR: [-100, 0, -6],
      kneeL: [90, 0, 0], kneeR: [90, 0, 0],
      ankleL: [60, 0, 0], ankleR: [60, 0, 0],
    },
  },
  supine: {
    root: { pos: [0, 0.14, 0], rot: [-90, 0, 0] },
    joints: { shoulderL: [0, 0, 14], shoulderR: [0, 0, -14], head: [8, 0, 0] },
  },
  prone: {
    root: { pos: [0, 0.14, 0], rot: [90, 0, 0] },
    joints: { shoulderL: [0, 0, 12], shoulderR: [0, 0, -12], head: [-14, 0, 0] },
  },
  seated: {
    root: { pos: [0, 0.17, 0], rot: [0, 0, 0] },
    joints: {
      hipL: [-90, 0, 4], hipR: [-90, 0, -4], kneeL: [12, 0, 0], kneeR: [12, 0, 0],
      shoulderL: [10, 0, 10], shoulderR: [10, 0, -10],
    },
  },
  kneel: {
    root: { pos: [0, 0.50, 0], rot: [0, 0, 0] },
    joints: {
      kneeL: [90, 0, 0], kneeR: [90, 0, 0],
      ankleL: [62, 0, 0], ankleR: [62, 0, 0],
      shoulderL: [0, 0, 8], shoulderR: [0, 0, -8],
    },
  },
  sidelying: {
    root: { pos: [0, 0.18, 0], rot: [0, 12, -90] },
    joints: { head: [0, 0, 10], shoulderL: [20, 0, 10], shoulderR: [20, 0, -10] },
  },
};

const D2R = Math.PI / 180;

// Gentle inhale/exhale layered on any pose (degrees at full inhale):
// chest rises, shoulders lift a touch, head answers — never frozen mid-hold.
const BREATH_OFFSETS = {
  chest: [1.5, 0, 0], head: [-0.7, 0, 0],
  shoulderL: [0, 0, 0.6], shoulderR: [0, 0, -0.6],
};

function smoothstep(x) { return x * x * (3 - 2 * x); }

function lerp3(a, b, s) {
  return [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s];
}

// Presentation yaw per base: floor poses are shown in profile so they read
// clearly from the front-facing camera; standing poses get a gentle angle.
export const BASE_YAW = {
  stand: 16, seated: 26, kneel: 32, tabletop: 64, supine: 72, prone: 72, sidelying: 0,
};

// Pre-resolve every frame against its base so interpolation is a flat lerp.
export function compilePose(def) {
  const base = BASES[def.base] || BASES.stand;
  const frames = def.frames.map((f) => {
    const joints = {};
    for (const j of JOINT_NAMES) {
      joints[j] = (f.joints && f.joints[j]) || base.joints[j] || [0, 0, 0];
    }
    const r = f.root || {};
    return {
      t: f.t,
      joints,
      rootPos: r.pos || base.root.pos,
      rootRot: r.rot || base.root.rot,
    };
  });
  return {
    frames,
    loopSecs: def.loopSecs || 6,
    mirrorHalfway: !!def.mirrorHalfway,
    yaw: BASE_YAW[def.base] != null ? BASE_YAW[def.base] : 16,
  };
}

export function evalPose(compiled, phase) {
  const fr = compiled.frames;
  let a = fr[0], b = fr[fr.length - 1];
  for (let i = 0; i < fr.length - 1; i++) {
    if (phase >= fr[i].t && phase <= fr[i + 1].t) { a = fr[i]; b = fr[i + 1]; break; }
  }
  const span = Math.max(b.t - a.t, 1e-6);
  const s = smoothstep(Math.min(Math.max((phase - a.t) / span, 0), 1));
  const joints = {};
  for (const j of JOINT_NAMES) joints[j] = lerp3(a.joints[j], b.joints[j], s);
  return {
    joints,
    rootPos: lerp3(a.rootPos, b.rootPos, s),
    rootRot: lerp3(a.rootRot, b.rootRot, s),
  };
}

export function mirrorState(st) {
  const joints = {};
  for (const j of JOINT_NAMES) {
    const src = MIRROR_SWAP[j] || j;
    const v = st.joints[src];
    joints[j] = [v[0], -v[1], -v[2]];
  }
  return {
    joints,
    rootPos: [-st.rootPos[0], st.rootPos[1], st.rootPos[2]],
    rootRot: [st.rootRot[0], -st.rootRot[1], -st.rootRot[2]],
  };
}

// ---------- geometry ----------

function mat(color) {
  // smooth shading: soft rounded limbs instead of faceted panels
  return new THREE.MeshLambertMaterial({ color, flatShading: false });
}

function capsule(parent, r, len, material, y, z = 0) {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 3, 12), material);
  m.position.set(0, y, z);
  parent.add(m);
  return m;
}

function sphere(parent, r, material, x = 0, y = 0, z = 0, ws = 12, hs = 9) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), material);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

function box(parent, w, h, d, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

function joint(parent, x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}

function buildHair(head, style, hairMat) {
  // skull cap for everyone
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.122, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55),
    hairMat,
  );
  cap.position.set(0, 0.115, -0.018);
  cap.rotation.x = -0.35;
  head.add(cap);
  if (style === 'curls') {
    sphere(head, 0.062, hairMat, -0.075, 0.19, -0.02, 6, 5);
    sphere(head, 0.066, hairMat, 0.07, 0.185, -0.03, 6, 5);
    sphere(head, 0.06, hairMat, 0, 0.215, -0.055, 6, 5);
    sphere(head, 0.055, hairMat, -0.09, 0.10, -0.07, 6, 5);
    sphere(head, 0.055, hairMat, 0.09, 0.10, -0.07, 6, 5);
  } else if (style === 'bob') {
    sphere(head, 0.075, hairMat, -0.095, 0.06, -0.03, 6, 5);
    sphere(head, 0.075, hairMat, 0.095, 0.06, -0.03, 6, 5);
    sphere(head, 0.09, hairMat, 0, 0.08, -0.085, 6, 5);
  } else if (style === 'bun') {
    sphere(head, 0.052, hairMat, 0, 0.235, -0.05, 6, 5);
  } else if (style === 'ponytail') {
    const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.038, 0.15, 2, 6), hairMat);
    tail.position.set(0, 0.10, -0.14);
    tail.rotation.x = 0.85;
    head.add(tail);
  } else if (style === 'loose') {
    // shoulder-length loose hair: side curtains + soft back volume
    for (const sx of [-1, 1]) {
      const curtain = new THREE.Mesh(new THREE.CapsuleGeometry(0.042, 0.13, 2, 6), hairMat);
      curtain.position.set(sx * 0.10, 0.015, -0.025);
      curtain.rotation.z = sx * -0.12;
      head.add(curtain);
    }
    const back = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.10, 2, 6), hairMat);
    back.position.set(0, 0.03, -0.085);
    head.add(back);
  }
}

function buildRig(character) {
  const root = new THREE.Group();
  const joints = {};

  const skin = mat(character.skin);
  const top = mat(character.top);
  const bottom = mat(character.bottom);
  const hairMat = mat(character.hair);
  const dark = mat('#27201b');

  // pelvis
  box(root, 0.26, 0.15, 0.16, bottom, 0, -0.01, 0);

  // torso chain
  joints.spine = joint(root, 0, 0.07, 0);
  capsule(joints.spine, 0.115, 0.14, top, 0.10);
  joints.chest = joint(joints.spine, 0, 0.21, 0);
  const chestMesh = capsule(joints.chest, 0.13, 0.16, top, 0.09);
  chestMesh.scale.set(1.18, 1, 0.92);
  joints.neck = joint(joints.chest, 0, 0.23, 0);
  capsule(joints.neck, 0.042, 0.05, skin, 0.02);
  joints.head = joint(joints.neck, 0, 0.08, 0);
  sphere(joints.head, 0.115, skin, 0, 0.10, 0, 18, 14);
  // face: eyes that can blink, brows, a soft smile
  const eyes = [
    sphere(joints.head, 0.0135, dark, -0.042, 0.12, 0.102, 8, 6),
    sphere(joints.head, 0.0135, dark, 0.042, 0.12, 0.102, 8, 6),
  ];
  for (const sx of [-1, 1]) {
    const brow = box(joints.head, 0.036, 0.0085, 0.012, hairMat, sx * 0.043, 0.152, 0.098);
    brow.rotation.z = sx * -0.12;
  }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.0065, 6, 14, Math.PI * 0.75), dark);
  smile.position.set(0, 0.066, 0.103);
  smile.rotation.z = Math.PI + (Math.PI * 0.125);
  joints.head.add(smile);
  buildHair(joints.head, character.hairStyle, hairMat);

  // arms (sleeve on upper arm, skin below)
  for (const side of ['L', 'R']) {
    const sx = side === 'L' ? 1 : -1;
    const sh = joint(joints.chest, sx * 0.185, 0.16, 0);
    joints['shoulder' + side] = sh;
    capsule(sh, 0.052, 0.17, top, -0.115);
    const el = joint(sh, 0, -0.26, 0);
    joints['elbow' + side] = el;
    capsule(el, 0.045, 0.16, skin, -0.105);
    // hand: flattened, slightly elongated — reads as a palm, not a mitten ball
    const hand = sphere(el, 0.055, skin, 0, -0.25, 0.008, 10, 8);
    hand.scale.set(0.85, 1.15, 0.62);
    hand.rotation.x = 0.18;
  }

  // legs (leggings, bare feet)
  for (const side of ['L', 'R']) {
    const sx = side === 'L' ? 1 : -1;
    const hp = joint(root, sx * 0.095, -0.05, 0);
    joints['hip' + side] = hp;
    capsule(hp, 0.072, 0.25, bottom, -0.165);
    const kn = joint(hp, 0, -0.39, 0);
    joints['knee' + side] = kn;
    capsule(kn, 0.056, 0.24, bottom, -0.155);
    const an = joint(kn, 0, -0.375, 0);
    joints['ankle' + side] = an;
    box(an, 0.085, 0.055, 0.19, skin, 0, -0.035, 0.045);
  }

  return { root, joints, eyes };
}

// ---------- avatar ----------

export class Avatar {
  constructor(canvas, character) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 20);
    this.camera.position.set(0, 1.0, 3.6);
    this.camera.lookAt(0, 0.68, 0);

    this.scene.add(new THREE.HemisphereLight(0xeaf6ec, 0x7da583, 1.05));
    const sun = new THREE.DirectionalLight(0xfff4d6, 1.0);
    sun.position.set(1.4, 2.4, 2.2);
    this.scene.add(sun);

    // soft blob shadow
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.62, 22),
      new THREE.MeshBasicMaterial({ color: 0x1f4d2e, transparent: true, opacity: 0.14 }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.004;
    this.scene.add(shadow);

    this.pivot = new THREE.Group(); // presentation turntable
    this.scene.add(this.pivot);
    this.rig = null;
    this.current = null;          // eased state
    this.compiled = null;
    this.mirrored = false;
    this._yaw = 16;
    this.time = 0;
    this._raf = 0;
    this._last = 0;
    this._running = false;
    this.speed = 1;

    // subtle always-on breathing layer; decorative, so it honors reduced motion
    this._breathe = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    this.setCharacter(character);

    this._onVis = () => {
      if (document.hidden) this._pause();
      else if (this._running) this._resume();
    };
    document.addEventListener('visibilitychange', this._onVis);

    this._ro = new ResizeObserver(() => this.resize());
    this._ro.observe(canvas.parentElement || canvas);
    this.resize();
  }

  setCharacter(character) {
    if (this.rig) {
      this.pivot.remove(this.rig.root);
      this.rig.root.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    }
    this.rig = buildRig(character);
    this.pivot.add(this.rig.root);
    if (this.current) this._apply(this.current); // keep pose through swap
    this._renderOnce();
  }

  setPose(def) {
    this.compiled = def ? compilePose(def) : null;
    this.time = 0;
  }

  setMirrored(m) { this.mirrored = m; }

  resize() {
    const el = this.canvas.parentElement || this.canvas;
    const w = Math.max(el.clientWidth, 60);
    const h = Math.max(el.clientHeight, 60);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this._renderOnce();
  }

  start() {
    this._running = true;
    this._resume();
  }

  stop() {
    this._running = false;
    this._pause();
  }

  _pause() {
    cancelAnimationFrame(this._raf);
    this._raf = 0;
    this._last = 0;
  }

  _resume() {
    if (this._raf) return;
    const loop = (ts) => {
      this._raf = requestAnimationFrame(loop);
      const dt = this._last ? Math.min((ts - this._last) / 1000, 0.1) : 0.016;
      this._last = ts;
      this._tick(dt);
    };
    this._raf = requestAnimationFrame(loop);
  }

  _tick(dt) {
    if (this.compiled) {
      this.time += dt * this.speed;
      const phase = (this.time % this.compiled.loopSecs) / this.compiled.loopSecs;
      let target = evalPose(this.compiled, phase);
      if (this.mirrored) target = mirrorState(target);
      const k = 1 - Math.exp(-dt * 6);
      if (!this.current) this.current = target;
      else {
        const cur = this.current;
        for (const j of JOINT_NAMES) cur.joints[j] = lerp3(cur.joints[j], target.joints[j], k);
        cur.rootPos = lerp3(cur.rootPos, target.rootPos, k);
        cur.rootRot = lerp3(cur.rootRot, target.rootRot, k);
      }
      const yawTarget = (this.mirrored ? -1 : 1) * this.compiled.yaw;
      this._yaw += (yawTarget - this._yaw) * k;
      this.pivot.rotation.y = this._yaw * D2R;
      const breath = this._breathe ? Math.sin(this.time * (Math.PI * 2) / 3.6) : 0;
      this._apply(this.current, breath);
      if (this._breathe && this.rig.eyes) {
        // natural blink: a quick 0.12s close on an uneven ~4.1s cycle
        const blink = (this.time % 4.1) < 0.12 ? 0.12 : 1;
        for (const eye of this.rig.eyes) eye.scale.y = blink;
      }
    }
    this.renderer.render(this.scene, this.camera);
  }

  _apply(st, breath = 0) {
    const { root, joints } = this.rig;
    root.position.set(st.rootPos[0], st.rootPos[1], st.rootPos[2]);
    root.rotation.set(st.rootRot[0] * D2R, st.rootRot[1] * D2R, st.rootRot[2] * D2R, 'XYZ');
    for (const j of JOINT_NAMES) {
      const v = st.joints[j];
      let x = v[0], y = v[1], z = v[2];
      const off = breath ? BREATH_OFFSETS[j] : null;
      if (off) { x += off[0] * breath; y += off[1] * breath; z += off[2] * breath; }
      joints[j].rotation.set(x * D2R, y * D2R, z * D2R, 'XYZ');
    }
  }

  _renderOnce() {
    if (this.renderer && this.scene) this.renderer.render(this.scene, this.camera);
  }

  // Render a single static pose (for previews/dev) without starting the loop.
  showPose(def, phase = 0.35) {
    const compiled = compilePose(def);
    const st = evalPose(compiled, phase);
    this.current = st;
    this._yaw = compiled.yaw;
    this.pivot.rotation.y = this._yaw * D2R;
    this._apply(st);
    this._renderOnce();
  }

  dispose() {
    this.stop();
    document.removeEventListener('visibilitychange', this._onVis);
    this._ro.disconnect();
    this.renderer.dispose();
  }
}
