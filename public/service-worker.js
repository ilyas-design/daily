const CACHE = 'our-love-v3'

self.addEventListener('install',  e => { e.waitUntil(self.skipWaiting()) })
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())) })

self.addEventListener('fetch', e => {
  const { request } = e
  const url = new URL(request.url)

  // Navigation requests (HTML) — network-first so updates are always picked up
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then(res => {
          const copy = res.clone()
          caches.open(CACHE).then(c => c.put(request, copy))
          return res
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match('./index.html')))
    )
    return
  }

  // Static assets — cache-first (JS/CSS/images are content-hashed)
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(res => {
          const copy = res.clone()
          caches.open(CACHE).then(c => c.put(request, copy))
          return res
        }).catch(() => new Response('', { status: 503 }))
      })
    )
  }
})
