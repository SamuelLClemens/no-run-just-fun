# No Run Just Fun 🌻

A free, private, playful stretch-and-strength app for busy women — especially
after pregnancy. No equipment, no accounts, no tracking. A friendly 3D coach
talks you through short yoga-leaning sessions, and a little garden grows every
time you show up.

## Your live app

**https://samuellclemens.github.io/no-run-just-fun/**

Open that link on any phone or computer. That is the whole app — there is
nothing to install or sign up for.

### Put it on your iPhone home screen (recommended)

1. Open the link above in **Safari** on your iPhone.
2. Tap the **Share** button (the square with the arrow).
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **Add**. You now have a "Just Fun" app icon — it even works offline
   after the first visit.

### Share it with friends

Send them the link. That is it. Everyone's progress stays on their own device,
so sharing the link never shares your data.

## Privacy, plainly

- Your streak, garden, badges, and settings are saved **only on your device**
  (in your browser's local storage).
- There is no server, no account, no analytics, and no tracking of any kind.
- Nothing you do in the app is ever sent anywhere, because there is nowhere
  to send it.

## Safety, plainly

This app offers gentle exercise guidance — it is **not medical advice**.
Check with your doctor before starting a new exercise program, especially
within 12 weeks postpartum or with pelvic floor symptoms or diastasis recti.
Every move can be skipped, and anything that hurts should be.

All core work is diastasis-recti-aware: no crunches, no sit-ups, no full
planks — bird dogs, bridges, and breath-led core work instead.

## How to publish an update

The site deploys automatically from the `main` branch via GitHub Pages
(you can watch deployments in the repository's **Actions** tab).

The workflow is always:

1. Create a branch, make changes, and push the branch.
2. Open a pull request into `main` and merge it.
3. GitHub publishes the new version automatically within about a minute.

If you work with Claude Code, you can simply say what you want changed and
ask it to "publish an update" — it follows the branch-and-pull-request rule
automatically. One technical note for maintainers: bump `CACHE_VERSION` in
`sw.js` with every release so installed apps pick up the update.

## What is inside (for the curious)

- Plain HTML/CSS/JavaScript — no build step, no frameworks except
  [Three.js](https://threejs.org) (self-hosted in `lib/`) for the 3D coach.
- The coach's voice is your device's built-in text-to-speech.
- All sounds and music are generated in the browser with the Web Audio API —
  no audio files, no licensing worries.
- Fonts: Fredoka and Nunito (SIL Open Font License), self-hosted.
- 29 movements, 4 coaches, 3 encouragement styles, 10 levels, 14 badges,
  9 garden stages.

Made with 💚 and Claude Code.
