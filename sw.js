// キャッシュを一切せず、常にネットワークから最新を取得するService Worker

self.addEventListener('install', (event) => {
    // インストール後、すぐに新しいService Workerを有効化
    self.skipWaiting(); 
});

self.addEventListener('activate', (event) => {
    // 古いキャッシュが残っている場合はすべて削除してリセットする
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => caches.delete(key))
        ))
    );
    self.clients.claim();
});

// リクエストに対して常にネットワーク通信（fetch）をそのまま返す
self.addEventListener('fetch', (event) => {
    event.respondWith(fetch(event.request));
});