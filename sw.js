// キャッシュを一切せず、常にネットワークから最新を取得するService Worker

self.addEventListener('install', (event) => {
    self.skipWaiting(); 
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => caches.delete(key))
        ))
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // http または https 以外の通信（ブラウザの拡張機能など）は無視する
    if (!event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        fetch(event.request).catch((err) => {
            // 通信エラー（オフラインや広告ブロック等）が起きてもクラッシュさせない
            console.warn('通信がブロックされたか、ネットワークエラーです:', event.request.url);
            return new Response('Network error', { status: 408 });
        })
    );
});