# No Run Just Fun — Avatar Rig & Pose Specification (v1)

The instructor is a procedural low-poly humanoid built from Three.js primitives.
Poses are pure data: per-joint Euler angles in **degrees**, interpolated between
keyframes with smoothstep easing, looping forever.

## Coordinate conventions (memorize these)

- The character **faces +z** (toward the camera).
- **+x is the character's LEFT** (the viewer's right).
- +y is up. Euler order is XYZ. All angles in degrees.
- Floor is y = 0.

## Joint list (15 rotational joints + root)

| joint      | what rotates                | key axes |
|------------|-----------------------------|----------|
| `spine`    | lower torso from hips       | x + = bend forward, y + = twist to char's left, z + = side-bend to char's right |
| `chest`    | upper torso from mid-spine  | same semantics as spine |
| `neck`     | neck from shoulders         | same |
| `head`     | head from neck              | x + = nod down/forward, x − = look up |
| `shoulderL`| whole left arm (hangs along −y at zero) | x − = swing arm FORWARD/up (−90 = horizontal forward, −170 = overhead); x + = behind body; zL + = lift arm sideways away from body (abduction); y = upper-arm twist |
| `shoulderR`| mirror of L                 | x same; **z − = abduction** (mirror) |
| `elbowL/R` | forearm                     | x only: 0 = straight, **negative = bend** (hand moves toward front of body), range −150..0 |
| `hipL`     | whole left leg (hangs along −y) | x − = knee/thigh raises FORWARD (−90 = thigh horizontal, seated); x + = leg behind body; zL + = leg out to the side (abduction); y = thigh twist (toes turn out: hipL y + ≈ turn-out) |
| `hipR`     | mirror                      | x same; **z − = abduction**, y − = turn-out |
| `kneeL/R`  | shin                        | x only: 0 = straight, **positive = bend** (heel toward bottom), range 0..150 |
| `ankleL/R` | foot (toes point +z at zero) | x + = point toes down, x − = flex toes up |

`root` controls the pelvis in world space: `{ pos:[x,y,z], rot:[x,y,z] }`.
Standing pelvis height is **0.95**. Thigh length 0.40, shin 0.38, foot reaches ~0.10 below ankle.

## Base positions (use these — they set root + supporting joints correctly)

| base       | description | what it sets |
|------------|-------------|--------------|
| `stand`    | upright, arms relaxed at sides | root y 0.95, shoulders slightly abducted |
| `tabletop` | hands and knees, torso horizontal | root y ≈ 0.46, spine+chest bent fwd 90° total, arms pillared down, knees 90° |
| `supine`   | lying on back, face up, head away from camera | root rot x −90, root y 0.14 |
| `prone`    | lying face down | root rot x +90, root y 0.14 |
| `seated`   | sitting on floor, legs long in front, torso tall | root y 0.16, hips x −90 |
| `kneel`    | upright kneeling, knees down, shins back | root y 0.52, knees 90°, toes back |
| `sidelying`| lying on the LEFT side, body across the screen | root rot z −90 (+ small y), root y 0.18 |

A pose keyframe only lists joints that DIFFER from its base.

## Pose data format

```js
export const POSES_X = {
  'exercise-id': {
    base: 'tabletop',          // one of the bases above
    loopSecs: 6,               // duration of one full loop, 3–10
    mirrorHalfway: false,      // true for sided moves: engine mirrors L/R at half-time cue
    frames: [
      { t: 0.0, joints: { spine: [35,0,0], head: [-20,0,0] } },
      { t: 0.5, joints: { spine: [60,0,0], head: [ 25,0,0] }, root: { pos:[0,0.50,0] } },
      { t: 1.0, joints: { spine: [35,0,0], head: [-20,0,0] } },  // last frame should match first for clean loops
    ],
  },
}
```

