// Minimal service worker: Chrome only offers "Install app" when the site
// registers one with a fetch handler. Requests stay network-first so a new
// deploy is picked up immediately instead of serving a stale bundle.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request));
});
