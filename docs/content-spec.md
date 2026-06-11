# No Run Just Fun — Content Specification (v1)

The single source of truth for all generated content. Tone everywhere: warm,
funny, encouraging. NEVER punishing, never about weight loss, never "bounce
back" language, never mocking. Audience: women 30–40, often postpartum
(possibly years postpartum). Sentence case microcopy, plain verbs.

## Safety constraints (hard rules)

- Core work must be diastasis-recti-safe: NO crunches, NO sit-ups, NO full
  planks. Use bird dog, bridges, knee-down variants, breath-led core work.
- Everything low-impact. No jumping.
- Every "why" and cue must be honest — no medical overclaiming. These are
  exercise guidance, not medical advice.

## The 29 movements (ids are FROZEN — never rename)

| id | name | tags | blocks | sided | movement description (for pose + copy) |
|----|------|------|--------|-------|------------------------------------------|
| neck-rolls | Slow Neck Circles | mobility | warmup | no | standing tall, ear drifts toward one shoulder then the other, slow half-circles |
| shoulder-rolls | Shoulder Rolls | mobility | warmup | no | standing, shoulders ride up toward ears, roll back and melt down |
| cat-cow | Cat–Cow | mobility | warmup,main | no | tabletop; alternate arching belly down + chest up (cow) and rounding spine up, head tucks (cat) |
| side-reach | Standing Side Reach | stretch | warmup | no | standing, one arm sweeps overhead and the body bends gently the other way; alternates sides in the loop |
| hip-circles | Standing Hip Circles | mobility | warmup | no | hands on hips, slow generous circles of the pelvis |
| arm-sweeps | Sunrise Arm Sweeps | mobility,breath | warmup | no | inhale: arms sweep wide and overhead; exhale: float down |
| bridge | Bridge Lifts | strength | main | no | on the back, knees bent, feet flat; hips lift to a ramp, pause, lower with control |
| bird-dog | Bird Dog | strength | main | yes | tabletop; opposite arm and leg reach long, hold steady, return; switch |
| chair-pose | Chair Pose | strength | main | no | standing, hips sink back like sitting into a chair, arms reach forward-up, hold and breathe |
| warrior2 | Warrior II | strength | main | yes | wide stance, front knee bends over ankle, arms stretch wide, gaze over front hand |
| squats | Invisible Chair Squats | strength | main | no | slow squats: sit back toward an imaginary chair, press through heels to stand |
| clamshell | Clamshells | strength | main | yes | lying on the side, knees bent and stacked; top knee opens like a shell, heels stay together |
| kickbacks | Tabletop Kickbacks | strength | main | yes | tabletop; one bent knee lifts behind, sole of foot presses toward the ceiling, lower with control |
| baby-cobra | Baby Cobra | strength | main | no | lying face down, hands under shoulders, gentle low chest lift, shoulders away from ears |
| tree-pose | Tree Pose | strength | main | yes | standing on one leg, other foot rests on the calf, hands together at the heart |
| goddess | Goddess Hold | strength | main | no | wide stance, toes turned out, knees bend over toes, arms in cactus shape, proud hold |
| down-dog | Downward Dog | stretch | main | no | hands and feet on the floor, hips lift high into an upside-down V, heels reach down, gentle pedaling |
| low-lunge | Low Lunge | stretch | main | yes | kneeling lunge: back knee down, front foot forward, hips melt forward, arms can rise |
| figure-four | Figure-Four Hug | stretch | main,winddown | yes | on the back, one ankle crosses over the other knee, hands draw the legs in for a deep seat stretch |
| butterfly | Butterfly Stretch | stretch | main,winddown | no | seated, soles of the feet together, knees wide, gentle fold forward |
| seated-twist | Seated Twist | mobility | main,winddown | yes | seated cross-legged, one hand to opposite knee, slow rotation, eyes follow |
| childs-pose | Child's Pose | stretch | winddown | no | kneeling, hips to heels, arms long on the floor, forehead rests |
| happy-baby | Happy Baby | stretch | winddown | no | on the back, knees toward armpits, hands hold shins/feet, gentle rocking |
| legs-up | Legs-Up Rest | stretch | winddown | no | on the back, legs float straight up toward the ceiling, arms wide and heavy |
| thread-needle | Thread the Needle | stretch | main,winddown | yes | tabletop; one arm slides under the body, shoulder and ear rest down, gentle twist |
| forward-fold | Rag-Doll Fold | stretch | main,winddown | no | standing, knees soft, whole upper body hangs heavy, arms dangle |
| box-breath | Box Breathing | breath | close | no | seated comfortably; in for 4, hold 4, out 4, hold 4 |
| pelvic-breath | Deep Belly Breathing | breath | main,close | no | seated; 360° ribcage breath, on the exhale a gentle lift of the pelvic floor — like sipping a smoothie upward |
| kind-close | Kind Thoughts Close | breath | close | no | seated, hands on heart, slow breaths while the coach speaks kind affirmations |

