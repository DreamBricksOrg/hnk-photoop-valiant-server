const CACHE_NAME = 'hnk-photoop-v1';

const APP_SHELL = [
    '/',
    '/termos',
    '/posicione',
    '/qrfoto',
    '/foto',
    '/obrigado',
    '/resultado',
    '/static/css/main.css',
    '/static/css/index.css',
    '/static/css/termos.css',
    '/static/css/posicione.css',
    '/static/css/qrfoto.css',
    '/static/css/foto.css',
    '/static/css/resultado.css',
    '/static/css/obrigado.css',
    '/static/js/main.js',
    '/static/fonts/Heineken-Serif-18-Bold.otf',
    '/static/img/heineken_header.png',
    '/static/img/hnk_photoop_fundo.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
        )
    );
    self.clients.claim();
});

// Network-first: sempre tenta a rede primeiro (evita servir HTML/CSS
// desatualizado) e só cai no cache se estiver offline.
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
