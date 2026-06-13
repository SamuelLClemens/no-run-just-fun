// Optional photoreal instructor (beta). A Mixamo-rigged character (Vera) loaded
// from a compressed GLB and driven by the SAME pose intent as the lean avatar.
// Mirrors the public API of Avatar (avatar.js) so main.js can use either one.
//
// Key detail: Blender pose-bone rotations are RELATIVE to rest, but Three.js
// bone.quaternion is ABSOLUTE local. So we snapshot each bone's rest quaternion
// at load and compose rest × delta — that makes Blender-calibrated values
// transfer verbatim. See /tmp/ygt_v3 calibration notes / docs.
//
// This is opt-in and falls back to the lean avatar on weak devices; budget is
// one 28k-tri skinned mesh, no shadows, clamped pixel ratio.

import * as THREE from '../lib/three.module.min.js';
import { GLTFLoader } from '../lib/jsm/loaders/GLTFLoader.js';

const D2R = Math.PI / 180;
const MODEL_URL = new URL('../models/vera.glb', import.meta.url).href;

// --- device gate + persisted verdict (mirrors the natural-voice approach) ---
const VERDICT_KEY = 'nrjf.ri';   // '' | 'slow'

export function realisticVerdict() {
  try { return localStorage.getItem(VERDICT_KEY) || ''; } catch { return ''; }
}
export function markRealisticSlow() {
  try { localStorage.setItem(VERDICT_KEY, 'slow'); } catch { /* ignore */ }
}
export function clearRealisticVerdict() {
  try { localStorage.removeItem(VERDICT_KEY); } catch { /* ignore */ }
}

// True only when the device looks capable AND has not already proven too slow.
// Cheap, synchronous, conservative — the in-session watchdog catches the rest.
export function realisticInstructorSupported() {
  if (realisticVerdict() === 'slow') return false;
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return false;
  } catch { return false; }
  // very low-end heuristic: few cores AND little memory
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  if (cores <= 2 && mem <= 2) return false;
  return true;
}

// Standing posture: bring arms down from the T-pose, soft elbows, easy head.
// Values are bone-LOCAL Euler degrees relative to rest (calibrated in Blender).
// NOTE: GLTFLoader strips the ':' from Mixamo node names, so 'mixamorig:LeftArm'
// loads as 'mixamorigLeftArm'. Keys here use the sanitized form.
const POSTURE_STAND = {
  'mixamorigLeftArm': [72, 0, 8],
  'mixamorigRightArm': [72, 0, 8],
  'mixamorigLeftForeArm': [10, 0, 12],
  'mixamorigRightForeArm': [10, 0, 12],
  'mixamorigSpine': [-2, 0, 0],
};

// Bones that carry the breathing layer (gentle chest rise on inhale).
const BREATH = {
  'mixamorigSpine1': [-1.0, 0, 0],
  'mixamorigSpine2': [-1.4, 0, 0],
  'mixamorigNeck': [0.7, 0, 0],
};

export class RealisticAvatar {
  constructor(canvas, character) {
    this.canvas = canvas;
    this.character = character;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.05, 50);
    this.camera.position.set(0, 1.0, 3.4);
    this.camera.lookAt(0, 1.0, 0);