## exercises.js schema

```js
export const EXERCISES_1 = [   // (or EXERCISES_2 in the second file)
  {
    id: 'cat-cow',             // EXACTLY from the table above
    name: 'Cat–Cow',           // from the table
    tags: ['mobility'],        // from the table; array of: stretch|strength|mobility|breath
    blocks: ['warmup','main'], // from the table; array of: warmup|main|winddown|close
    sided: false,
    secs: 50,                  // 40–60 (breath/close moves may use 60–90)
    why: '1–2 sentences, spoken aloud: a real, plain-language postpartum-relevant benefit (posture after carrying babies, hip mobility, pelvic floor support, back relief, safe core rebuilding). Warm and specific, no jargon, no overclaiming.',
    cues: ['three short form cues', 'spoken mid-exercise', 'each under 12 words'],
  },
]
```

## phrases.js schema

```js
export const PHRASES = {
  styles: {
    gentle:      { welcome: [6], mid: [18], halfway: [5], finishMove: [8], sessionDone: [6], skipAck: [5] },
    cheerleader: { same shape },
    funny:       { same shape },
  },
  affirmations: [12],          // for the kind-close: short, warm, true. e.g. about showing up, strength, patience
  micro: {
    getReady: [5],             // pre-move transitions: 'Next up: {move}' style lines
    switchSides: [4],
    streakSafe: [3],           // grace-day reassurance lines
  },
}
```

- Counts in brackets are MINIMUMS.
- The `{name}` token may appear ONLY as the suffix pattern `, {name}` — the
  engine strips it cleanly when no name is set. `{move}` is replaced with the
  move name in `getReady` lines.
- gentle = soft, permission-giving, present-tense. cheerleader = bright,
  energetic, exclamation-friendly. funny = genuinely witty mom-life humor
  (interrupted-shower energy, toddler chaos, reheated-coffee solidarity) —
  never mocking the user's body or effort.
- No weight-loss talk, no "earn your food", no body-shame, no "bounce back".

## badges.js schema

```js
export const BADGES = [
  { id: 'first-session', name: 'First Bloom', desc: 'one warm sentence',
    icon: '<svg viewBox="0 0 48 48" ...>...</svg>' },
]
```

Fixed badge ids + meanings (14):
first-session, three-in-week, streak-7, first-45, ten-breath-closes,
early-bird (session before 8am), night-owl (after 9pm), comeback-queen
(came back after a grace day saved the streak), garden-bloom (garden reaches
stage 6), level-5, sessions-25, all-durations (tried all four lengths),
bridge-toddlers (10 bridge sessions — pun: 'Bridge Over Troubled Toddlers'),
dog-days (10 downward dogs — pun: 'Downward Dog Days').

Icons: simple, flat, 48×48 viewBox, 2–4 shapes max, palette colors
(#5BA869, #FFD45C, #7EC4E8, #F58F7C, #1F4D2E, #FDF9F0). No text in icons.

## garden.js schema

```js
export const GARDEN_STAGE_SESSIONS = [0, 1, 3, 6, 10, 15, 21, 28, 36];
export function gardenSVG(stage) { return `<svg viewBox="0 0 360 200" ...>…</svg>`; }
```

A charming flat-illustration garden bed that GROWS with stage 0→8:
0 bare soil with one hopeful seed star → 1 first sprout → 2 two sprouts +
leaf pair → 3 small bud → 4 first flower opens → 5 three flowers →
6 flower bed + butterfly → 7 lush bed + second butterfly + bee →
8 full bloom: tall sunflower, many flowers, garden arch. Always: warm sky,
soft sun, soil line. Palette above; rounded shapes; no gradients beyond
2-stop; everything pure SVG, no external refs, no <script>. Reuse shared
shape-building JS helper functions inside the module so each stage composes
prior stages' elements (the garden visibly accumulates, nothing disappears).

## levels (built into gamify.js — for reference only)

XP = minutes moved. Thresholds (cumulative minutes):
L1 Couch Sprout 0, L2 Seedling 15, L3 Gentle Mover 45, L4 Bloomer 90,
L5 Bendy Bean 150, L6 Sunflower 230, L7 Flexi Phenom 330, L8 Mighty Mama 450,
L9 Zen Dynamo 600, L10 Legend (Still No Running) 800.
