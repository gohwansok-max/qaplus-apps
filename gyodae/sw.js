/* 교대달력 플러스 서비스워커 — scope: /gyodae/ */
const SLUG = 'gyodae';
const CACHE_VERSION = 'v1.0.0';
const SHELL_CACHE = SLUG + '-shell-' + CACHE_VERSION;
const FONT_CACHE = SLUG + '-font-' + CACHE_VERSION;
const SHELL = [
  './', './index.html', './privacy.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png', './icons/favicon-32.png'
];
const SCOPE = new URL('./', self.location).href;
const FONT_HOSTS = ['cdn.jsdelivr.net'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((k) => k.startsWith(SLUG + '-') && k !== SHELL_CACHE && k !== FONT_CACHE)
      .map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // 외부 폰트: stale-while-revalidate
  if (FONT_HOSTS.includes(url.hostname)) {
    e.respondWith((async () => {
      const cache = await caches.open(FONT_CACHE);
      const hit = await cache.match(req);
      const net = fetch(req).then((res) => {
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      }).catch(() => hit || new Response('', { status: 504 }));
      return hit || net;
    })());
    return;
  }

  // 같은 출처라도 이 앱 scope 밖이면 관여하지 않음
  if (url.origin !== self.location.origin || !url.href.startsWith(SCOPE)) return;

  // 페이지 이동: privacy.html은 privacy로, 그 외는 index로 (네트워크 우선, 실패 시 캐시)
  if (req.mode === 'navigate') {
    const isPrivacy = url.pathname.endsWith('/privacy.html');
    const fallback = isPrivacy ? './privacy.html' : './index.html';
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res && res.ok) {
          const cache = await caches.open(SHELL_CACHE);
          cache.put(fallback, res.clone());
          return res;
        }
        throw new Error('bad');
      } catch (_) {
        const cache = await caches.open(SHELL_CACHE);
        return (await cache.match(fallback)) || (await cache.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  // 그 외 정적 파일: 캐시 우선
  e.respondWith((async () => {
    const cache = await caches.open(SHELL_CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    } catch (_) {
      return new Response('', { status: 504 });
    }
  })());
});
