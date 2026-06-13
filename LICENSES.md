# Licenses — every asset in You Got This!

Everything the app ships is either original to this project or used under a
license that permits free public use. Nothing requires payment, attribution
fees, or accounts.

## Bundled in this repository

| Asset | Where | Source | License |
| --- | --- | --- | --- |
| Three.js r160 (minified module) | `lib/three.module.min.js` | https://threejs.org | MIT |
| Fredoka variable font (Latin) | `lib/fonts/fredoka-latin-var.woff2` | Google Fonts | SIL Open Font License 1.1 |
| Nunito variable font (Latin) | `lib/fonts/nunito-latin-var.woff2` | Google Fonts | SIL Open Font License 1.1 |
| Veronica flower logo, lockup, favicons, app icons | `icons/`, inline SVG | Original — generated for this project | Same as the project |
| 3D instructor (rig, all 4 characters, all 29 animations) | `js/avatar.js`, `js/data/poses.js` | Original — procedurally built and hand-keyframed for this project | Same as the project |
| Full instructor model "Vera" (GLB) | `models/vera.glb` | Mixamo character (Adobe), exported and optimized for this project | Mixamo license — royalty-free use in projects; redistribution of the raw asset as a standalone product is not permitted (see note below) |
| GLTFLoader, BufferGeometryUtils (Three.js addons) | `lib/jsm/` | https://threejs.org examples (r160) | MIT |
| Garden art (all 9 stages), badge icons, confetti | `js/data/garden.js`, `js/data/badges.js`, `js/confetti.js` | Original SVG, generated for this project | Same as the project |
| All exercise descriptions, coaching lines, names | `js/data/` | Original writing for this project | Same as the project |
| Chimes, fanfare, sparkle, background music | `js/audio.js` | Generated live by the Web Audio API — no audio files exist | n/a (no asset) |

## Fetched at runtime, only if the user opts in

| Asset | When | Source | License |
| --- | --- | --- | --- |
| kokoro-js (TTS engine) | Only after enabling "Natural voice" in Settings | jsDelivr CDN (npm package) | Apache-2.0 |
| Kokoro-82M voice model (ONNX) | Same opt-in, downloaded once | Hugging Face (`onnx-community/Kokoro-82M-v1.0-ONNX`) | Apache-2.0 |

The default voice uses the device's built-in speech synthesis (Web Speech
API) — part of the browser, nothing downloaded.

No user data is involved in any of these fetches; they are public, static
files. No analytics, trackers, or third-party scripts of any other kind are
loaded, ever.

## Note on the full-instructor model (Mixamo)

The optional "Full instructor" character (`models/vera.glb`) is a Mixamo
character provided by Adobe. Mixamo's terms allow characters and animations to
be used royalty-free in personal, commercial, and non-profit **projects**,
with no attribution required. The one restriction is that the **raw** character
or animation files may not be redistributed or sold *as a standalone asset or
product* (for example, on a 3D asset store or as a template pack). Embedding
the character inside this application — where the product is the fitness app,
not the model — is the intended, permitted use. The model is delivered only to
render the optional instructor and is never offered as a downloadable asset.
Reference: Adobe Mixamo FAQ, https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html
