// Offline support: precache the whole app on install, serve cache-first.
// Bump CACHE_VERSION with every release so updates roll out cleanly.

const CACHE_VERSION = 'nrjf-v1.0.0';

const PRECACHE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  'lib/three.module.min.js',
  'lib/fonts/fredoka-latin-var.woff2',
  'lib/fonts/nunito-latin-var.woff2',
  'js/main.js',
  'js/state.js',
  'js/characters.js',
  'js/tts.js',
  'js/audio.js',
  'js/sessionEngine.js',
  'js/gamify.js',
  'js/player.js',
  'js/avatar.js',
  'js/confetti.js',
  'js/dev.js',
  'js/data/exercises.js',
  'js/data/phrases.js',
  'js/data/badges.js',
  'js/data/garden.js',
  'js/data/poses.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
  'icons/maskable-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => {
        if (req.mode === 'navigate') return caches.match('index.html');
        throw new Error('offline and uncached: ' + req.url);
      });
    }),
  );
});
