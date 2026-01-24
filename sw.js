const CACHE_NAME = 'crm-cache-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sw.js',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const acceptHeader = request.headers.get('accept') || '';
  const isNavigation = request.mode === 'navigate' || request.destination === 'document';
  const isStaticAsset =
    ['style', 'script', 'image', 'font'].includes(request.destination) ||
    /\.(?:css|js|png|jpg|jpeg|svg|webp|gif|ico|woff2?|ttf)$/i.test(url.pathname);
  const isJsonRequest = acceptHeader.includes('application/json') || url.pathname.startsWith('/api/');

  if (!isSameOrigin) {
    return fetch(request);
  }

  if (isNavigation || url.pathname === '/' || url.pathname.endsWith('/index.html')) {
    return cacheFirst(request);
  }

  if (isStaticAsset) {
    return cacheFirst(request);
  }

  if (isJsonRequest) {
    return networkFirst(request);
  }

  return networkFirst(request);
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    if (request.mode === 'navigate') {
      const fallback = await caches.match('/index.html');
      if (fallback) {
        return fallback;
      }
    }
    throw error;
  }
}
