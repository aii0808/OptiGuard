const CACHE = 'optiguard-v1'
const SHELL = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  if (new URL(req.url).origin !== location.origin) return // API dan foto: langsung ke jaringan

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const salinan = res.clone()
          caches.open(CACHE).then((c) => c.put(req, salinan))
        }
        return res
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('/')))
  )
})