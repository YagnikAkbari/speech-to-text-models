const CACHE_NAME = "vosk-cache-v1";

const FILES_TO_CACHE = [
  "/",
  "/manifest.json",
  // "/vosk/vosk.wasm",
  // "/vosk/vosk.js",
  "/vosk/model.7z",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE)),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    }),
  );
});