- `t` runs 0 → 1 over one loop; frames must be sorted; first frame at t 0, last at t 1.
- `joints` values are `[x, y, z]` degree triples. Omitted joints stay at base values.
- Optional per-frame `root: { pos:[...], rot:[...] }` overrides.
- Keep every angle in −180..180. Knees only 0..150. Elbows only −150..0.

## Worked examples (copy these patterns)

**Bridge lifts** (supine, hips rise and fall):
```js
'bridge': {
  base: 'supine', loopSecs: 6, mirrorHalfway: false,
  frames: [
    { t: 0.0, joints: { hipL:[-50,0,0], hipR:[-50,0,0], kneeL:[100,0,0], kneeR:[100,0,0] } },             // knees bent, feet flat
    { t: 0.5, joints: { hipL:[ 10,0,0], hipR:[ 10,0,0], kneeL:[100,0,0], kneeR:[100,0,0],
                        spine:[-12,0,0] }, root: { pos:[0,0.30,0], rot:[-60,0,0] } },                      // hips lifted, body a ramp
    { t: 1.0, joints: { hipL:[-50,0,0], hipR:[-50,0,0], kneeL:[100,0,0], kneeR:[100,0,0] } },
  ],
}
```

**Warrior II** (standing, left leg forward bent, arms out; engine mirrors halfway):
```js
'warrior2': {
  base: 'stand', loopSecs: 8, mirrorHalfway: true,
  frames: [
    { t: 0.0, joints: { hipL:[-35,0,15], kneeL:[50,0,0], hipR:[20,0,-20],
                        shoulderL:[-90,0,0], shoulderR:[0,0,-90], head:[0,25,0] },
      root: { pos:[0,0.82,0] } },
    { t: 0.5, joints: { hipL:[-40,0,15], kneeL:[58,0,0], hipR:[22,0,-20],
                        shoulderL:[-90,0,0], shoulderR:[0,0,-90], head:[0,25,0] },
      root: { pos:[0,0.80,0] } },          // gentle sink deeper, breathing
    { t: 1.0, joints: { hipL:[-35,0,15], kneeL:[50,0,0], hipR:[20,0,-20],
                        shoulderL:[-90,0,0], shoulderR:[0,0,-90], head:[0,25,0] },
      root: { pos:[0,0.82,0] } },
  ],
}
```

**Box breathing** (seated, almost still — tiny ribcage rise):
```js
'box-breath': {
  base: 'seated', loopSecs: 16, mirrorHalfway: false,
  frames: [
    { t: 0.0,  joints: { kneeL:[40,0,0], kneeR:[40,0,0], hipL:[-90,20,0], hipR:[-90,-20,0], chest:[2,0,0] } },
    { t: 0.25, joints: { kneeL:[40,0,0], kneeR:[40,0,0], hipL:[-90,20,0], hipR:[-90,-20,0], chest:[-4,0,0] } },
    { t: 0.5,  joints: { kneeL:[40,0,0], kneeR:[40,0,0], hipL:[-90,20,0], hipR:[-90,-20,0], chest:[-4,0,0] } },
    { t: 0.75, joints: { kneeL:[40,0,0], kneeR:[40,0,0], hipL:[-90,20,0], hipR:[-90,-20,0], chest:[2,0,0] } },
    { t: 1.0,  joints: { kneeL:[40,0,0], kneeR:[40,0,0], hipL:[-90,20,0], hipR:[-90,-20,0], chest:[2,0,0] } },
  ],
}
```

## Sanity rules

- A standing pose with both feet on the floor needs root y ≈ 0.95 minus however
  much the knees are bent (knee 50° ≈ root y 0.82).
- In tabletop, do not move the arms unless the exercise asks for it — they are pillars.
- Side-lying and supine poses: remember the whole body is rotated by root.rot;
  joint semantics stay in BODY space (hip x − still folds the leg toward the chest).
- Movements should look SLOW and gentle. Prefer 2–4 keyframes, loopSecs 5–10
  (16 for breathing). No jerky extremes.
