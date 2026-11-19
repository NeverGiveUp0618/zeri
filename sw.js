/* 择日学习 Service Worker —— 离线缓存 */
const CACHE = 'zeri-v24-in-page-tabs';
const ASSETS = [
  './',
  './index.html',
  './data.js',
  './data-mountain.js',
  './course.html',
  './course.css',
  './course-embedded.css',
  './site-shell.css',
  './course.js',
  './data-course.js',
  './course-textbook.md',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png'
];
const SHARED = [
  'https://nevergiveup0618.github.io/all-project/notes.js',
  'https://nevergiveup0618.github.io/all-project/reader.js',
  'https://nevergiveup0618.github.io/all-project/guard.js?reload=1'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(async c => {
    await c.addAll(ASSETS);
    await Promise.all(SHARED.map(url=>c.add(url).catch(()=>{})));
  }).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('zeri-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* 网络优先、失败回落缓存：保证在线时拿最新、离线时仍可用 */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if(!res.ok)return caches.match(e.request,{ignoreSearch:true}).then(r=>r||res);
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request,{ignoreSearch:true}).then(r => r || (e.request.mode==='navigate'?caches.match('./index.html'):Response.error())))
  );
});
