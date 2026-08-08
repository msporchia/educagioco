/* generato dal build — non si modifica a mano (vite.config.js) */
const CACHE = "educagioco-2026.08.08.1622-40c628a+"
const ROBA = ['./', './index.html', './manifest.webmanifest', './icona.svg',
              './icona-192.png', './icona-512.png', './icona-maskable.png',
              './apple-touch-icon.png']

self.addEventListener('install', e => {
  // addAll fallisce tutto se un file solo non c'è: qui si va a uno a uno,
  // perché un'icona mancante non è un buon motivo per restare senza offline
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(ROBA.map(u => c.add(u).catch(() => {}))))
    .then(() => self.skipWaiting()))
})

self.addEventListener('activate', e => {
  // le cache di ogni versione precedente se ne vanno: il nome le distingue
  e.waitUntil(caches.keys()
    .then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n))))
    .then(() => self.clients.claim()))
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)
  if (url.origin !== self.location.origin) return
  // versione.json dice cosa sta servendo il sito adesso: se rispondesse
  // la cache direbbe sempre la versione di questo service worker, cioè
  // proprio la domanda a cui deve rispondere
  if (url.pathname.endsWith('versione.json')) return
  e.respondWith(caches.match(e.request).then(trovato => {
    const dalla_rete = fetch(e.request).then(r => {
      if (r && r.ok) caches.open(CACHE).then(c => c.put(e.request, r.clone()))
      return r
    }).catch(() => trovato)
    return trovato || dalla_rete
  }))
})
