const CACHE_NAME = "chip8-v19";

const FILES = [
    "./",
    "./index.html",
    "./main.js",
    "./src/core/cpu.js",
    "./src/devices/video.js",
    "./src/devices/audio.js",
    "./src/devices/keypad.js",
    "./src/assets/fontset.js",
    "./src/system/config.js",
    "./src/system/quirks.js",
    "./styles.css",
    "./manifest.json",
    "./images/icon.jpg",
];


self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => cache.addAll(FILES))
    );
});


self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        )
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
});