    this.scene.add(new THREE.HemisphereLight(0xeaf6ec, 0x6f8f78, 1.15));
    const sun = new THREE.DirectionalLight(0xfff4d6, 1.35);
    sun.position.set(1.6, 2.8, 2.4);
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0xdfe8ff, 0.5);
    fill.position.set(-2.0, 1.2, 1.5);
    this.scene.add(fill);

    // soft blob shadow grounds her
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.42, 24),
      new THREE.MeshBasicMaterial({ color: 0x1f4d2e, transparent: true, opacity: 0.16 }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.002;
    this.scene.add(shadow);

    this.pivot = new THREE.Group();      // presentation turntable
    this.pivot.rotation.y = 14 * D2R;
    this.scene.add(this.pivot);

    this.model = null;
    this.skeleton = null;
    this.rest = new Map();               // bone -> rest quaternion
    this.bones = new Map();              // name -> bone
    this.ready = false;
    this.mirrored = false;
    this.time = 0;
    this._raf = 0;
    this._last = 0;
    this._running = false;
    this._pendingStart = false;
    this.speed = 1;
    this._breathe = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    this._onVis = () => {
      if (document.hidden) this._pause();
      else if (this._running) this._resume();
    };
    document.addEventListener('visibilitychange', this._onVis);
    this._ro = new ResizeObserver(() => this.resize());
    this._ro.observe(canvas.parentElement || canvas);
    this.resize();

    this._load();
  }

  _load() {
    const loader = new GLTFLoader();
    loader.load(MODEL_URL, (gltf) => {
      const root = gltf.scene;
      root.traverse((o) => {
        if (o.isMesh) { o.frustumCulled = false; o.castShadow = false; }
        if (o.isSkinnedMesh && o.skeleton) this.skeleton = o.skeleton;
      });
      // collect bones + rest snapshot
      root.traverse((o) => {
        if (o.isBone) {
          this.bones.set(o.name, o);
          this.rest.set(o.name, o.quaternion.clone());
        }
      });
      // ground her: feet at y=0, centered; scale to a friendly height.
      // Force world-matrix updates before EACH measurement — a freshly loaded
      // skinned scene has stale matrices and reports a wrong bbox otherwise.
      this.pivot.add(root);
      this.model = root;
      root.updateMatrixWorld(true);
      let box = new THREE.Box3().setFromObject(root);
      let size = new THREE.Vector3(); box.getSize(size);
      const targetH = 1.7;
      const s = size.y > 0 ? targetH / size.y : 1;
      root.scale.multiplyScalar(s);
      root.updateMatrixWorld(true);
      box = new THREE.Box3().setFromObject(root);
      const center = new THREE.Vector3(); box.getCenter(center);
      root.position.x -= center.x;
      root.position.z -= center.z;
      root.position.y -= box.min.y;
      root.updateMatrixWorld(true);
      this.ready = true;
      this._applyPosture(POSTURE_STAND);
      this._frameCamera();
      this._renderOnce();
      if (this._pendingStart) this._resume();
    }, undefined, (err) => {
      console.warn('realistic avatar failed to load:', err);
      // surface a flag so the caller can fall back to the lean avatar
      this.failed = true;
      if (typeof this.onError === 'function') this.onError(err);
    });
  }

  _frameCamera() {
    // fit full body in a portrait stage; aim at mid-torso
    this.model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(this.model);
    const h = box.max.y - box.min.y;
    const midY = box.min.y + h * 0.56;
    const fov = this.camera.fov * D2R;
    const dist = (h * 0.62) / Math.tan(fov / 2);
    this.camera.position.set(0, midY, dist);
    this.camera.lookAt(0, midY, 0);
    this.camera.updateProjectionMatrix();
  }

  // compose rest × delta(euler degrees) onto a bone
  _setBone(name, deg, extraDeg) {
    const bone = this.bones.get(name);
    const rest = this.rest.get(name);
    if (!bone || !rest) return;
    const e = new THREE.Euler(deg[0] * D2R, deg[1] * D2R, deg[2] * D2R, 'XYZ');
    const q = rest.clone().multiply(new THREE.Quaternion().setFromEuler(e));
    if (extraDeg) {
      const e2 = new THREE.Euler(extraDeg[0] * D2R, extraDeg[1] * D2R, extraDeg[2] * D2R, 'XYZ');
      q.multiply(new THREE.Quaternion().setFromEuler(e2));
    }
    bone.quaternion.copy(q);
  }

  _applyPosture(posture) {
    if (!this.ready) return;
    for (const [name, deg] of Object.entries(posture)) this._setBone(name, deg);
  }

  // ---- public API (mirrors Avatar) ----
  setCharacter(character) { this.character = character; /* single mesh for now */ }

  setPose(/* def */) {
    // v3.0: standing demo posture for every move (per-exercise motion: v3.1).
    this.time = 0;
  }

  setMirrored(m) { this.mirrored = m; if (this.pivot) this.pivot.scale.x = m ? -1 : 1; }

  resize() {
    const el = this.canvas.parentElement || this.canvas;
    const w = Math.max(el.clientWidth, 60);
    const h = Math.max(el.clientHeight, 60);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this._renderOnce();
  }

  start() { this._running = true; if (this.ready) this._resume(); else this._pendingStart = true; }
  stop() { this._running = false; this._pause(); }

  _pause() { cancelAnimationFrame(this._raf); this._raf = 0; this._last = 0; }

  _resume() {
    if (this._raf || !this.ready) return;
    const loop = (ts) => {
      this._raf = requestAnimationFrame(loop);
      const dt = this._last ? Math.min((ts - this._last) / 1000, 0.1) : 0.016;
      this._last = ts;
      this._tick(dt);
    };
    this._raf = requestAnimationFrame(loop);
  }

  _tick(dt) {
    this.time += dt * this.speed;
    if (this._breathe) {
      const breath = Math.sin(this.time * (Math.PI * 2) / 3.8);
      for (const [name, amp] of Object.entries(BREATH)) {
        const base = POSTURE_STAND[name] || [0, 0, 0];
        this._setBone(name, base, [amp[0] * breath, amp[1] * breath, amp[2] * breath]);
      }
      // very soft weight-shift sway
      this.pivot.rotation.y = (14 + 1.4 * Math.sin(this.time * (Math.PI * 2) / 7.5)) * D2R;
    }
    this.renderer.render(this.scene, this.camera);
  }

  _renderOnce() { if (this.renderer && this.scene && this.ready) this.renderer.render(this.scene, this.camera); }

  // Sample sustained fps once she is loaded AND warmed up, then — only if the
  // device is genuinely, steadily slow — persist a 'slow' verdict so the NEXT
  // session quietly uses the lean coach. We deliberately do NOT hot-swap her
  // out mid-session: that is jarring, and the first seconds after load are full
  // of one-off jank (decode, shader compile) that must not count. A backgrounded
  // tab (throttled rAF) is ignored so it cannot trigger a false 'slow'.
  watchPerformance(onSlow, { warmupMs = 2200, seconds = 5, minFps = 22 } = {}) {
    const run = () => {
      if (!this.ready) { setTimeout(run, 200); return; }
      let start = 0, frames = 0, aborted = false;
      const tick = (ts) => {
        if (!this._running || aborted) return;
        if (document.hidden) { aborted = true; return; } // throttled — do not judge
        if (!start) start = ts;
        frames++;
        const el = ts - start;
        if (el >= seconds * 1000) {
          const fps = frames / (el / 1000);
          if (fps < minFps) { markRealisticSlow(); if (typeof onSlow === 'function') onSlow(fps); }
          return;
        }
        requestAnimationFrame(tick);
      };
      setTimeout(() => { if (this._running) requestAnimationFrame(tick); }, warmupMs);
    };
    run();
  }

  showPose(/* def, phase */) { this._applyPosture(POSTURE_STAND); this._renderOnce(); }

  dispose() {
    this.stop();
    document.removeEventListener('visibilitychange', this._onVis);
    this._ro.disconnect();
    if (this.model) {
      this.model.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          for (const m of mats) { if (m.map) m.map.dispose(); m.dispose(); }
        }
      });
    }
    this.renderer.dispose();
  }
}
